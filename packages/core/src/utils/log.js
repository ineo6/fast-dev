import log4js from "log4js";
import config from "../config/index";
import path from "path";

function getDefaultConfigBasePath() {
  return config.server.setting.userBasePath;
}
const level = process.env["NODE_ENV"] === "development" ? "debug" : "info";
const filename = path.join(getDefaultConfigBasePath(), "/logs/core.log");
log4js.configure({
  appenders: {
    std: { type: "stdout" },
    file: { type: "file", pattern: "yyyy-MM-dd", daysToKeep: 3, filename }
  },
  categories: { default: { appenders: ["file", "std"], level: level } }
});
const logger = log4js.getLogger("core");

export default logger;
