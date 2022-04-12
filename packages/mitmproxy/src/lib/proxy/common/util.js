import url from "url";
import tunnelAgent from "tunnel-agent";
import { extend } from "lodash";
import Agent from "./ProxyHttpAgent";
import HttpsAgent from "./ProxyHttpsAgent";
import log from "../../../utils/log";
import { createRightProxy } from "./passes";

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  timeout: 20000,
  freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
  rejectUnauthorized: false
});
const httpAgent = new Agent({
  keepAlive: true,
  timeout: 20000,
  freeSocketTimeout: 30000 // free socket keepalive for 30 seconds
});
let socketId = 0;

let httpsOverHttpAgent;
let httpOverHttpsAgent;
let httpsOverHttpsAgent;

export const getOptionsFormRequest = (req, ssl, externalProxy = null) => {
  const urlObject = url.parse(req.url);
  const defaultPort = ssl ? 443 : 80;
  const protocol = ssl ? "https:" : "http:";
  const headers = { ...req.headers };
  let externalProxyUrl = null;

  if (externalProxy) {
    if (typeof externalProxy === "string") {
      externalProxyUrl = externalProxy;
    } else if (typeof externalProxy === "function") {
      try {
        externalProxyUrl = externalProxy(req, ssl);
      } catch (e) {
        log.error("externalProxy", e);
      }
    }
  }

  delete headers["proxy-connection"];
  let agent = false;
  if (!externalProxyUrl) {
    // keepAlive
    if (headers.connection !== "close") {
      if (protocol === "https:") {
        agent = httpsAgent;
      } else {
        agent = httpAgent;
      }
      headers.connection = "keep-alive";
    }
  } else {
    agent = getTunnelAgent(protocol === "https:", externalProxyUrl);
  }

  const options = {
    protocol: protocol,
    hostname: req.headers.host.split(":")[0],
    method: req.method,
    port: req.headers.host.split(":")[1] || defaultPort,
    path: urlObject.path,
    headers: req.headers,
    agent: agent
  };

  if (
    protocol === "http:" &&
    externalProxyUrl &&
    url.parse(externalProxyUrl).protocol === "http:"
  ) {
    const externalURL = url.parse(externalProxyUrl);
    options.hostname = externalURL.hostname;
    options.port = externalURL.port;
    // support non-transparent proxy
    options.path = `http://${urlObject.host}${urlObject.path}`;
  }

  // mark a socketId for Agent to bind socket for NTLM
  if (req.socket.customSocketId) {
    options.customSocketId = req.socket.customSocketId;
  } else if (headers.authorization) {
    options.customSocketId = req.socket.customSocketId = socketId++;
  }

  return options;
};

export const getTunnelAgent = (requestIsSSL, externalProxyUrl) => {
  const urlObject = url.parse(externalProxyUrl);
  const protocol = urlObject.protocol || "http:";
  let port = urlObject.port;
  if (!port) {
    port = protocol === "http:" ? 80 : 443;
  }
  const hostname = urlObject.hostname || "localhost";

  if (requestIsSSL) {
    if (protocol === "http:") {
      if (!httpsOverHttpAgent) {
        httpsOverHttpAgent = tunnelAgent.httpsOverHttp({
          proxy: {
            host: hostname,
            port: port
          }
        });
      }
      return httpsOverHttpAgent;
    } else {
      if (!httpsOverHttpsAgent) {
        httpsOverHttpsAgent = tunnelAgent.httpsOverHttps({
          proxy: {
            host: hostname,
            port: port
          }
        });
      }
      return httpsOverHttpsAgent;
    }
  } else {
    if (protocol === "http:") {
      // if (!httpOverHttpAgent) {
      //     httpOverHttpAgent = tunnelAgent.httpOverHttp({
      //         proxy: {
      //             host: hostname,
      //             port: port
      //         }
      //     });
      // }
      return false;
    } else {
      if (!httpOverHttpsAgent) {
        httpOverHttpsAgent = tunnelAgent.httpOverHttps({
          proxy: {
            host: hostname,
            port: port
          }
        });
      }
      return httpOverHttpsAgent;
    }
  }
};

const webProcess = createRightProxy("web")();

