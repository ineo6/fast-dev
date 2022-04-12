import http from "http";
import https from "https";
import {
  getPort,
  hasEncryptedConnection,
  isSSL,
  setupOutgoing,
  setupSocket
} from "../util";

/* !
 * Array of passes.
 *
 * A `pass` is just a function that is executed on `req, socket, options`
 * so that you can easily add new checks while still keeping the base
 * flexible.
 */

/*
 * Websockets Passes
 *
 */

/**
 * Does the actual proxying. Make the request and upgrade it
 * send the Switching Protocols request and pipe the sockets.
 *
 * @param {ClientRequest} Req Request object
 * @param {Socket} Websocket
 * @param {Object} Options Config object passed to the proxy
 *
 * @api private
 */
export function stream(req, socket, options, head, clb) {
  let createHttpHeader = function(line, headers) {
    return (
      Object.keys(headers)
        .reduce(
          (head, key) => {
            let value = headers[key];

            if (!Array.isArray(value)) {
              head.push(key + ": " + value);
              return head;
            }

            for (let i = 0; i < value.length; i++) {
              head.push(key + ": " + value[i]);
            }
            return head;
          },
          [line]
        )
        .join("\r\n") + "\r\n\r\n"
    );
  };

  setupSocket(socket);

  if (head && head.length) socket.unshift(head);

  let proxyReq = (isSSL(options.target.protocol) ? https : http).request(
    setupOutgoing(options.ssl || {}, options, req)
  );

  // Error Handler
  proxyReq.on("error", onOutgoingError);
  proxyReq.on("response", res => {
    // if upgrade event isn't going to happen, close the socket
    if (!res.upgrade) {
      socket.write(
        createHttpHeader(
          "HTTP/" +
            res.httpVersion +
            " " +
            res.statusCode +
            " " +
            res.statusMessage,
          res.headers
        )
      );
      res.pipe(socket);
    }
  });

  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
    proxySocket.on("error", onOutgoingError);

    // The pipe below will end proxySocket if socket closes cleanly, but not
    // if it errors (eg, vanishes from the net and starts returning
    // EHOSTUNREACH). We need to do that explicitly.
    socket.on("error", () => {
      proxySocket.end();
    });

    setupSocket(proxySocket);

    if (proxyHead && proxyHead.length) proxySocket.unshift(proxyHead);

    //
    // Remark: Handle writing the headers to the socket when switching protocols
    // Also handles when a header is an array
    //
    socket.write(
      createHttpHeader("HTTP/1.1 101 Switching Protocols", proxyRes.headers)
    );

    proxySocket.pipe(socket).pipe(proxySocket);
  });

  return proxyReq.end(); // XXX: CHECK IF THIS IS THIS CORRECT

  function onOutgoingError(err) {
    if (clb) {
      clb(err, req, socket);
    }
    socket.end();
  }
}

/**
 * WebSocket requests must have the `GET` method and
 * the `upgrade:websocket` header
 *
 * @param {ClientRequest} Req Request object
 * @param {Socket} Websocket
 *
 * @api private
 */

export function checkMethodAndHeader(req, socket) {
  if (req.method !== "GET" || !req.headers.upgrade) {
    socket.destroy();
    return true;
  }

  if (req.headers.upgrade.toLowerCase() !== "websocket") {
    socket.destroy();
    return true;
  }
}

/**
 * Sets `x-forwarded-*` headers if specified in config.
 *
 * @param {ClientRequest} Req Request object
 * @param {Socket} Websocket
 * @param {Object} Options Config object passed to the proxy
 *
 * @api private
 */

export function XHeaders(req, socket, options) {
  if (!options.xfwd) return;

  let values = {
    for: req.connection.remoteAddress || req.socket.remoteAddress,
    port: getPort(req),
    proto: hasEncryptedConnection(req) ? "wss" : "ws"
  };

  ["for", "port", "proto"].forEach(header => {
    req.headers["x-forwarded-" + header] =
      (req.headers["x-forwarded-" + header] || "") +
      (req.headers["x-forwarded-" + header] ? "," : "") +
      values[header];
  });
}
