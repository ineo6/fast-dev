import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { Button, Layout } from "antd";
import Menu from "../components/Menu";
import { useAnalytics } from "../utils/hooks";

const { Header, Content, Footer, Sider } = Layout;

const width = 100;

function BasicLayout() {
  useAnalytics();

  return (
    <Layout style={{ height: "100%" }}>
      <Sider
        width={width}
        theme="light"
        style={{
          overflow: "auto",
          height: "100%",
          position: "fixed",
          left: 0
        }}
      >
        <Menu />
      </Sider>
      <Layout
        className="site-layout overflow-auto"
        style={{ marginLeft: width, height: "100%" }}
      >
        <Content style={{ overflow: "initial", height: "100%" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default BasicLayout;
