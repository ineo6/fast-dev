import httpNative from "http";
import httpsNative from "https";
import * as webOutgoing from "./web-outgoing";
import { getPort, hasEncryptedConnection, setupOutgoing } from "../util";

const webOutgoingArr = Object.keys(webOutgoing).map(pass => {
  return webOutgoing[pass];
});

const nativeAgents = { http: httpNative, https: httpsNative };

/**
 * Sets `content-length` to '0' if request is of DELETE type.
 *
 * @param {ClientRequest} Req Request object
 * @param {IncomingMessage} Res Response object
 * @param {Object} Options Config object passed to the proxy
 *
 * @api private
 */
export function deleteLength(req, res, options) {
  if (
    (req.method === "DELETE" || req.method === "OPTIONS") &&
    !req.headers["content-length"]
  ) {
    req.headers["content-length"] = "0";
    delete req.headers["transfer-encoding"];
  }
}

/**
 * Sets timeout in request socket if it was specified in options.
 *
 * @param {ClientRequest} Req Request object
 * @param {IncomingMessage} Res Response object
 * @param {Object} Options Config object passed to the proxy
 *
 * @api private
 */
export function timeout(req, res, options) {
  if (options.timeout) {
    req.socket.setTimeout(options.timeout);
  }
}

/**
 * Sets `x-forwarded-*` headers if specified in config.
 *
 * @param {ClientRequest} Req Request object
 * @param {IncomingMessage} Res Response object
 * @param {Object} Options Config object passed to the proxy
 *
 * @api private
 */
export function XHeaders(req, res, options) {
  if (!options.xfwd) return;

  const encrypted = req.isSpdy || hasEncryptedConnection(req);
  const values = {
    for: req.connection.remoteAddress || req.socket.remoteAddress,
    port: getPort(req),
    proto: encrypted ? "https" : "http"
  };

  ["for", "port", "proto"].forEach(header => {
    req.headers["x-forwarded-" + header] =
      (req.headers["x-forwarded-" + header] || "") +
      (req.headers["x-forwarded-" + header] ? "," : "") +
      values[header];
  });

  req.headers["x-forwarded-host"] =
    req.headers["x-forwarded-host"] || req.headers["host"] || "";
}

/**
 * Does the actual proxying. If `forward` is enabled fires up
 * a ForwardStream, same happens for ProxyStream. The request
 * just dies otherwise.
 *
 * @param {ClientRequest} Req Request object
 * @param {IncomingMessage} Res Response object
 * @param {Object} Options Config object passed to the proxy
 *
 * @api private
 */
export function stream(req, res, options, _, clb) {
  const { http, https } = nativeAgents;

  if (options.forward) {
    // If forward enable, so just pipe the request
    const forwardReq = (options.forward.transProtocol === "https:"
      ? https
      : http
    ).request(setupOutgoing(options.ssl || {}, options, req, "forward"));

    // error handler (e.g. ECONNRESET, ECONNREFUSED)
    // Handle errors on incoming request as well as it makes sense to
    const forwardError = createErrorHandler(forwardReq, options.forward);
    req.on("error", forwardError);
    forwardReq.on("error", forwardError);

    (options.buffer || req).pipe(forwardReq);
    if (!options.target) {
      return res.end();
    }
  }

  // Request initalization
  const httpOptions = setupOutgoing(options.ssl || {}, options, req);

  if (options.proxy && options.transProtocol === "https") {
    if (req.headers.host) {
      httpOptions.path =
        options.transProtocol +
        "://" +
        req.headers.host.split(":")[0] +
        httpOptions.path;
    }
  }

  const proxyReq = (options.transProtocol === "https:" ? https : http).request(
    httpOptions
  );

  // Enable developers to modify the proxyReq before headers are sent
  proxyReq.on("socket", socket => {});

  // allow outgoing socket to timeout so that we could
  // show an error page at the initial request
  if (options.proxyTimeout) {
    proxyReq.setTimeout(options.proxyTimeout, () => {
      proxyReq.abort();
    });
  }

  // Ensure we abort proxy if request is aborted
  req.on("aborted", () => {
    proxyReq.abort();
  });

  // handle errors in proxy and incoming request, just like for forward proxy
  const proxyError = createErrorHandler(proxyReq, options.target);
  req.on("error", proxyError);
  proxyReq.on("error", proxyError);

  function createErrorHandler(proxyReq, url) {
    return function proxyError(err) {
      if (req.socket.destroyed && err.code === "ECONNRESET") {
        // server.emit('econnreset', err, req, res, url);
        return proxyReq.abort();
      }

      if (clb) {
        clb(err, req, res, url);
      } else {
        // server.emit('error', err, req, res, url);
      }
    };
  }

  (options.buffer || req).pipe(proxyReq);

  proxyReq.on("response", proxyRes => {
    // if (server) {
    //   server.emit('proxyRes', proxyRes, req, res);
    // }

    if (!res.headersSent && !options.selfHandleResponse) {
      for (let i = 0; i < webOutgoingArr.length; i++) {
        if (webOutgoingArr[i](req, res, proxyRes, options)) {
          break;
        }
      }
    }

    if (!res.finished) {
      // Allow us to listen when the proxy has completed
      proxyRes.on("end", () => {
        // if (server) server.emit('end', req, res, proxyRes);
      });
      // We pipe to the response unless its expected to be handled by the user
      if (!options.selfHandleResponse) proxyRes.pipe(res);
    } else {
      // if (server) server.emit('end', req, res, proxyRes);
    }
  });
}
