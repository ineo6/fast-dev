import http from "http";
import https from "https";
import speedTest from "@fast-dev/fast-ip";
import defaultDns from "dns";
import DnsUtil from "../../dns/index";
import log from "../../../utils/log";
import RequestCounter from "../../choice/RequestCounter";
import { getOptionsFormRequest } from "../common/util";

const MAX_SLOW_TIME = 8000; // 超过此时间 则认为太慢了

export default function createRequestHandler(
  createIntercepts,
  middlewares,
  externalProxy,
  dnsConfig,
  setting
) {
  return async function requestHandler(req, res, ssl) {
    let proxyReq;

    const rOptions = getOptionsFormRequest(req, ssl, externalProxy);

    rOptions.agent.options.rejectUnauthorized = setting.verifySsl;

    if (rOptions.headers.connection === "close") {
      req.socket.setKeepAlive(false);
    } else if (rOptions.customSocketId) {
      // for NTLM
      req.socket.setKeepAlive(true, 60 * 60 * 1000);
    } else {
      req.socket.setKeepAlive(true, 30000);
    }

    const context = {
      rOptions,
      log,
      RequestCounter,
      setting
    };

    let interceptors = createIntercepts(context);

    if (!interceptors) {
      interceptors = [];
    }

    const reqIncpts = interceptors.filter(item => {
      return !!item.requestIntercept;
    });

    // eslint-disable-next-line no-unused-vars
    const resIncpts = interceptors.filter(item => {
      return !!item.responseIntercept;
    });

    const requestInterceptorPromise = () => {
      return new Promise((resolve, reject) => {
        const next = () => {
          resolve();
        };
        try {
          for (const middleware of middlewares) {
            reqIncpts.push(middleware);
          }

          if (reqIncpts && reqIncpts.length > 0) {
            for (const reqIncpt of reqIncpts) {
              if (!reqIncpt.requestIntercept) {
                continue;
              }
              const goNext = reqIncpt.requestIntercept(context, req, res, ssl);
              if (goNext) {
                next();
                return;
              }
            }
            next();
          } else {
            next();
          }
        } catch (e) {
          reject(e);
        }
      });
    };

    function countSlow(isDnsIntercept, type) {
      if (isDnsIntercept) {
        const { dns, ip, hostname } = isDnsIntercept;
        dns.count(hostname, ip, true);
        log.error("记录ip失败次数,用于优选ip：", hostname, ip, type);
      }
      const counter = context.requestCount;
      if (counter) {
        counter.count.doCount(counter.value, true);
        log.error("记录proxy失败次数：", counter.value, type);
      }
    }

    const proxyRequestPromise = async () => {
      rOptions.host = rOptions.hostname || rOptions.host || "localhost";
      return new Promise((resolve, reject) => {
        // use the binded socket for NTLM
        if (
          rOptions.agent &&
          rOptions.customSocketId &&
          rOptions.agent.getName
        ) {
          const socketName = rOptions.agent.getName(rOptions);
          const bindingSocket = rOptions.agent.sockets[socketName];
          if (bindingSocket && bindingSocket.length > 0) {
            bindingSocket[0].once("free", onFree);
            return;
          }
        }
        onFree();

        function onFree() {
          const url = `${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${rOptions.path}`;
          const start = new Date().getTime();

          log.info("代理请求:", url, rOptions.method);

          let isDnsIntercept;

          if (dnsConfig) {
            const dns = DnsUtil.hasDnsLookup(dnsConfig, rOptions.hostname);

            if (dns) {
              rOptions.lookup = (hostname, options, callback) => {
                const tester = speedTest.getSpeedTester(hostname);
                if (tester) {
                  const ip = tester.pickFastAliveIp();
                  if (ip) {
                    log.info(`-----${hostname} use alive ip:${ip}-----`);
                    context.finalIp = ip;
                    callback(null, ip, 4);
                    return;
                  }
                }
                dns.lookup(hostname).then(ip => {
                  isDnsIntercept = { dns, hostname, ip };
                  if (ip !== hostname) {
                    log.info(`----request url :${url},use ip :${ip}----`);
                    context.finalIp = ip;
                    callback(null, ip, 4);
                  } else {
                    log.info(`request url :${url},use hostname :${hostname}`);
                    defaultDns.lookup(hostname, options, (err, ip, family) => {
                      context.finalIp = ip;
                      callback && callback(err, ip, family);
                    });
                  }
                });
              };
            }
          }

          proxyReq = (rOptions.protocol === "https:" ? https : http).request(
            rOptions,
            proxyRes => {
              const end = new Date().getTime();
              const cost = end - start;
              if (rOptions.protocol === "https:") {
                log.info("代理请求返回:", url, cost + "ms");
              }
              if (cost > MAX_SLOW_TIME) {
                countSlow(isDnsIntercept, "to slow  " + cost + "ms");
              }
              resolve(proxyRes);
            }
          );

          proxyReq.on("timeout", () => {
            const end = new Date().getTime();
            const cost = end - start;
            log.error(
              "代理请求超时",
              rOptions.protocol,
              rOptions.hostname,
              rOptions.path,
              cost + "ms"
            );
            countSlow(isDnsIntercept, "to slow  " + cost + "ms");
            proxyReq.end();
            proxyReq.destroy();
            const error = new Error(
              `${rOptions.host}:${rOptions.port}, 代理请求超时`
            );
            error.status = 408;
            reject(error);
          });

          proxyReq.on("error", e => {
            const end = new Date().getTime();
            const cost = end - start;
            log.error(
              "代理请求错误",
              e.code,
              e.message,
              rOptions.hostname,
              rOptions.path,
              cost + "ms"
            );
            countSlow(isDnsIntercept, "error:" + e.message);
            reject(e);
          });

          proxyReq.on("aborted", () => {
            const end = new Date().getTime();
            const cost = end - start;
            log.error(
              "代理请求被取消",
              rOptions.hostname,
              rOptions.path,
              cost + "ms"
            );

            if (cost > MAX_SLOW_TIME) {
              countSlow(isDnsIntercept, "to slow  " + cost + "ms");
            }

            if (res.writableEnded) {
              return;
            }
            reject(new Error("代理请求被取消"));
          });

          req.on("aborted", () => {
            log.error("请求被取消", rOptions.hostname, rOptions.path);
            proxyReq.abort();
            if (res.writableEnded) {
              return;
            }
            reject(new Error("请求被取消"));
          });
          req.on("error", (e, req, res) => {
            log.error("请求错误：", e.errno, rOptions.hostname, rOptions.path);
            reject(e);
          });
          req.on("timeout", () => {
            log.error("请求超时", rOptions.hostname, rOptions.path);
            reject(
              new Error(`${rOptions.hostname}:${rOptions.port}, 请求超时`)
            );
          });
          req.pipe(proxyReq);
        }
      });
    };

    try {
      await requestInterceptorPromise();

      if (res.writableEnded) {
        return false;
      }

      const proxyRes = await proxyRequestPromise();

      proxyRes.on("error", error => {
        countSlow(null, "error:" + error.message);
        log.error("proxy res error", error);
      });

      const responseInterceptorPromise = new Promise((resolve, reject) => {
        const next = () => {
          resolve();
        };

        for (const middleware of middlewares) {
          if (middleware.responseInterceptor) {
            middleware.responseInterceptor(
              context,
              req,
              res,
              proxyReq,
              proxyRes,
              ssl,
              next
            );
          }
        }
        next();
      });

      await responseInterceptorPromise;

      if (!res.headersSent) {
        Object.keys(proxyRes.headers).forEach(key => {
          if (proxyRes.headers[key] !== undefined) {
            // https://github.com/nodejitsu/node-http-proxy/issues/362
            if (/^www-authenticate$/i.test(key)) {
              if (proxyRes.headers[key]) {
                proxyRes.headers[key] =
                  proxyRes.headers[key] && proxyRes.headers[key].split(",");
              }
              // eslint-disable-next-line no-param-reassign
              key = "www-authenticate";
            }
            res.setHeader(key, proxyRes.headers[key]);
          }
        });

        if (proxyRes.statusCode >= 400) {
          countSlow(null, "status return :" + proxyRes.statusCode);
        }
        res.writeHead(proxyRes.statusCode);
        proxyRes.pipe(res);
      }
    } catch (e) {
      if (!res.writableEnded) {
        const status = e.status || 500;
        res.writeHead(status, { "Content-Type": "text/html;charset=UTF8" });
        res.write(`FastDev Error:<br/>
目标网站请求错误：【${e.code}】 ${e.message}<br/>
目标地址：${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${rOptions.path}`);
        res.end();
        log.error("request error", e.message);
      }
    }
  };
}
