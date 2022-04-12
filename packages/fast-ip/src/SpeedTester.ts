import _ from "lodash";
import net from "net";
import config from "./config";
import createLogger from "./log";

const log = createLogger("fast-ip");

const DISABLE_TIMEOUT = 60 * 60 * 1000;

interface IAlive {
  time: number;
  host: string;
  status: string;
}

interface IDnsMap {}

interface IpData {
  host: any;
  port: number;
}

class SpeedTester {
  dnsMap: any;
  hostname: string;
  lastReadTime: number;
  ready: boolean;
  alive: IAlive[];
  backupList: any[];
  loadingTest: boolean;
  testCount: number;
  keepCheckId: any;

  constructor({ hostname }: { hostname: string }) {
    this.dnsMap = config.getConfig().dnsMap;
    this.hostname = hostname;
    this.lastReadTime = Date.now();
    this.ready = false;
    this.alive = [];
    this.backupList = [];
    this.keepCheckId = false;

    this.loadingTest = false;

    this.testCount = 0;
    this.test();
  }

  pickFastAliveIp() {
    this.touch();
    if (this.alive.length === 0) {
      this.test();
      return null;
    }
    return this.alive[0].host;
  }

  touch() {
    this.lastReadTime = Date.now();
    if (!this.keepCheckId) {
      this.startChecker();
    }
  }

  startChecker() {
    if (this.keepCheckId) {
      clearInterval(this.keepCheckId);
    }
    this.keepCheckId = setInterval(() => {
      if (Date.now() - DISABLE_TIMEOUT > this.lastReadTime) {
        // 超过很长时间没有访问，取消测试
        clearInterval(this.keepCheckId);
        return;
      }
      if (this.alive.length > 0) {
        this.testBackups();
        return;
      }
      this.test();
    }, config.getConfig().interval);
  }

  async getIpListFromDns(dnsMap: { [x: string]: any }) {
    const ips: any = {};
    const promiseList = [];
    for (const key in dnsMap) {
      const one = this.getFromOneDns(dnsMap[key]).then(ipList => {
        if (ipList) {
          for (const ip of ipList) {
            ips[ip] = 1;
          }
        }
      });
      promiseList.push(one);
    }
    await Promise.all(promiseList);
    const items: IpData[] = [];
    for (const ip in ips) {
      items.push({ host: ip, port: 443 });
    }
    return items;
  }

  async getFromOneDns(dns: any) {
    return await dns._lookup(this.hostname);
  }

  async test() {
    if (
      this.backupList.length === 0 ||
      this.testCount < 10 ||
      this.testCount % 5 === 0
    ) {
      const newList = await this.getIpListFromDns(this.dnsMap);
      const newBackupList = [...newList, ...this.backupList];
      this.backupList = _.unionBy(newBackupList, "host");
    }
    this.testCount++;

    log.info("[speed]", this.hostname, " ips:", this.backupList);
    await this.testBackups();
    if (config.getConfig().notify) {
      config.getConfig().notify({ key: "test" });
    }
  }

  async testBackups() {
    const testAll = [];
    const aliveList: IAlive[] = [];
    for (const item of this.backupList) {
      testAll.push(this.doTest(item, aliveList));
    }
    await Promise.all(testAll);
    this.alive = aliveList;
    this.ready = true;
  }

  async doTest(item: { host: any }, aliveList: IAlive[]) {
    try {
      const ret = await this.testOne(item);
      _.merge(item, ret);
      aliveList.push({ ...ret, ...item });
      aliveList.sort((a, b) => a.time - b.time);
      this.backupList.sort((a, b) => a.time - b.time);
    } catch (e) {
      log.error("[speed] test error", this.hostname, item.host, e.message);
    }
  }

  testOne(item: any): Promise<Omit<IAlive, "host">> {
    const timeout = 5000;
    const { host, port } = item;
    const startTime = Date.now();
    let isOver = false;
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;
      const client = net.createConnection({ host, port }, () => {
        // 'connect' 监听器
        const connectionTime = Date.now();
        isOver = true;
        timeoutId && clearTimeout(timeoutId);
        resolve({ status: "success", time: connectionTime - startTime });
        client.end();
      });
      client.on("end", () => {});
      client.on("error", error => {
        log.error("[speed]test error", this.hostname, host, error.message);
        isOver = true;
        timeoutId && clearTimeout(timeoutId);
        reject(error);
      });

      timeoutId = setTimeout(() => {
        if (isOver) {
          return;
        }
        log.error("[speed] test timeout", this.hostname, host);
        reject(new Error("timeout"));
        client.end();
      }, timeout);
    });
  }
}

export default SpeedTester;
