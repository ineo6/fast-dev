import dnstls from "dns-over-tls";
import BaseDNS from "./base";
import log from "../../utils/log";

export default class DNSOverTLS extends BaseDNS {
  async _lookup(hostname) {
    const { answers } = await dnstls.query(hostname);

    const answer = answers.find(
      answer => answer.type === "A" && answer.class === "IN"
    );

    log.info("dns lookup：", hostname, answer);
    if (answer) {
      return answer.data;
    }
  }
}
