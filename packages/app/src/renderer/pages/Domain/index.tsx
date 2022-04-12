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
      message.success("设置已保存");
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
      message.success("设置已保存");
    });
  };

  return (
    <PageContainer
      footer={[
        <Button key="save" type="primary" onClick={handleSubmit}>
          保存
        </Button>
      ]}
    >
      <div className="domain">
        <Card>
          <div className="mb-2">
            <div className="mb-4 flex justify-between">
              <div>域名</div>
              <Button onClick={showImportantDomain} type="primary">
                高优域名
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
                                  { required: true, message: "请选择DNS" }
                                ]}
                              >
                                <Select
                                  placeholder="请选择DNS"
                                  style={{ width: 130 }}
                                  options={speedDnsOptions}
                                />
                              </Form.Item>
                            )}
                          </Form.Item>
                          <Form.Item
                            {...field}
                            label="域名"
                            name={[field.name, "key"]}
                            rules={[{ required: true, message: "请输入域名" }]}
                          >
                            <Input
                              placeholder="请输入域名"
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
                          添加记录
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
          title="高优域名"
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
