import log4js from "log4js";
import path from "path";

const level = process.env["NODE_ENV"] === "development" ? "debug" : "info";

function buildDefaultCABasePath() {
  const userHome = process.env["USERPROFILE"] || process.env["HOME"] || "/";
  return path.resolve(userHome, "./.fast-dev");
}

export default function createLogger(space: string) {
  const filename = path.join(buildDefaultCABasePath(), `/logs/${space}.log`);

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

  return log4js.getLogger(space);
}
