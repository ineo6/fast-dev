import axios from "axios";

export const baiduAnalyticsMain = ipcMain => {
  if (!(ipcMain && ipcMain.on)) {
    throw new TypeError(`require ipcMain`);
  }
  ipcMain.on("baidu-analytics-electron-message", (event, siteId) => {
    axios
      .get(`https://hm.baidu.com/hm.js?${siteId}`, {
        headers: {
          referer: "https://hm.baidu.com/"
        }
      })
      .then(res => {
        const define = /\(h\.b\.a\.su=h\.b\.a\.u\|\|document\.location\.href\),h\.b\.a\.u=(\w+)\.protocol\+\"\/\/\"\+document\.location\.host\+/;
        if (res && res.data && define.test(res.data)) {
          let text = res.data;
          const replaceDefine =
            '(h.b.a.su=h.b.a.u||"https://"+c.dm[0]+a[1]),h.b.a.u="https://"+c.dm[0]+';
          const replaceHref =
            '"https://"+c.dm[0]+window.location.pathname+window.location.hash';
          text = text
            .replace(define, replaceDefine)
            .replace(/window\.location\.href/g, replaceHref)
            .replace(/document\.location\.href/g, replaceHref);

          event.sender.send("baidu-analytics-electron-reply", { text });
        }
      });
  });
};

export const baiduAnalyticsRenderer = (ipcRenderer, siteId, initCallback) => {
  if (!(ipcRenderer && ipcRenderer.on && ipcRenderer.send)) {
    throw new TypeError(`require ipcRenderer`);
  }

  if (!(siteId && typeof siteId === "string")) {
    throw new TypeError(`require siteId`);
  }

  // 添加默认行为避免报错
  window._hmt = window._hmt || [];

  ipcRenderer.on("baidu-analytics-electron-reply", (_, { text }) => {
    window._hmt = window._hmt || [];
    // eslint-disable-next-line no-undef
    _hmt.push(["_setAutoPageview", false]);

    if (initCallback && typeof initCallback === "function") {
      initCallback(window._hmt);
    }

    let hm = document.createElement("script");
    hm.text = text;

    let head = document.getElementsByTagName("head")[0];
    head.appendChild(hm);
  });

  ipcRenderer.send("baidu-analytics-electron-message", siteId);
};
