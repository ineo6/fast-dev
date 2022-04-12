import path from "path";

const config = {};

config.caCertFileName = "fast-dev.crt";

config.caKeyFileName = "fast-dev.pem";

config.defaultPort = 1181;

config.caName = "FastDev - local";

config.caBasePath = buildDefaultCABasePath();

config.getDefaultCABasePath = function() {
  return config.caBasePath;
};
config.setDefaultCABasePath = function(path) {
  config.caBasePath = path;
};
function buildDefaultCABasePath() {
  const userHome = process.env["USERPROFILE"] || process.env["HOME"] || "/";
  return path.resolve(userHome, "./.fast-dev");
}

config.getDefaultCACertPath = function() {
  return path.resolve(config.getDefaultCABasePath(), config.caCertFileName);
};

config.getDefaultCAKeyPath = function() {
  return path.resolve(config.getDefaultCABasePath(), config.caKeyFileName);
};

export default config;
