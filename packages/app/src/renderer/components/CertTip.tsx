import { Button, message } from "antd";
import { useEffect, useState } from "react";
import { getSystemPlatform } from "../utils";

interface ICertTip {
  config: any;
  api: any;
  setting: any;
  onInstall: any;
  hasCert: Boolean;
}

function CertTip({ config, api, setting, onInstall, hasCert }: ICertTip) {
  const [platform] = useState(getSystemPlatform());

  const onSetupClick = () => {
    onInstall();
    if (platform === "linux") {
      message.success(
        "根证书已成功安装到系统证书库（注意：浏览器仍然需要手动安装）"
      );
    }
  };

  const renderContent = () => {
    if (platform === "mac") {
      return (
        <div>
          <ul>
            <li>1、点击"安装证书"</li>
            <li>2、将根证书"FastDev - local"设置为"始终信任"</li>
          </ul>
          <img className="w-full" src="../assets/images/crt-mac.jpg" alt="" />
        </div>
      );
    } else if (platform === "linux") {
      return (
        <div>
          <ul>
            <li>1、点击"安装证书"</li>
            <li>
              2、Chrome、Edge、Firefox等浏览器不走系统证书，需要在浏览器导入证书
            </li>
          </ul>
        </div>
      );
    } else {
      return (
        <div>
          <ul>
            <li>1、点击“安装证书”，打开证书</li>
            <li>
              2、然后按如下图步骤将根证书添加到<b>信任的根证书颁发机构</b>
            </li>
          </ul>
        </div>
      );
    }
  };

  return (
    <div>
      {!hasCert && (
        <div>
          <Button type="primary" onClick={onSetupClick}>
            安装证书
          </Button>
        </div>
      )}
      <div className="pt-4 pb-4">
        <h2>为什么要安装证书？</h2>
        <p>
          <div>
            <p>
              在开启 <strong className="text-red-500">拦截功能</strong>{" "}
              时必须安装和信任CA根证书，这样软件才能拦截请求并进行处理。
            </p>
            <p>
              通常来说，信任不明来源的证书是十分危险的行为，不过可以放心的是，软件用到的证书是在本地随机生成的，后续也会支持使用自行创建的证书。
            </p>
            {renderContent()}
          </div>
        </p>
      </div>
    </div>
  );
}

export default CertTip;
