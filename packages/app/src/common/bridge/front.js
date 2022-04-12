import error from "./error/front";
import fileSelector from "./file-selector/front";
import autoStart from "./auto-start/front";

const modules = {
  error,
  fileSelector, // 文件选择模块
  autoStart
};
export default {
  install(app, api, router) {
    // eslint-disable-next-line guard-for-in
    for (const module in modules) {
      modules[module].install(app, api, router);
    }
  },
  ...modules
};