export const forwardRequest = (req, res, config) => {
  webProcess(req, res, {
    target: `http://${config.host}:${config.port}`,
    transProtocol: config.protocol,
    proxy: {
      host: "127.0.0.1",
      port: 12888
    }
  });
};

export function rewriteCookieProperty(header, config, property) {
  if (Array.isArray(header)) {
    return header.map(headerElement => {
      return rewriteCookieProperty(headerElement, config, property);
    });
  }
  return header.replace(
    new RegExp("(;\\s*" + property + "=)([^;]+)", "i"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in config) {
        newValue = config[previousValue];
      } else if ("*" in config) {
        newValue = config["*"];
      } else {
        // no match, return previous value
        return match;
      }
      if (newValue) {
        // replace value
        return prefix + newValue;
      } else {
        // remove value
        return "";
      }
    }
  );
}

export function hasEncryptedConnection(req) {
  return Boolean(req.connection.encrypted || req.connection.pair);
}

export function getPort(req) {
  const res = req.headers.host ? req.headers.host.match(/:(\d+)/) : "";

  return res ? res[1] : hasEncryptedConnection(req) ? "443" : "80";
}

const SSLReg = /^https|wss/;
const upgradeHeader = /(^|,)\s*upgrade\s*($|,)/i;

export function isSSL(protocol) {
  return SSLReg.test(protocol);
}

/**
 * Copies the right headers from `options` and `req` to
 * `outgoing` which is then used to fire the proxied
 * request.
 *
 * Examples:
 *
 *    common.setupOutgoing(outgoing, options, req)
 *    // => { host: ..., hostname: ...}
 *
 * @param {Object} Outgoing Base object to be filled with required properties
 * @param {Object} Options Config object passed to the proxy
 * @param {ClientRequest} Req Request Object
 * @param {String} Forward String to select forward or target
 *
 * @return {Object} Outgoing Object with all required properties set
 *
 * @api private
 */
export function setupOutgoing(outgoing, options, req, forward) {
  outgoing.port =
    options.target.port || (isSSL(options.transProtocol) ? 443 : 80);

  [
    "host",
    "hostname",
    "socketPath",
    "pfx",
    "key",
    "passphrase",
    "cert",
    "ca",
    "ciphers",
    "secureProtocol"
  ].forEach(e => {
    outgoing[e] = options["target"][e];
  });

  outgoing.method = options.method || req.method;
  outgoing.headers = extend({}, req.headers);

  if (options.headers) {
    extend(outgoing.headers, options.headers);
  }

  if (options.auth) {
    outgoing.auth = options.auth;
  }

  if (options.ca) {
    outgoing.ca = options.ca;
  }

  if (isSSL(options.transProtocol)) {
    outgoing.rejectUnauthorized =
      typeof options.secure === "undefined" ? true : options.secure;
  }

  outgoing.agent = options.agent || false;
  outgoing.localAddress = options.localAddress;

  if (!outgoing.agent) {
    outgoing.headers = outgoing.headers || {};
    if (
      typeof outgoing.headers.connection !== "string" ||
      !upgradeHeader.test(outgoing.headers.connection)
    ) {
      outgoing.headers.connection = "close";
    }
  }

  const outgoingPath = req.url;

  outgoing.path = outgoingPath;

  if (options.changeOrigin) {
    outgoing.headers.host =
      requiresPort(outgoing.port, options.transProtocol) &&
      !hasPort(outgoing.host)
        ? outgoing.host + ":" + outgoing.port
        : outgoing.host;
  }

  return outgoing;
}

export function setupSocket(socket) {
  socket.setTimeout(0);
  socket.setNoDelay(true);

  socket.setKeepAlive(true, 0);

  return socket;
}

export function requiresPort(port, protocol) {
  // eslint-disable-next-line no-param-reassign
  protocol = protocol.split(":")[0];
  // eslint-disable-next-line no-param-reassign
  port = Number(port);

  if (!port) return false;

  switch (protocol) {
    case "http":
    case "ws":
      return port !== 80;

    case "https":
    case "wss":
      return port !== 443;

    case "ftp":
      return port !== 21;

    case "gopher":
      return port !== 70;

    case "file":
      return false;
  }

  return port !== 0;
}

export function hasPort(host) {
  // eslint-disable-next-line no-implicit-coercion
  return !!~host.indexOf(":");
}
