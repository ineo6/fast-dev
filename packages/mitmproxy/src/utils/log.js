import log4js from "log4js";
import proxyConfig from "../lib/proxy/common/config";
import path from "path";

const level = process.env["NODE_ENV"] === "development" ? "debug" : "info";

const filename = path.join(
  proxyConfig.getDefaultCABasePath(),
  "/logs/server.log"
);

log4js.configure({
  appenders: {
    std: { type: "stdout", level: "debug" },
    file: {
      level: "debug",
      type: "file",
      pattern: "yyyy-MM-dd",
      daysToKeep: 3,
      filename
    }
  },
  categories: { default: { appenders: ["file", "std"], level } }
});
const logger = log4js.getLogger("server");

export default logger;
