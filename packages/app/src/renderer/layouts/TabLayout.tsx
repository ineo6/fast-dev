import {
  NavLink,
  To,
  Routes,
  Route,
  Outlet,
  useLocation,
  useMatch
} from "react-router-dom";
import React, { useState } from "react";
import { Button, Layout } from "antd";
import Menu from "../components/Menu";

import "./TabLayout.less";

const { Header, Content, Footer, Sider } = Layout;

const width = 100;

interface IMenu {
  path: To | string;
  name: string;
  component?: any;
  index?: false;
  icon: any;
}

function SecondMenu({ path, name, icon }: IMenu) {
  const location = useLocation();

  const parentPath = "/config";

  const isMatch = location.pathname === parentPath && path === "/config/config";

  return (
    <div className="page-menu-item">
      <NavLink
        className={({ isActive }) =>
          isActive || isMatch ? "page-menu-item-active" : ""
        }
        to={path}
      >
        <span className="mr-2">{icon}</span>
        {name}
      </NavLink>
    </div>
  );
}

function TabLayout({ menu }: { menu: IMenu[] }) {
  return (
    <Layout style={{ height: "100%" }}>
      <Sider
        width={width}
        theme="light"
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: "100px"
        }}
      >
        <div className="h-screen page-menu">
          {menu
            .filter(item => !item.index)
            .map(item => {
              return (
                <SecondMenu
                  icon={item.icon}
                  path={item.path}
                  name={item.name}
                  key={item.name}
                />
              );
            })}
        </div>
      </Sider>
      <Layout
        className="site-layout h-full overflow-auto"
        style={{ marginLeft: width }}
      >
        <Content style={{}}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default TabLayout;
