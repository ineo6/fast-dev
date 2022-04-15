import Icon, {
  HeartOutlined,
  HomeOutlined,
  LikeFilled,
  MenuOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SyncOutlined
} from "@ant-design/icons";
import { Popover, Badge } from "antd";
import { useApi } from "../../utils/api";
import { ReactComponent as CloseSvg } from "../../assets/images/close.svg";
import { useEffect } from "react";
import { GitHubUrl } from "../../constants";
import "./index.less";

interface IHeader {
  onProxyClick: any;
  onCertClick: any;
  onUpdateCheck: Function;
  hasCert: boolean;
  platform: string;
  newVersion: IRelease;
  version: string;
}

interface IAboutListProps {
  release: IRelease;
  onUpdateCheck: Function;
  version: string;
}

export interface IRelease {
  body?: string;
  tag_name?: string;
  id?: number;
}

function AboutList({ release, onUpdateCheck, version }: IAboutListProps) {
  const api = useApi();

  useEffect(() => {}, []);

  const openGitHub = () => {
    api.ipc.openExternal(GitHubUrl);
  };

  const onUpdateClick = () => {
    onUpdateCheck();
  };

  return (
    <div className="pop-list w-48">
      <div
        className="h-30 leading-8 cursor-pointer flex items-center"
        onClick={onUpdateClick}
      >
        <SyncOutlined />
        <span className="ml-2 flex justify-between items-center w-full">
          <span>检查更新</span>
          {release.id && (
            <span className="ml-2 pl-2 pr-2 text-white bg-red-400 rounded text-xs">
              New
            </span>
          )}
        </span>
      </div>
      <div className="h-30 leading-8 cursor-pointer" onClick={openGitHub}>
        <HomeOutlined />
        <span className="ml-2">GitHub</span>
      </div>
      <div className="h-30 leading-8">
        <HeartOutlined />
        <span className="ml-2">v{version}</span>
      </div>
    </div>
  );
}

function Header(props: IHeader) {
  const {
    onProxyClick,
    onCertClick,
    hasCert,
    platform,
    newVersion,
    version,
    onUpdateCheck
  } = props;

  const api = useApi();

  const closeWin = () => {
    api.ipc.invoke("closeWin", {});
  };

  const openGitHub = () => {
    api.ipc.openExternal(GitHubUrl);
  };

  return (
    <div className="header flex justify-between items-center">
      <div />
      <div className="flex justify-end items-center">
        <div
          className="flex items-center cursor-pointer mr-6"
          style={{ color: "#1890ff" }}
          onClick={openGitHub}
        >
          <LikeFilled style={{ fontSize: "16px" }} />
          <span className="ml-1">如果觉得喜欢，请Star一下项目</span>
        </div>
        <div
          className="flex items-center cursor-pointer mr-4"
          onClick={onProxyClick}
        >
          <RocketOutlined style={{ fontSize: "16px" }} />
          <span className="ml-1">系统代理</span>
        </div>
        <div
          className="flex items-center cursor-pointer mr-4"
          onClick={onCertClick}
        >
          <SafetyCertificateOutlined
            style={{ fontSize: "16px", color: hasCert ? "#1890ff" : "#eb2f96" }}
          />
          <span className="ml-1">安装证书</span>
        </div>
        <div className="about-list flex">
          <Popover
            placement="bottomRight"
            content={
              <AboutList
                onUpdateCheck={onUpdateCheck}
                release={newVersion}
                version={version}
              />
            }
          >
            <Badge dot={!!newVersion.id}>
              <MenuOutlined style={{ fontSize: "16px" }} />
            </Badge>
          </Popover>
        </div>
        {platform !== "mac" && (
          <Icon
            onClick={closeWin}
            style={{ fontSize: "18px" }}
            component={CloseSvg}
          />
        )}
      </div>
    </div>
  );
}

export default Header;
