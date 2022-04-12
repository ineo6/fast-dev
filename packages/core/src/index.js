import expose from "./expose.js";
import log from "./utils/log";
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// 避免异常崩溃
process.on("uncaughtException", err => {
  if (err.code === "ECONNABORTED") {
    return;
  }
  log.error("uncaughtException", err);
});

process.on("unhandledRejection", (reason, p) => {
  log.error("Unhandled Rejection at: Promise", p, "reason:", reason);
});

export default expose;
