import path from "path";
import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  dialog,
  powerMonitor,
  clipboard,
  nativeTheme,
  Notification
} from "electron";
import url from "url";
import minimist from "minimist";

import backend from "../common/bridge/backend";
import isDev from "electron-is-dev";
import log from "../common/log";
import { generateHTTPProxyUrl, generateSocksProxyUrl } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Core = require("@fast-dev/core");

const isMac = process.platform === "darwin";

let win: BrowserWindow | null;

let tray: Tray | null; // 防止被内存清理
let forceClose = false;
Core.api.config.reload();

const config = Core.api.config.get();

let hideDockWhenWinClose = config.app.dock.hideWhenWinClose || false;

function setTray() {
  let iconPath = path.join(__dirname, "../assets/icons/logo@32x.png");
  const macIconPath = path.join(__dirname, "../assets/tray/iconTemplate.png");

  const trayMenuTemplate = [
    {
      label: "FastDev",
      click: () => {
        showWin();
      }
    },
    { type: "separator" },
    {
      type: "checkbox",
      label: "系统代理",
      checked: config.server.enabled,
      click: () => {
        Core.api.proxy.start();
      }
    },
    {
      label: "复制终端代理命令",
      click: () => {
        const port = config.server.port;

        clipboard.writeText(
          [
            `export https_proxy=${generateHTTPProxyUrl(port)}`,
            `http_proxy=${generateHTTPProxyUrl(port)}`,
            `all_proxy=${generateSocksProxyUrl(port)}`
          ].join(" ")
        );

        new Notification({
          title: "复制终端代理命令",
          body: "复制成功"
        }).show();
      }
    },
    {
      label: "复制终端代理取消命令",
      click: () => {
        clipboard.writeText(
          ["unset http_proxy", "unset https_proxy", "unset all_proxy"].join(" ")
        );

        new Notification({
          title: "取消终端代理命令",
          body: "复制成功"
        }).show();
      }
    },
    {
      label: "退出",
      click: () => {
        log.info("force quit");
        forceClose = true;
        quit();
      }
    }
  ];

  const appTray = new Tray(isMac ? macIconPath : iconPath);

  if (isMac) {
    nativeTheme.on("updated", () => {
      if (nativeTheme.shouldUseDarkColors) {
        console.log("i am dark.");
      } else {
        console.log("i am light.");
      }
    });
  }

  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

  // 设置托盘悬浮提示
  appTray.setToolTip("FastDev");
  // 单击托盘小图标显示应用
  appTray.on("click", () => {
    // 显示主程序
    showWin();
  });

  appTray.on("right-click", () => {
    setTimeout(() => {
      appTray.popUpContextMenu(contextMenu);
    }, 200);
  });

  return appTray;
}

function isLinux() {
  const platform = Core.api.shell.getSystemPlatform();
  return platform === "linux";
}

function hideWin() {
  if (win) {
    if (isLinux()) {
      quit();
      return;
    }
    win.hide();
    if (isMac && hideDockWhenWinClose) {
      app.dock.hide();
    }
  }
}

function showWin() {
  if (win) {
    win.show();
  }
  app.dock.show();
}

function changeAppConfig(config: { hideDockWhenWinClose: null }) {
  if (config.hideDockWhenWinClose != null) {
    hideDockWhenWinClose = config.hideDockWhenWinClose;
  }
}

function createWindow(startHideWindow: boolean) {
  win = new BrowserWindow({
    width: 900,
    height: 640,
    titleBarStyle: "hiddenInset",
    frame: false,
    webPreferences: {
      devTools: true,
      contextIsolation: false,
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: true
    },
    show: !startHideWindow,
    icon: path.join(__dirname, "../assets/icons/icon.ico")
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, "../renderer/index.html"),
        protocol: "file:",
        slashes: true
      })
    );
  }

  if (startHideWindow) {
    hideWin();
  }

  win.on("closed", async () => {
    win = null;
    tray = null;
  });

  win.on("close", e => {
    if (!forceClose) {
      e.preventDefault();
      hideWin();
    }
  });

  win.on("session-end", async (e: any) => {
    log.info("session-end", e);
    await quit();
  });
}

async function beforeQuit() {
  return Core.api.shutdown();
}

async function quit() {
  if (tray) {
    tray.displayBalloon({ title: "正在关闭", content: "关闭中,请稍候。。。" });
  }
  await beforeQuit();
  forceClose = true;
  app.quit();
}

function setDock() {
  if (isMac) {
    app.whenReady().then(() => {
      app.dock.setIcon(path.join(__dirname, "../assets/icons/logo@32x.png"));
    });
  }
}

app.disableHardwareAcceleration();

let startHideWindow = false;

if (process.argv) {
  const args = minimist(process.argv);
  if (args.hideWindow) {
    startHideWindow = true;
  }

  log.info("start args", args);
}

if (app.getLoginItemSettings().wasOpenedAsHidden) {
  startHideWindow = true;
}

log.info("start hide window", startHideWindow, app.getLoginItemSettings());

const isFirstInstance = app.requestSingleInstanceLock();
if (!isFirstInstance) {
  log.info("is second instance");
  setTimeout(() => {
    app.quit();
  }, 1000);
} else {
  app.on("before-quit", async () => {
    log.info("before-quit");
    if (process.platform === "darwin") {
      quit();
    }
  });
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    log.info("new app started", commandLine);
    if (win) {
      showWin();
      win.focus();
    }
  });

  // Quit when all windows are closed.
  app.on("window-all-closed", () => {
    log.info("window-all-closed");
    if (process.platform !== "darwin") {
      quit();
    }
  });

  app.on("activate", () => {
    if (win == null) {
      createWindow(false);
    } else {
      showWin();
    }
  });

  app.on("ready", async () => {
    try {
      createWindow(startHideWindow);
      const context = {
        win,
        app,
        beforeQuit,
        quit,
        ipcMain,
        dialog,
        log,
        api: Core.api,
        changeAppConfig
      };
      backend.install(context);
    } catch (err) {
      log.info("err", err);
    }

    try {
      // 最小化到托盘
      tray = setTray();
    } catch (err) {
      log.info("err", err);
    }

    powerMonitor.on("shutdown", async (e: any) => {
      e.preventDefault();
      log.info("系统关机，恢复代理设置");
      await quit();
    });
  });
}

setDock();

if (isDev) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        quit();
      }
    });
  } else {
    process.on("SIGINT", () => {
      quit();
    });
  }
}
// 系统关机和重启时的操作
process.on("exit", () => {
  log.info("进程结束，退出app");
  quit();
});
