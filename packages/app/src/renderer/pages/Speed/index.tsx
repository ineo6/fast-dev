import {
  Button,
  Card,
  Checkbox,
  Tag,
  Switch,
  message,
  InputNumber
} from "antd";
import { useEffect, useRef, useState } from "react";
import _ from "lodash";
import useConfig from "../../components/hooks/useConfig";
import { useApi } from "../../utils/api";
import PageContainer from "../../components/PageContainer";

function HostCard({ title, backupList }: { title: String; backupList: any }) {
  return (
    <div className="mb-4">
      <Card title={title} size="small">
        <div>
          {backupList.map((tag: any) => {
            return (
              <Tag key={tag.host}>
                {tag.host}
                {tag.time ? `/${tag.time}ms` : null}
              </Tag>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Speed() {
  const [speedTestList, setSpeedTestList] = useState([]);
  const api = useApi();
  const [config, update] = useConfig();
  const timer = useRef();

  const dnsConfig = config.server?.dns ?? {};
  const speedTest = config.server?.dns?.speedTest ?? {};

  useEffect(() => {
    registerSpeedTestEvent();

    return () => {
      clearInterval(timer.current);
      api.ipc.removeAllListeners("speed");
    };
  }, [config]);

  const getDnsSource = () => {
    const options: { value: any; label: any }[] = [];

    _.forEach(dnsConfig.providers, (dnsConf, key) => {
      options.push({
        value: key,
        label: key
      });
    });

    return options;
  };

  const speedDnsOptions = getDnsSource();

  const registerSpeedTestEvent = () => {
    const listener = async (event: any, message: any) => {
      if (message.key === "getList") {
        setSpeedTestList(message.value);
      }
    };
    api.ipc.on("speed", listener);

    timer.current = setInterval(() => {
      api.server.getSpeedTestList();
    }, 5000);
  };

  const onProviderChange = (value: any) => {
    update.updateConfig(
      _.set(_.cloneDeep(config), "server.dns.speedTest.dnsProviders", value)
    );
  };

  const reSpeedTest = () => {
    api.server.reSpeedTest();
  };

  const reloadAllSpeedTester = () => {
    api.server.getSpeedTestList();
  };

  const toggle = (checked: Boolean) => {
    update.updateConfig(
      _.set(_.cloneDeep(config), "server.dns.speedTest.enabled", checked)
    );
  };

  const handleSubmit = () => {
    api.config.save(config).then(() => {
      message.success("???????????????");
    });
  };

  const onIntervalChange = (value: number) => {
    update.updateConfig(
      _.set(_.cloneDeep(config), "server.dns.speedTest.interval", value)
    );
  };

  return (
    <PageContainer
      footer={[
        <Button key="save" type="primary" onClick={handleSubmit}>
          ??????
        </Button>
      ]}
    >
      <div className="speed">
        <Card>
          <div className="mb-6">
            ???????????????
            <Switch checked={speedTest.enabled} onChange={toggle} />
          </div>

          <div className="mb-2">
            <div>Dns??????</div>
            <Checkbox.Group
              options={speedDnsOptions}
              value={speedTest.dnsProviders}
              onChange={onProviderChange}
            />
          </div>

          <div className="mb-2">
            <div className="mb-1">???????????????ms???</div>
            <InputNumber
              value={speedTest.interval}
              step="1000"
              min={1000}
              onChange={onIntervalChange}
            />
          </div>

          <div className="mt-8 flex justify-end">
            <Button className="mr-4" type="primary" onClick={reSpeedTest}>
              ??????????????????
            </Button>
            <Button type="primary" onClick={reloadAllSpeedTester}>
              ??????
            </Button>
          </div>

          <div className="mt-4">
            {speedTestList.map((item: any) => {
              return (
                <HostCard
                  key={item.hostname}
                  title={item.hostname}
                  backupList={item.backupList}
                />
              );
            })}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

export default Speed;
