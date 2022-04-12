import { useEffect, useState } from "react";

function useStorageState<T>(key: string) {
  let storage: Storage | undefined;

  useEffect(() => {
    import { useApi } from "./utils/api";
  }, []);

  return [state, useMemoizedFn(updateState)];
}
