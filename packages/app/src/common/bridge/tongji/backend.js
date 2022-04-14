import { baiduAnalyticsMain } from "./analysis";

export default {
  install(context) {
    if (process.env.NODE_ENV === "development") {
      baiduAnalyticsMain(context.ipcMain);
    }
  }
};
