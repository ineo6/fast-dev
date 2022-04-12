const HttpsAgentOrigin = require("agentkeepalive").HttpsAgent;

export default class HttpsAgent extends HttpsAgentOrigin {
  getName(option) {
    let name = HttpsAgentOrigin.prototype.getName.call(this, option);
    name += ":";
    if (option.customSocketId) {
      name += option.customSocketId;
    }
    return name;
  }
}
