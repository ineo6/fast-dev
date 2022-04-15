import { useEffect, useState } from "react";
import { Button, Drawer, message, Modal } from "antd";
import semver from "semver";
import axios from "axios";
import { useApi } from "./utils/api";
import Header, { IRelease } from "./components/Header";
import CertTip from "./components/CertTip";
import RouerContext from "./components/RouteContext";
import { getSystemPlatform } from "./utils";
import "./App.less";
import {
  GitHubDownloadPage,
  GiteeDownloadPage,
  updateCheckUrl
} from "./constants";
import ReactMarkdown from "react-markdown";

export default function App({ children }: { children: any }) {
  const api = useApi();
  const [setting, setSetting] = useState({});
  const [certVisible, setCertVisible] = useState(false);
  const [config, setConfig] = useState({});
  const [hasFooterToolbar, setHasFooterToolbar] = useState(false);
  const [hasCert, setHasCert] = useState(false);
  const [updateIsChecked, setUpdateIsChecked] = useState(false);
  const [pkgInfo, setPkgInfo] = useState<any>({});
  const [newVersion, setNewVersion] = useState<IRelease>({});
  const [isModalVisible, setIsModalVisible] = useState(false);

  const platform = getSystemPlatform();

  const setBodyClass = () => {
    document.body.classList.add(`platform-${platform}`);
  };

  const reloadConfig = () => {
    api.config.reload().then((ret: any) => {
      setConfig(ret);
    });
  };

  const checkRootCa = () => {
    api.setting.load().then((setting: any) => {
      setSetting(setting);

      if (setting.rootCa && (setting.rootCa.setuped || setting.rootCa.noTip)) {
        setHasCert(true);
        return;
      }

      Modal.confirm({
        title: "第一次使用，请先安装CA根证书",
        content: "本应用正常使用，必须安装和信任CA根证书",
        cancelText: "下次",
        okText: "去安装",
        onOk: () => {
          setCertVisible(true);
        }
      });
    });
  };

  const getPkgInfo = async () => {
    const pkgInfo = await api.info.get();

    setPkgInfo(pkgInfo);

    return pkgInfo;
  };

  useEffect(() => {
    reloadConfig();
    getPkgInfo().then(pkgInfo => {
      checkUpdate(pkgInfo, true);
    });

    api.ipc.on("status", (event: any, message: any) => {
      // proxy
      console.log("view on status", event, message);
      const value = message.value;
      const key = message.key;

      // updateStatus(key, value)
    });

    api.status.get().then((basicStatus: any) => {
      console.log("get", basicStatus);

      // init(basicStatus)
    });

    setBodyClass();
    checkRootCa();
  }, []);

  const setSystemProxy = () => {
    api.proxy.start().then((result: any) => {
      message.success("设置成功！");
    });
  };

  const setCert = () => {
    setCertVisible(true);
  };

  const onClose = () => {
    setCertVisible(false);

    checkRootCa();
  };

  const installSetup = async () => {
    await api.shell.setupCa({
      certPath: config.server.setting.rootCaFile.certPath
    });

    setting.rootCa = setting.rootCa || {};
    const rootCa = setting.rootCa;
    rootCa.setuped = true;

    setSetting(setting);

    api.setting.save(setting);
  };

  const checkUpdate = async (pkg: any, auto: Boolean) => {
    try {
      const response = await axios.get(updateCheckUrl, {
        params: {
          id: 1
        }
      });

      if (response.data.code === 0) {
        const versionInfo = response.data.data;

        const nextVersion = semver.parse(versionInfo.tag_name) || "";

        if (semver.gt(nextVersion, pkg.version)) {
          setNewVersion(versionInfo);
          setIsModalVisible(true);
        } else {
          !auto && message.info("已经是最新版本！");
        }
      }
    } catch (e) {
      // 请求失败？
    }
  };

  const openGiteeRelease = () => {
    api.ipc.openExternal(GiteeDownloadPage);

    setIsModalVisible(false);
  };

  const openGithubRelease = () => {
    api.ipc.openExternal(GitHubDownloadPage);

    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const onUpdateCheck = () => {
    checkUpdate(pkgInfo, false);
  };

  return (
    <RouerContext.Provider
      value={{
        siderWidth: 200,
        hasFooterToolbar,
        setHasFooterToolbar
      }}
    >
      <div className="app">
        <Header
          onProxyClick={setSystemProxy}
          onCertClick={setCert}
          hasCert={hasCert}
          platform={platform}
          newVersion={newVersion}
          version={pkgInfo.version}
          onUpdateCheck={onUpdateCheck}
        />
        <div style={{ height: "calc(100vh - 40px)" }}>{children}</div>
        <Drawer
          title="证书安装"
          placement="right"
          onClose={onClose}
          visible={certVisible}
          size="large"
        >
          <CertTip
            hasCert={hasCert}
            config={config}
            api={api}
            setting={setting}
            onInstall={installSetup}
          />
        </Drawer>
        <Modal
          title={`新版本(${newVersion.tag_name})已发布，是否立即升级?`}
          visible={isModalVisible}
          footer={[
            <Button key="back" onClick={handleCancel}>
              取消
            </Button>,
            <Button key="gitee" type="primary" onClick={openGiteeRelease}>
              立即升级(Gitee)
            </Button>,
            <Button key="github" type="primary" onClick={openGithubRelease}>
              立即升级(Github)
            </Button>
          ]}
        >
          <div
            className="overflow-y-auto pl-2 pr-2"
            style={{ height: "340px" }}
          >
            <ReactMarkdown>{newVersion.body || ""}</ReactMarkdown>
          </div>
        </Modal>
      </div>
    </RouerContext.Provider>
  );
}
