import net from "net";
import url from "url";
import log from "../../../utils/log";
import DnsUtil from "../../dns/index";

const localIP = "127.0.0.1";
import defaultDns from "dns";
import matchUtil from "../../../utils/match";
import speedTest from "@fast-dev/fast-ip";

function isSslConnect(sslConnectInterceptors, req, cltSocket, head) {
  for (const intercept of sslConnectInterceptors) {
    const ret = intercept(req, cltSocket, head);

    if (ret === false) {
      return false;
    }
    if (ret === true) {
      return true;
    }
  }
  return false;
}

export default function createConnectHandler(
  sslConnectInterceptor,
  middlewares,
  fakeServerCenter,
  dnsConfig,
  sniConfig,
  forwardConfig
) {
  const sslConnectInterceptors = [];

  sslConnectInterceptors.push(sslConnectInterceptor);

  for (const middleware of middlewares) {
    if (middleware.sslConnectInterceptor) {
      sslConnectInterceptors.push(middleware.sslConnectInterceptor);
    }
  }

  const sniRegexpMap = matchUtil.domainMapRegexply(sniConfig);

  return function connectHandler(req, cltSocket, head) {
    const srvUrl = url.parse(`https://${req.url}`);
    const hostname = srvUrl.hostname;

    log.info("--- fakeServer enter", hostname);

    if (isSslConnect(sslConnectInterceptors, req, cltSocket, head)) {
      fakeServerCenter.getServerPromise(hostname, srvUrl.port).then(
        serverObj => {
          log.info("--- fakeServer connect", hostname);
          connect(req, cltSocket, head, localIP, serverObj.port);
        },
        e => {
          log.error("getServerPromise", e);
        }
      );
    } else if (forwardConfig.enabled) {
      fakeServerCenter
        .getServerPromise(hostname, srvUrl.port, forwardConfig)
        .then(
          serverObj => {
            log.info("--- fakeServer connect", hostname);
            connect(req, cltSocket, head, localIP, serverObj.port);
          },
          e => {
            log.error("getServerPromise", e);
          }
        );
    } else {
      log.info("不拦截请求：", hostname);
      connect(
        req,
        cltSocket,
        head,
        hostname,
        srvUrl.port,
        dnsConfig,
        sniRegexpMap
      );
    }
  };
}

function connect(
  req,
  cltSocket,
  head,
  hostname,
  port,
  dnsConfig,
  sniRegexpMap
) {
  const start = new Date().getTime();
  let isDnsIntercept = null;

  try {
    const options = {
      port,
      host: hostname,
      connectTimeout: 10000
    };

    if (dnsConfig) {
      const dns = DnsUtil.hasDnsLookup(dnsConfig, hostname);
      if (dns) {
        options.lookup = (hostname, options, callback) => {
          const tester = speedTest.getSpeedTester(hostname);
          if (tester) {
            const ip = tester.pickFastAliveIp();
            if (ip) {
              log.info(`-----${hostname} use alive ip:${ip}-----`);
              callback(null, ip, 4);
              return;
            }
          }
          dns.lookup(hostname).then(ip => {
            isDnsIntercept = { dns, hostname, ip };
            if (ip !== hostname) {
              log.info(`-----${hostname} use ip:${ip}-----`);
              callback(null, ip, 4);
            } else {
              defaultDns.lookup(hostname, options, callback);
            }
          });
        };
      }
    }
    const proxySocket = net.connect(options, () => {
      cltSocket.write(
        "HTTP/1.1 200 Connection Established\r\n" +
          "Proxy-agent: fast-dev\r\n" +
          "\r\n"
      );

      proxySocket.write(head);
      proxySocket.pipe(cltSocket);

      cltSocket.pipe(proxySocket);
    });

    cltSocket.on("error", e => {
      log.error("cltSocket error", e.message);
    });
    proxySocket.on("timeout", () => {
      const end = new Date().getTime();
      log.info("代理socket timeout：", hostname, port, end - start + "ms");
    });
    proxySocket.on("error", e => {
      // 连接失败，可能被GFW拦截，或者服务端拥挤
      const end = new Date().getTime();
      log.error(
        "代理连接失败：",
        e.message,
        hostname,
        port,
        end - start + "ms"
      );
      cltSocket.destroy();
      if (isDnsIntercept) {
        const { dns, ip, hostname } = isDnsIntercept;
        dns.count(hostname, ip, true);
        log.error("记录ip失败次数,用于优选ip：", hostname, ip);
      }
    });
    return proxySocket;
  } catch (error) {
    log.error("connect err", error);
  }
}
