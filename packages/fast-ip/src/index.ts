import SpeedTester from "./SpeedTester";
import _ from "lodash";
import config from "./config";
import createLogger from "./log";
import { IConfig } from "./type";

const log = createLogger("fast-ip");

const SpeedTestPool: any = {};

let conf: IConfig;

function initSpeedTest(runtimeConfig: { enabled: any; hostnameList: any }) {
  const { enabled, hostnameList } = runtimeConfig;
  log.info("runtimeConfig", runtimeConfig);
  const conf = config.getConfig();
  _.merge(conf, runtimeConfig);
  if (!enabled) {
    return;
  }
  _.forEach(hostnameList, hostname => {
    SpeedTestPool[hostname] = new SpeedTester({ hostname });
  });
  log.info("[speed] enabled");
}

interface ISpeed {
  hostname: string;
  alive: string;
  backupList: any[];
}

function getAllSpeedTester() {
  const allSpeed: ISpeed[] = [];
  if (!config.getConfig().enabled) {
    return allSpeed;
  }
  _.forEach(SpeedTestPool, (item, key) => {
    allSpeed.push({
      hostname: key,
      alive: item.alive,
      backupList: item.backupList
    });
  });
  return allSpeed;
}

function getSpeedTester(hostname: string) {
  if (!config.getConfig().enabled) {
    return;
  }
  let instance = SpeedTestPool[hostname];
  if (instance == null) {
    instance = new SpeedTester({ hostname });
    SpeedTestPool[hostname] = instance;
  }
  return instance;
}

function registerNotify(notify: Function) {
  conf.notify = notify;
}

function reSpeedTest() {
  _.forEach(SpeedTestPool, (item, key) => {
    item.test();
  });
}

function action(event: any) {
  if (event.key === "reTest") {
    reSpeedTest();
  } else if (event.key === "getList") {
    process.send!({
      type: "speed",
      event: { key: "getList", value: getAllSpeedTester() }
    });
  }
}

export default {
  SpeedTester,
  initSpeedTest,
  getSpeedTester,
  getAllSpeedTester,
  registerNotify,
  reSpeedTest,
  action
};
