const Core = require("@fast-dev/core");

async function setAutoStartForLinux(app, enable = true) {
  const path = app.getPath("exe");
  if (enable) {
    const cmd = `
mkdir -p ~/.config/autostart/
cat >> ~/.config/autostart/fast-dev.desktop <<EOF
[Desktop Entry]
Type=Application
Exec=${path}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name[en_US]=FastDev
Name=FastDev
Comment[en_US]=
Comment=
EOF
`;
    await Core.api.shell.exec(cmd);
  } else {
    const removeStart = "sudo rm ~/.config/autostart/fast-dev.desktop -rf";
    await Core.api.shell.exec(removeStart);
  }
}

export default {
  install(context) {
    const { ipcMain, app } = context;
    // 开启 开机自启动
    ipcMain.on("auto-start", async (event, message) => {
      console.log("auto start", message);
      const isLinux = Core.api.shell.getSystemPlatform() === "linux";
      if (message.value) {
        if (isLinux) {
          await setAutoStartForLinux(app, true);
        } else {
          app.setLoginItemSettings({
            openAtLogin: true,
            openAsHidden: true,
            args: ["--hideWindow", '"true"']
          });
        }

        event.sender.send("auto-start", { key: "enabled", value: true });
      } else {
        if (isLinux) {
          await setAutoStartForLinux(app, false);
        } else {
          app.setLoginItemSettings({
            openAtLogin: false,
            openAsHidden: false,
            args: []
          });
        }

        event.sender.send("auto-start", { key: "enabled", value: false });
      }
    });
  }
};
