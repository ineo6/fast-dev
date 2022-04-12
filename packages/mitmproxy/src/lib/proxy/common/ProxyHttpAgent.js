const AgentOrigin = require("agentkeepalive");

export default class Agent extends AgentOrigin {
  getName(option) {
    let name = AgentOrigin.prototype.getName.call(this, option);
    name += ":";
    if (option.customSocketId) {
      name += option.customSocketId;
    }
    return name;
  }
}
