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

interface DnsSource {
  name: String;
  server: String;
  type: String;
  cacheSize: Number;
}

function Dns() {
  const api = useApi();
  const [config, update] = useConfig();
  const [form] = Form.useForm();

  const dnsConfig = config.server?.dns ?? {};

  useEffect(() => {
    if (config && config.server) {
      initData();
    }
  }, [config]);

  const initData = function() {
    const list: DnsSource[] = [];

    _.forEach(dnsConfig.providers, (dnsConf: any, key: any) => {
      list.push({
        name: key,
        server: dnsConf.server,
        type: dnsConf.type,
        cacheSize: dnsConf.cacheSize
      });
    });

    form.setFieldsValue({
      source: list.sort()
    });
  };

  const handleSubmit = (values: any) => {
    form.submit();
  };

  const onFinish = (values: any) => {
    const providers: any = {};

    for (const item of values.source) {
      const { name, ...restItem } = item;
      if (name) {
        providers[name] = restItem;
      }
    }

    const nextConfig = _.set(
      _.cloneDeep(config),
      "server.dns.providers",
      providers
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
      <div className="dns">
        <Card>
          <div className="mb-2">
            <div className="mb-4 flex justify-between">
              <div>DNS源</div>
            </div>
            <div>
              <Form
                form={form}
                name="dynamic_form_nest_item"
                autoComplete="off"
                onFinish={onFinish}
              >
                <Form.List name="source">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} align="baseline" size="large">
                          <Form.Item
                            {...restField}
                            label="名称"
                            name={[name, "name"]}
                            rules={[{ required: true, message: "请输入域名" }]}
                          >
                            <Input
                              placeholder="请输入域名"
                              style={{ width: 160 }}
                            />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            label="地址"
                            name={[name, "server"]}
                            rules={[{ required: true, message: "请输入域名" }]}
                          >
                            <Input
                              placeholder="请输入域名"
                              style={{ minWidth: 200 }}
                            />
                          </Form.Item>

                          <MinusCircleOutlined onClick={() => remove(name)} />
                        </Space>
                      ))}

                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() =>
                            add({ type: "https", cacheSize: 1000 })
                          }
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
      </div>
    </PageContainer>
  );
}

export default Dns;
