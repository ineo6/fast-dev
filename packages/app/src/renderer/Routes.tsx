import { HashRouter, Routes, Route } from "react-router-dom";

import BasicLayout from "./layouts/BasicLayout";
import TabLayout from "./layouts/TabLayout";
import ProxyConfig from "./pages/ProxyConfig";
import Log from "./pages/Log";
import Intercepts from "./pages/Intercepts";
import Speed from "./pages/Speed";
import Hosts from "./pages/Hosts";
import Home from "./pages/Home";
import Dns from "./pages/Dns";
import Domain from "./pages/Domain";
import {
  ClusterOutlined,
  GlobalOutlined,
  InteractionOutlined,
  SettingOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import React from "react";

const ConfigMenu = [
  {
    name: "设置",
    component: ProxyConfig,
    index: true
  },
  {
    path: "/config/config",
    name: "设置",
    component: ProxyConfig,
    icon: <SettingOutlined />
  },
  {
    path: "/config/intercepts",
    name: "拦截",
    component: Intercepts,
    icon: <InteractionOutlined />
  },
  {
    path: "/config/speed",
    name: "测速",
    component: Speed,
    icon: <ThunderboltOutlined />
  },
  {
    path: "/config/domain",
    name: "域名",
    component: Domain,
    icon: <GlobalOutlined />
  },
  {
    path: "/config/dns",
    name: "DNS",
    component: Dns,
    icon: <ClusterOutlined />
  }
];

export default function getRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<BasicLayout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="config" element={<TabLayout menu={ConfigMenu} />}>
            <Route index element={<ProxyConfig />} />
            {ConfigMenu.filter(item => item.path).map(item => {
              return (
                <Route
                  path={item.path}
                  name={item.name}
                  key={item.name}
                  element={React.createElement(item.component)}
                />
              );
            })}
          </Route>
          <Route path="log" element={<Log />} />
          <Route path="hosts" element={<Hosts />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
