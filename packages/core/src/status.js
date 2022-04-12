import event from "./event";
import lodash from "lodash";
import log from "./utils/log";
const status = {
  server: { enabled: false },
  proxy: {},
  plugin: {}
};

event.register(
  "status",
  event => {
    lodash.set(status, event.key, event.value);
    log.info("status changed:", event);
  },
  -999
);

export default status;
