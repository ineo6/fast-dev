import React, { useContext, useEffect, useMemo, ReactNode } from "react";
import { ConfigProvider } from "antd";
import classNames from "classnames";

import "./index.less";
import RouteContext, { RouteContextType } from "../RouteContext";

export interface FooterToolbarProps {
  extra?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  renderContent?: (
    props: FooterToolbarProps & RouteContextType & { leftWidth?: string },
    dom: JSX.Element
  ) => ReactNode;
  prefixCls?: string;
}

const FooterToolbar: React.FC<FooterToolbarProps> = props => {
  const {
    children,
    className,
    extra,
    style,
    renderContent,
    prefixCls,
    ...restProps
  } = props;
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);

  const mixPrefixCls = props.prefixCls || getPrefixCls("pro");
  const baseClassName = `${mixPrefixCls}-footer-bar`;
  const value = useContext(RouteContext);
  const width = useMemo(() => {
    const { siderWidth } = value;

    // 0 or undefined
    if (!siderWidth) {
      return "100%";
    }
    return `calc(100% - ${siderWidth}px)`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.siderWidth]);

  const dom = (
    <>
      <div className={`${baseClassName}-left`}>{extra}</div>
      <div className={`${baseClassName}-right`}>{children}</div>
    </>
  );

  /** 告诉 props 是否存在 footerBar */
  useEffect(() => {
    if (!value || !value?.setHasFooterToolbar) {
      return () => {};
    }
    value?.setHasFooterToolbar(true);
    return () => {
      value?.setHasFooterToolbar?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={classNames(className, `${baseClassName}`)}
      style={{ width, ...style }}
      {...restProps}
    >
      {renderContent
        ? renderContent(
            {
              ...props,
              ...value,
              leftWidth: width
            },
            dom
          )
        : dom}
    </div>
  );
};

export default FooterToolbar;
