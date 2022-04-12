import React from "react";
import ReactDOM from "react-dom";
import { message, Modal } from "antd";
import "./assets/index.css";
import "./assets/tailwind.css";
import getRoutes from "./Routes";
import App from "./App";
import { apiInit } from "./utils/api.js";

const app = {
  message,
  confirm: Modal.confirm
};

apiInit(app).then((api: any) => {
  ReactDOM.render(
    <React.StrictMode>
      <App>{getRoutes()}</App>
    </React.StrictMode>,
    document.getElementById("root")
  );
});
