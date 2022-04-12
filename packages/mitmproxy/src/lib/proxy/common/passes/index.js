import { URL } from "url";
import * as web from "./web-incoming";
import * as ws from "./ws-incoming";

const webArr = Object.keys(web).map(pass => {
  return web[pass];
});

const wsArr = Object.keys(ws).map(pass => {
  return ws[pass];
});

export function createRightProxy(type) {
  return function() {
    return function(req, res /* , [head], [opts] */) {
      const passes = type === "ws" ? wsArr : webArr;
      const args = [].slice.call(arguments);
      let cntr = args.length - 1;
      let head;
      let cbl;

      /* optional args parse begin */
      if (typeof args[cntr] === "function") {
        cbl = args[cntr];

        cntr--;
      }

      let requestOptions = {};

      if (!(args[cntr] instanceof Buffer) && args[cntr] !== res) {
        requestOptions = args[cntr];

        cntr--;
      }

      console.log("requestOptions", requestOptions);

      if (args[cntr] instanceof Buffer) {
        head = args[cntr];
      }

      ["target"].forEach(e => {
        if (typeof requestOptions[e] === "string")
          requestOptions[e] = new URL(requestOptions[e]);
      });

      if (!requestOptions.target) {
        console.log("Must provide a proper URL as target");
        return;
      }

      console.log(passes);

      for (let i = 0; i < passes.length; i++) {
        if (passes[i](req, res, requestOptions, head, cbl)) {
          break;
        }
      }
    };
  };
}
