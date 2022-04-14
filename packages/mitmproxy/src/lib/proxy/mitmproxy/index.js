import http from "http";
import speedTest from "@fast-dev/fast-ip";
import tlsUtils from "../tls/tlsUtils";
import config from "../common/config";
import log from "../../../utils/log";
import createRequestHandler from "./createRequestHandler";
import createConnectHandler from "./createConnectHandler";
import createFakeServerCenter from "./createFakeServerCenter";
import createUpgradeHandler from "./createUpgradeHandler";
import { forwardRequest } from "../common/util";

export default {
  createProxy(
    {
      port = config.defaultPort,
      caCertPath,
      caKeyPath,
      sslConnectInterceptor,
      createIntercepts,
      getCertSocketTimeout = 1000,
      middlewares = [],
      externalProxy,
      dnsConfig,
      setting,
      forward,
      sniConfig
    },
    callback
  ) {
    // Don't reject unauthorized
    log.info(`CA Cert read in: ${caCertPath}`);
    log.info(`CA private key read in: ${caKeyPath}`);

    if (!caCertPath) {
      // eslint-disable-next-line no-param-reassign
      caCertPath = config.getDefaultCACertPath();
    }
    if (!caKeyPath) {
      // eslint-disable-next-line no-param-reassign
      caKeyPath = config.getDefaultCAKeyPath();
    }

    const rs = this.createCA({ caCertPath, caKeyPath });

    if (rs.create) {
      log.info(`CA Cert saved in: ${caCertPath}`);
      log.info(`CA private key saved in: ${caKeyPath}`);
    }

    // eslint-disable-next-line no-param-reassign
    port = ~~port;

    // 初始化测速
    const { speedTest: speedTestConfig, providers } = dnsConfig;

    if (speedTestConfig) {
      const dnsProviders = speedTestConfig.dnsProviders;
      const map = {};

      for (const dnsProvider of dnsProviders) {
        if (providers[dnsProvider]) {
          map[dnsProvider] = providers[dnsProvider];
        }
      }

      speedTest.initSpeedTest({ ...speedTestConfig, dnsMap: map });
    }

    const requestHandler = createRequestHandler(
      createIntercepts,
      middlewares,
      externalProxy,
      dnsConfig,
      setting
    );

    const upgradeHandler = createUpgradeHandler();

    const fakeServersCenter = createFakeServerCenter({
      caCertPath,
      caKeyPath,
      requestHandler,
      upgradeHandler,
      getCertSocketTimeout
    });

    const connectHandler = createConnectHandler(
      sslConnectInterceptor,
      middlewares,
      fakeServersCenter,
      dnsConfig,
      sniConfig,
      forward
    );

    const server = new http.Server();
    server.listen(port, () => {
      log.info(`fast-dev启动端口: ${port}`);
      server.on("error", e => {
        log.error("server error", e);
      });
      server.on("request", (req, res) => {
        const ssl = false;

        if (forward && forward.enabled) {
          forwardRequest(req, res, { ...forward, protocol: "http" });
        } else {
          requestHandler(req, res, ssl);
        }
      });
      server.on("connect", (req, cltSocket, head) => {
        connectHandler(req, cltSocket, head);
      });

      server.on("upgrade", (req, socket, head) => {
        const ssl = false;
        upgradeHandler(req, socket, head, ssl);
      });
      server.on("clientError", (err, socket) => {
        log.error("client error", err);
        socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      });

      if (callback) {
        callback(server);
      }
    });

    return server;
  },
  createCA(caPaths) {
    return tlsUtils.initCA(caPaths);
  }
};
