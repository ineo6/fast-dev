import api from "./api/backend";
import tongji from "./tongji/backend";
import fileSelector from "./file-selector/backend";
import autoStart from "./auto-start/backend";

const modules = {
  api, // 核心接口模块
  fileSelector, // 文件选择模块
  tongji, // 统计模块
  autoStart
};
export default {
  install(context) {
    // eslint-disable-next-line guard-for-in
    for (const module in modules) {
      modules[module].install(context);
    }
  },
  ...modules
};
