import { useMemo, useRef } from "react";

type noop = (...args: any[]) => any;

function useMemoizedFn<T extends noop>(fn: T) {
  if (typeof fn !== "function") {
    console.error(
      `useMemoizedFn expected parameter is a function, got ${typeof fn}`
    );
  }

  const fnRef = useRef<T>(fn);

  // why not write `fnRef.current = fn`?
  // https://github.com/alibaba/hooks/issues/728
  fnRef.current = useMemo(() => fn, [fn]);

  const memoizedFn = useRef<T>();
  if (!memoizedFn.current) {
    memoizedFn.current = function(this: unknown, ...args) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      return fnRef.current.apply(this, args);
    } as T;
  }

  return memoizedFn.current;
}

export default useMemoizedFn;
