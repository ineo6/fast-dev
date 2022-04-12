import { Button, Card } from "antd";
import { SetStateAction, useEffect, useState } from "react";
import { useApi } from "../../utils/api";
import PageContainer from "../../components/PageContainer";

function Log() {
  const api = useApi();
  const [configDir, setConfigDir] = useState("");

  useEffect(() => {
    api.info.getConfigDir().then((dir: SetStateAction<string>) => {
      setConfigDir(dir);
    });
  }, []);

  const openLog = async (file: string) => {
    api.ipc.openPath(configDir + "/logs/" + file);
  };

  const openAppLog = () => {
    openLog("app.log");
  };

  const openServerLog = () => {
    openLog("server.log");
  };

  const openCoreLog = () => {
    openLog("core.log");
  };

  const openSpeedLog = () => {
    openLog("fast-ip.log");
  };

  return (
    <PageContainer>
      <div className="log m-4">
        <Card
          onClick={openAppLog}
          title="应用日志"
          style={{ marginBottom: "10px" }}
          hoverable
        >
          {configDir + "/logs/app.log"}
        </Card>
        <Card
          onClick={openServerLog}
          title="Server日志"
          style={{ marginBottom: "10px" }}
          hoverable
        >
          {configDir + "/logs/server.log"}
        </Card>
        <Card
          onClick={openCoreLog}
          title="Core日志"
          style={{ marginBottom: "10px" }}
          hoverable
        >
          {configDir + "/logs/core.log"}
        </Card>
        <Card
          onClick={openSpeedLog}
          title="Speed日志"
          style={{ marginBottom: "10px" }}
          hoverable
        >
          {configDir + "/logs/fast-ip.log"}
        </Card>
      </div>
    </PageContainer>
  );
}

export default Log;
