import { baiduAnalyticsMain } from "./analysis";

export default {
  install(context) {
    if (import.meta.env.NODE_ENV === "development") {
      baiduAnalyticsMain(context.ipcMain);
    }
  }
};
