import lodash from "lodash";
import { ipcRenderer, shell } from "electron";
import { notification } from "antd";
import front from "../../common/bridge/front";

let inited = false;

export let apiObj = {};

function applyModules(app, api) {
  front.install(app, api);
}

export function apiInit(app) {
  const invoke = (api, args) => {
    return ipcRenderer.invoke("apiInvoke", [api, args]).catch(e => {
      notification["error"]({
        message: "Api invoke error",
        description: e.message
      });
    });
  };
  const send = (channel, message) => {
    console.log("do send,", channel, message);
    return ipcRenderer.send(channel, message);
  };

  apiObj.ipc = {
    on(channel, callback) {
      ipcRenderer.on(channel, callback);
    },
    removeAllListeners(channel) {
      ipcRenderer.removeAllListeners(channel);
    },
    invoke,
    send,
    openExternal(href) {
      shell.openExternal(href);
    },
    openPath(file) {
      shell.openPath(file);
    }
  };

  const bindApi = (api, param1) => {
    lodash.set(apiObj, api, param2 => {
      return invoke(api, param2 || param1);
    });
  };

  if (!inited) {
    return invoke("getApiList").then(list => {
      inited = true;
      for (const item of list) {
        bindApi(item);
      }
      console.log("api inited:", apiObj);

      applyModules(app, apiObj);

      return apiObj;
    });
  }

  return new Promise(resolve => {
    resolve(apiObj);
  });
}

export function useApi() {
  return apiObj;
}
