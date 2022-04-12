import {
  ConfigProvider,
  PageHeaderProps,
  SpinProps,
  BreadcrumbProps
} from "antd";
import React, { useContext, useMemo, ReactNode } from "react";
import classNames from "classnames";
import FooterToolbar from "../FooterToolbar";
import PageLoading from "../PageLoading";
import RouteContext from "../RouteContext";
import "./index.less";

export type PageContainerProps = {
  title?: React.ReactNode | false;
  content?: React.ReactNode;
  extraContent?: React.ReactNode;
  prefixCls?: string;
  footer?: ReactNode[];

  /**
   * 只加载内容区域
   *
   * @name 是否加载
   */
  loading?: boolean | SpinProps | React.ReactNode;

  /** @name 配置面包屑 */
  breadcrumb?: BreadcrumbProps;
} & Omit<PageHeaderProps, "title" | "footer">;

function genLoading(spinProps: boolean | SpinProps) {
  if (typeof spinProps === "object") {
    return spinProps;
  }
  return { spinning: spinProps };
}

const PageContainer: React.FC<PageContainerProps> = props => {
  const {
    children,
    loading = false,
    className,
    style,
    footer,
    ghost,
    ...restProps
  } = props;
  const value = useContext(RouteContext);

  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = props.prefixCls || getPrefixCls("pro");

  const prefixedClassName = `${prefixCls}-page-container`;

  const containerClassName = classNames(prefixedClassName, className, {
    [`${prefixCls}-page-container-ghost`]: ghost,
    [`${prefixCls}-page-container-with-footer`]: footer
  });

  const content = useMemo(() => {
    return children ? (
      <>
        <div className={`${prefixedClassName}-children-content`}>
          {children}
        </div>
        {value.hasFooterToolbar && (
          <div
            style={{
              height: 48,
              marginTop: 24
            }}
          />
        )}
      </>
    ) : null;
  }, [children, prefixedClassName, value.hasFooterToolbar]);

  const loadingDom = useMemo(() => {
    // 当loading时一个合法的ReactNode时，说明用户使用了自定义loading,直接返回改自定义loading
    if (React.isValidElement(loading)) {
      return loading;
    }
    // 当传递过来的是布尔值，并且为false时，说明不需要显示loading,返回null
    if (typeof loading === "boolean" && !loading) {
      return null;
    }
    // 如非上述两种情况，那么要么用户传了一个true,要么用户传了loading配置，使用genLoading生成loading配置后返回PageLoading
    const spinProps = genLoading(loading as boolean | SpinProps);
    return <PageLoading {...spinProps} />;
  }, [loading]);

  const renderContentDom = useMemo(() => {
    // 只要loadingDom非空我们就渲染loadingDom,否则渲染内容
    const dom = loadingDom || content;
    return dom;
  }, [loadingDom, content]);

  return (
    <div style={style} className={containerClassName}>
      {renderContentDom && <div>{renderContentDom}</div>}
      {footer && <FooterToolbar prefixCls={prefixCls}>{footer}</FooterToolbar>}
    </div>
  );
};

export default PageContainer;
