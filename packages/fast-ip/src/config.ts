import { IConfig } from "./type";

const config: IConfig = {
  notify() {},
  dnsMap: {},
  enabled: false
};

export default {
  getConfig() {
    return config as IConfig;
  }
};
