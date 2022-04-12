import { Form, Input, Switch, Button, Card, message } from "antd";
import { InfoCircleOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { useApi } from "../../utils/api";
import { useEffect, useState } from "react";
import _ from "lodash";
import PageContainer from "../../components/PageContainer";

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 14 }
};

const ProxyConfig = () => {
  const api = useApi();
  const [config, setConfig] = useState({});
  const [form] = Form.useForm();

  useEffect(() => {
    api.config.reload().then((ret: any) => {
      setConfig(ret);

      form.setFieldsValue(ret);
    });
  }, []);

  const onFinish = (values: any) => {
    console.log("Received values of form: ", values);
    const updatedValues = _.merge(config, values);

    api.config.save(updatedValues).then(() => {
      message.success("设置已保存");

      if (updatedValues.server.enabled) {
        api.server.restart();
      } else {
        api.server.close();
      }
    });
  };

  const handleProxyChange = (checked: boolean) => {
    if (checked) {
      api.proxy.start();
    } else {
      api.proxy.close();
    }
  };

  const onValuesChange = (changedValues: any) => {};

  const onCertClick = async () => {
    console.log(api);
    const value = await api.fileSelector.open();
    if (value != null && value.length > 0) {
      const data = _.cloneDeep(form.getFieldsValue(["server"]));
      console.log("123123123", data.server);

      data.server.setting.rootCaFile.certPath = value[0];

      console.log(form.getFieldsValue());
      form.setFieldsValue({
        server: data.server
      });
    }
  };

  const onKeyClick = async () => {
    const value = await api.fileSelector.open();
    if (value != null && value.length > 0) {
      const data = _.cloneDeep(form.getFieldsValue(["server"]));

      data.server.setting.rootCaFile.keyPath = value[0];

      form.setFieldsValue(data);
    }
  };

  const handleSubmit = () => {
    form.submit();
  };

  const shouldUpdate = (prevValues: any, curValues: any) => {
    return (
      prevValues.server &&
      prevValues.server.forward.enabled !== curValues.server.forward.enabled
    );
  };

  return (
    <PageContainer
      footer={[
        <Button key="save" type="primary" onClick={handleSubmit}>
          保存
        </Button>
      ]}
    >
      <Card style={{ height: "100%" }}>
        <Form
          name="validate_other"
          form={form}
          {...formItemLayout}
          onFinish={onFinish}
          onValuesChange={onValuesChange}
          initialValues={{}}
        >
          <Form.Item label="端口号" name={["server", "port"]}>
            <Input />
          </Form.Item>

          <Form.Item
            name={["server", "intercept", "enabled"]}
            label="启用拦截"
            valuePropName="checked"
            tooltip={{
              title: "拦截模式需要安装证书才能使用！",
              icon: <InfoCircleOutlined />
            }}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={["proxy", "enabled"]}
            label="系统代理"
            valuePropName="checked"
            htmlFor=""
          >
            <Switch onChange={handleProxyChange} />
          </Form.Item>

          <Form.Item
            label="Cert"
            name={["server", "setting", "rootCaFile", "certPath"]}
          >
            <Input addonAfter={<FolderOpenOutlined onClick={onCertClick} />} />
          </Form.Item>

          <Form.Item
            label="Key"
            name={["server", "setting", "rootCaFile", "keyPath"]}
          >
            <Input addonAfter={<FolderOpenOutlined onClick={onKeyClick} />} />
          </Form.Item>

          <Form.Item
            htmlFor=""
            name={["server", "forward", "enabled"]}
            label="转发功能"
            valuePropName="checked"
            tooltip={{
              title: "开启后会将拦截范围以外的请求转发到配置的代理",
              icon: <InfoCircleOutlined />
            }}
          >
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={shouldUpdate}>
            {({ getFieldValue }) => (
              <Form.Item label="转发地址" name={["server", "forward", "host"]}>
                <Input
                  disabled={!getFieldValue(["server", "forward", "enabled"])}
                />
              </Form.Item>
            )}
          </Form.Item>

          <Form.Item noStyle shouldUpdate={shouldUpdate}>
            {({ getFieldValue }) => (
              <Form.Item label="转发端口" name={["server", "forward", "port"]}>
                <Input
                  disabled={!getFieldValue(["server", "forward", "enabled"])}
                />
              </Form.Item>
            )}
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default ProxyConfig;
