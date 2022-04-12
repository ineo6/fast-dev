import BaseDNS from "./base";
import axios from "axios";
import log from "../../utils/log";

export default class DNSOverIpAddress extends BaseDNS {
  async _lookup(hostname) {
    const url = `https://${hostname}.ipaddress.com`;

    // const res = fs.readFileSync(path.resolve(__dirname, './data.txt')).toString()
    const res = await axios.get(url);
    if (res.status !== 200 && res.status !== 201) {
      log.info(`[dns] get ${hostname} ipaddress: error:${res}`);
      return;
    }
    const ret = res.data;

    const regexp = /<tr><th>IP Address<\/th><td><ul class="comma-separated"><li>([^<]*)<\/li><\/ul><\/td><\/tr>/gm;
    const matched = regexp.exec(ret);
    let ip = null;

    if (matched && matched.length >= 1) {
      ip = matched[1];
      log.info(`[dns] get ${hostname} ipaddress:${ip}`);
      return [ip];
    }
    log.info(`[dns] get ${hostname} ipaddress: error`);
    return null;
  }
}
