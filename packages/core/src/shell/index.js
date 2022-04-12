import shell from "./shell";
import killByPort from "./scripts/kill-by-port";
import setupCa from "./scripts/setup-ca";
import getSystemEnv from "./scripts/get-system-env";
import setSystemEnv from "./scripts/set-system-env";
import getNpmEnv from "./scripts/get-npm-env";
import setNpmEnv from "./scripts/set-npm-env";
import setSystemProxy from "./scripts/set-system-proxy";

export default {
  killByPort,
  setupCa,
  getSystemEnv,
  setSystemEnv,
  getNpmEnv,
  setNpmEnv,
  setSystemProxy,
  async exec(cmds, args) {
    return shell.getSystemShell().exec(cmds, args);
  },
  getSystemPlatform: shell.getSystemPlatform
};
