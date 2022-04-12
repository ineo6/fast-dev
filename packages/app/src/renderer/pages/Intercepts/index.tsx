import { useApi } from "../../utils/api";
import { useEffect, useRef, useState } from "react";
import { JsonEditor as Editor } from "jsoneditor-react";
import ace from "brace";
import "brace/mode/json";
import "brace/theme/github";
import PageContainer from "../../components/PageContainer";
import { Button } from "antd";
import _ from "lodash";
import useConfig from "../../components/hooks/useConfig";

const Intercepts = () => {
  const api = useApi();
  const [intercepts, setIntercepts] = useState({});
  const jsonEditorRef = useRef();
  const [config, update] = useConfig();

  useEffect(() => {
    api.config.reload().then((ret: any) => {
      setIntercepts(ret.server.intercepts);
    });
  }, []);

  useEffect(() => {
    const editor =
      jsonEditorRef &&
      jsonEditorRef.current &&
      jsonEditorRef.current.jsonEditor;
    if (editor && intercepts) {
      editor.update(intercepts);
    }
  }, [jsonEditorRef, intercepts]);

  const onJsonChange = (value: any) => {
    console.log(value);
    setIntercepts(value);
  };

  const handleSubmit = () => {
    console.log(intercepts);
    const updatedValues = _.set(
      _.cloneDeep(config),
      "server.intercepts",
      intercepts
    );

    api.config.save(updatedValues).then(() => {
      if (config.server.enabled) {
        api.server.restart();
      }
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
      <Editor
        ref={jsonEditorRef}
        htmlElementProps={{ style: { height: "calc(100vh - 136px)" } }}
        value={intercepts}
        mode="code"
        ace={ace}
        onChange={onJsonChange}
      />
    </PageContainer>
  );
};

export default Intercepts;
