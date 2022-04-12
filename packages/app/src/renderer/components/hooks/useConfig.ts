import { useEffect, useState, useCallback } from "react";
import { useApi } from "../../utils/api";
import useMemoizedFn from "./useMemoizedFn";

type IUseConfigResult = [IConfig, { updateConfig: Function }];

interface IConfig {}

export default function useConfig(): IUseConfigResult {
  const api = useApi();
  const [config, setConfig] = useState<IConfig>({});

  useEffect(() => {
    api.config.reload().then((ret: any) => {
      setConfig(ret);
    });
  }, []);

  const setCurrentState = useCallback(currentState => {
    /** if component is unmounted, stop update */
    console.log("currentState", currentState);
    setConfig(currentState);
  }, []);

  return [
    config,
    {
      updateConfig: setCurrentState
    }
  ];
}
