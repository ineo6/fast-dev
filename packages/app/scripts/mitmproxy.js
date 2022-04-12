const server = require("@fast-dev/mitmproxy");
const JSON5 = require("json5");

const configPath = process.argv[2];
const fs = require("fs");
const configJson = fs.readFileSync(configPath);
const config = JSON5.parse(configJson);

config.setting.rootDir = __dirname;
server.start(config);
