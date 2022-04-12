import { promisify } from "util";
import doh from "dns-over-http";
import BaseDNS from "./base";
import log from "../../utils/log";
const dohQueryAsync = promisify(doh.query);

export default class DNSOverHTTPS extends BaseDNS {
  constructor(dnsServer) {
    super();
    this.dnsServer = dnsServer;
  }

  async _lookup(hostname) {
    try {
      const result = await dohQueryAsync({ url: this.dnsServer }, [
        { type: "A", name: hostname }
      ]);
      if (result.answers.length === 0) {
        // 说明没有获取到ip
        log.info("该域名没有ip地址解析", hostname);
        return [];
      }
      const ret = result.answers
        .filter(item => {
          return item.type === "A";
        })
        .map(item => {
          return item.data;
        });
      if (ret.length === 0) {
        log.info("该域名没有ipv4地址解析", hostname);
      } else {
        log.info("获取到域名地址：", hostname, JSON.stringify(ret));
      }
      return ret;
    } catch (err) {
      log.info("dns query error", hostname, this.dnsServer, err.message);
      return [];
    }
  }
}
