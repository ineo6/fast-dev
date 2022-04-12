const proxyHeaderKey = {
  source: "__fast-dev__",
  ip: "__fast-dev-ip__"
};

export default {
  responseInterceptor(context, req, res, proxyReq, proxyRes, ssl, next) {
    res.setHeader(proxyHeaderKey.source, true);

    if (context && context.finalIp) {
      res.setHeader(proxyHeaderKey.ip, context.finalIp);
    }

    next();
  }
};
