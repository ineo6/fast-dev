import { URL, format } from "url";
import { rewriteCookieProperty } from "../util";

const redirectRegex = /^201|30(1|2|7|8)$/;

/**
 * If is a HTTP 1.0 request, remove chunk headers
 *
 * @param {ClientRequest} Req Request object
 * @param {IncomingMessage} Res Response object
 * @param {proxyResponse} Res Response object from the proxy request
 *
 * @api private
 */
export function removeChunked(req, res, proxyRes) {
  if (req.httpVersion === "1.0") {
    delete proxyRes.headers["transfer-encoding"];
  }
}

/**
 * If is a HTTP 1.0 request, set the correct connection header
 * or if connection header not present, then use `keep-alive`
 *
 * @param {ClientRequest} Req Request object
 * @param {IncomingMessage} Res Response object
 * @param {proxyResponse} Res Response object from the proxy request
 *
 * @api private
 */
export function setConnection(req, res, proxyRes) {
  if (req.httpVersion === "1.0") {
    proxyRes.headers.connection = req.headers.connection || "close";
  } else if (req.httpVersion !== "2.0" && !proxyRes.headers.connection) {
    proxyRes.headers.connection = req.headers.connection || "keep-alive";
  }
}

export function setRedirectHostRewrite(req, res, proxyRes, options) {
  if (
    (options.hostRewrite || options.autoRewrite || options.protocolRewrite) &&
    proxyRes.headers["location"] &&
    redirectRegex.test(proxyRes.statusCode)
  ) {
    const target = new URL(options.target);
    const u = new URL(proxyRes.headers["location"]);

    // make sure the redirected host matches the target host before rewriting
    if (target.host !== u.host) {
      return;
    }

    if (options.hostRewrite) {
      u.host = options.hostRewrite;
    } else if (options.autoRewrite) {
      u.host = req.headers["host"];
    }

    if (options.protocolRewrite) {
      u.protocol = options.protocolRewrite;
    }

    proxyRes.headers["location"] = format(u);
  }
}

/**
 * Copy headers from proxyResponse to response
 * set each header in response object.
 *
 * @param {ClientRequest} Req Request object
 * @param {IncomingMessage} Res Response object
 * @param {proxyResponse} Res Response object from the proxy request
 * @param {Object} Options options.cookieDomainRewrite: Config to rewrite cookie domain
 *
 * @api private
 */
export function writeHeaders(req, res, proxyRes, options) {
  let rewriteCookieDomainConfig = options.cookieDomainRewrite;
  let rewriteCookiePathConfig = options.cookiePathRewrite;
  let preserveHeaderKeyCase = options.preserveHeaderKeyCase;
  let rawHeaderKeyMap;
  let setHeader = function(key, header) {
    if (header === undefined) return;

    if (rewriteCookieDomainConfig && key.toLowerCase() === "set-cookie") {
      // eslint-disable-next-line no-param-reassign
      header = rewriteCookieProperty(
        header,
        rewriteCookieDomainConfig,
        "domain"
      );
    }
    if (rewriteCookiePathConfig && key.toLowerCase() === "set-cookie") {
      // eslint-disable-next-line no-param-reassign
      header = rewriteCookieProperty(header, rewriteCookiePathConfig, "path");
    }
    res.setHeader(String(key).trim(), header);
  };

  if (typeof rewriteCookieDomainConfig === "string") {
    // also test for ''
    rewriteCookieDomainConfig = { "*": rewriteCookieDomainConfig };
  }

  if (typeof rewriteCookiePathConfig === "string") {
    // also test for ''
    rewriteCookiePathConfig = { "*": rewriteCookiePathConfig };
  }

  if (preserveHeaderKeyCase && proxyRes.rawHeaders !== undefined) {
    rawHeaderKeyMap = {};
    for (let i = 0; i < proxyRes.rawHeaders.length; i += 2) {
      const key = proxyRes.rawHeaders[i];
      rawHeaderKeyMap[key.toLowerCase()] = key;
    }
  }

  Object.keys(proxyRes.headers).forEach(key => {
    const header = proxyRes.headers[key];
    if (preserveHeaderKeyCase && rawHeaderKeyMap) {
      // eslint-disable-next-line no-param-reassign
      key = rawHeaderKeyMap[key] || key;
    }
    setHeader(key, header);
  });
}

/**
 * Set the statusCode from the proxyResponse
 *
 * @param {ClientRequest} Req Request object
 * @param {IncomingMessage} Res Response object
 * @param {proxyResponse} Res Response object from the proxy request
 *
 * @api private
 */
export function writeStatusCode(req, res, proxyRes) {
  if (proxyRes.statusMessage) {
    res.statusCode = proxyRes.statusCode;
    res.statusMessage = proxyRes.statusMessage;
  } else {
    res.statusCode = proxyRes.statusCode;
  }
}
