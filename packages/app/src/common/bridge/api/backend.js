import lodash from "lodash";
import { ipcMain } from "electron";
import fs from "fs";
import JSON5 from "json5";
import path from "path";
import log from "../../log";

const Core = require("@fast-dev/core");

const mitmproxyPath = path.join(__dirname, "../mitmproxy.js");

const getDefaultConfigBasePath = function() {
  return Core.api.config.get().server.setting.userBasePath;
};
const localApi = {
  /**
   * 返回所有api列表，供vue来ipc调用
   * @returns {[]}
   */
  getApiList() {
    const core = lodash.cloneDeep(Core.api);
    const local = lodash.cloneDeep(localApi);

    lodash.merge(core, local);

    const list = [];
    _deepFindFunction(list, core, "");

    return list;
  },
  info: {
    get() {
      const pk = require(path.join(__dirname, "../package.json"));

      return {
        ...pk
      };
    },
    getConfigDir() {
      return getDefaultConfigBasePath();
    },
    getSystemPlatform() {
      return Core.api.shell.getSystemPlatform();
    }
  },
  /**
   * 软件设置
   */
  setting: {
    load() {
      const settingPath = _getSettingsPath();
      let setting = {};

      if (fs.existsSync(settingPath)) {
        const file = fs.readFileSync(settingPath);
        setting = JSON5.parse(file.toString());
        if (!setting) {
          setting = {};
        }
      }

      if (!setting.installTime) {
        setting.installTime = new Date().getTime();
        localApi.setting.save(setting);
      }
      return setting;
    },
    save(setting = {}) {
      const settingPath = _getSettingsPath();
      fs.writeFileSync(settingPath, JSON5.stringify(setting, null, 2));
    }
  },
  /**
   * 启动所有
   * @returns {Promise<void>}
   */
  startup() {
    return Core.api.startup({ mitmproxyPath });
  },
  server: {
    /**
     * 启动代理服务
     * @returns {Promise<{port: *}>}
     */
    start() {
      return Core.api.server.start({ mitmproxyPath });
    },
    /**
     * 重启代理服务
     * @returns {Promise<void>}
     */
    restart() {
      return Core.api.server.restart({ mitmproxyPath });
    }
  },
  closeWin() {
    const { win } = coreBackend.context;

    win && win.isClosable() && win.close();
  }
};

function _deepFindFunction(list, parent, parentKey) {
  // eslint-disable-next-line guard-for-in
  for (const key in parent) {
    const item = parent[key];
    if (item instanceof Function) {
      list.push(parentKey + key);
    } else if (item instanceof Object) {
      _deepFindFunction(list, item, parentKey + key + ".");
    }
  }
}

function _getSettingsPath() {
  const dir = getDefaultConfigBasePath();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir + "/setting.json";
}

function invoke(api, param) {
  let target = lodash.get(localApi, api);
  if (!target) {
    target = lodash.get(Core.api, api);
  }
  if (!target) {
    log.info("找不到此接口方法：", api);
  }
  const ret = target(param);
  // log.info('api:', api, 'ret:', ret)
  return ret;
}

async function doStart() {
  // 开启自动下载远程配置
  await Core.api.config.startAutoDownloadRemoteConfig();
  // 启动所有
  localApi.startup();
}

const coreBackend = {
  context: {},
  install(context) {
    const { win } = context;

    coreBackend.context = context;

    // 接收view的方法调用
    ipcMain.handle("apiInvoke", async (event, args) => {
      const api = args[0];
      let param;
      if (args.length >= 2) {
        param = args[1];
      }
      return invoke(api, param);
    });
    // 注册从core里来的事件，并转发给view
    Core.api.event.register("status", event => {
      log.info("bridge on status", event);
      win.webContents.send("status", { ...event });
    });
    Core.api.event.register("error", event => {
      log.error("bridge on error", event);
      win.webContents.send("error.core", event);
    });
    Core.api.event.register("speed", event => {
      win.webContents.send("speed", event);
    });

    // 合并用户配置
    Core.api.config.reload();
    doStart();
  },
  fastDevCore: Core,
  invoke
};

export default coreBackend;
