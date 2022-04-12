import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, message, Select, Space } from "antd";
import { useEffect, useState } from "react";

interface IHighPriorityDomain {
  list: string[];
  onSubmit: any;
}

function HighPriorityDomain({ list, onSubmit }: IHighPriorityDomain) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      highPriorityHosts: list
    });
  }, []);

  const onFinish = (values: any) => {
    console.log(values);
    onSubmit(values.highPriorityHosts);
  };

  const checkHost = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }

    const matchResult = value.match(
      /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/
    );

    if (matchResult && matchResult[0] === value) {
      return Promise.resolve();
    }

    return Promise.reject(new Error("请输入正确的域名！"));
  };

  return (
    <div>
      <Form
        form={form}
        name="dynamic_form_nest_item"
        autoComplete="off"
        onFinish={onFinish}
      >
        <Form.List name="highPriorityHosts">
          {(fields, { add, remove }) => (
            <>
              {fields.map(field => (
                <Space key={field.key} align="baseline" size="large">
                  <Form.Item
                    {...field}
                    label="域名"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: "请输入域名"
                      },
                      { validator: checkHost }
                    ]}
                  >
                    <Input placeholder="请输入域名" style={{ minWidth: 200 }} />
                  </Form.Item>

                  <MinusCircleOutlined onClick={() => remove(field.name)} />
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
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            保存
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default HighPriorityDomain;
