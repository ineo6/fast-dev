import {
  Button,
  Card,
  Checkbox,
  Tag,
  Switch,
  message,
  InputNumber,
  Form,
  Input,
  Space,
  Select,
  Drawer
} from "antd";
import { useEffect, useRef, useState } from "react";
import _ from "lodash";
import useConfig from "../../components/hooks/useConfig";
import { useApi } from "../../utils/api";
import PageContainer from "../../components/PageContainer";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import HighPriorityDomain from "./HighPriorityDomain";

function Domain() {
  const api = useApi();
  const [config, update] = useConfig();
  const [form] = Form.useForm();
  const [drawerVisble, setDrawerVisble] = useState(false);

  const dnsConfig = config.server?.dns ?? {};

  useEffect(() => {
    if (config && config.server) {
      initData();
    }
  }, [config]);

  const initData = function() {
    const list = [];

    for (const key in config.server.dns.mapping) {
      const value = config.server.dns.mapping[key];
      list.push({
        key,
        value
      });
    }

    form.setFieldsValue({
      dnsMap: list.sort()
    });
  };

  const getDnsSource = () => {
    const options: { value: any; label: any }[] = [];

    _.forEach(dnsConfig.providers, (dnsConf: any, key: any) => {
      options.push({
        value: key,
        label: key
      });
    });

    return options;
  };

  const speedDnsOptions = getDnsSource();
  const highPriorityHosts = config?.server?.dns.speedTest.hostnameList ?? [];

  const handleSubmit = (values: any) => {
    form.submit();
  };

  const showImportantDomain = () => {
    setDrawerVisble(true);
  };

  const onClose = () => {
    setDrawerVisble(false);
  };

  const onFinish = (values: any) => {
    const dnsMap: any = {};

    for (const item of values.dnsMap) {
      if (item.key) {
        dnsMap[item.key] = item.value;
      }
    }

    const nextConfig = _.set(_.cloneDeep(config), "server.dns.mapping", dnsMap);

    update.updateConfig(nextConfig);

    api.config.save(nextConfig).then(() => {
      message.success("???????????????");
    });
  };

  const handleDrawerSave = function(hosts: string[]) {
    const nextConfig = _.set(
      _.cloneDeep(config),
      "server.dns.speedTest.hostnameList",
      hosts
    );

    update.updateConfig(nextConfig);

    api.config.save(nextConfig).then(() => {
      message.success("???????????????");
    });
  };

  return (
    <PageContainer
      footer={[
        <Button key="save" type="primary" onClick={handleSubmit}>
          ??????
        </Button>
      ]}
    >
      <div className="domain">
        <Card>
          <div className="mb-2">
            <div className="mb-4 flex justify-between">
              <div>??????</div>
              <Button onClick={showImportantDomain} type="primary">
                ????????????
              </Button>
            </div>
            <div>
              <Form
                form={form}
                name="dynamic_form_nest_item"
                autoComplete="off"
                onFinish={onFinish}
              >
                <Form.List name="dnsMap">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(field => (
                        <Space key={field.key} align="baseline" size="large">
                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) =>
                              prevValues.dnsMap !== curValues.dnsMap
                            }
                          >
                            {() => (
                              <Form.Item
                                {...field}
                                label="DNS"
                                name={[field.name, "value"]}
                                rules={[
                                  { required: true, message: "?????????DNS" }
                                ]}
                              >
                                <Select
                                  placeholder="?????????DNS"
                                  style={{ width: 130 }}
                                  options={speedDnsOptions}
                                />
                              </Form.Item>
                            )}
                          </Form.Item>
                          <Form.Item
                            {...field}
                            label="??????"
                            name={[field.name, "key"]}
                            rules={[{ required: true, message: "???????????????" }]}
                          >
                            <Input
                              placeholder="???????????????"
                              style={{ minWidth: 200 }}
                            />
                          </Form.Item>

                          <MinusCircleOutlined
                            onClick={() => remove(field.name)}
                          />
                        </Space>
                      ))}

                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          ????????????
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Form>
            </div>
          </div>
        </Card>
        <Drawer
          title="????????????"
          placement="right"
          onClose={onClose}
          visible={drawerVisble}
        >
          {drawerVisble ? (
            <HighPriorityDomain
              list={highPriorityHosts}
              onSubmit={handleDrawerSave}
            />
          ) : null}
        </Drawer>
      </div>
    </PageContainer>
  );
}

export default Domain;
