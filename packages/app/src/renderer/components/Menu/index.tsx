import { Link, NavLink, useLocation } from "react-router-dom";
import "./index.less";

function Menu() {
  const location = useLocation();

  const parentPath = "/config";

  const isHomeMatch = location.pathname === "/";

  return (
    <div className="menu">
      <div className="nav">
        {/* <div className='nav-item'> */}
        {/*    <NavLink */}
        {/*      className={({ isActive }) => isActive || isHomeMatch ? 'nav-item-active' : ""} */}
        {/*      to="home" */}
        {/*    > */}
        {/*      首页 */}
        {/*    </NavLink> */}
        {/*  </div> */}
        <div className="nav-item">
          <NavLink
            className={({ isActive }) => (isActive ? "nav-item-active" : "")}
            to="config"
          >
            代理
          </NavLink>
        </div>
        {/* <div className='nav-item'> */}
        {/*  <NavLink */}
        {/*    className={({ isActive }) => isActive ? 'nav-item-active' : ""} */}
        {/*    to="hosts" */}
        {/*  > */}
        {/*    Hosts */}
        {/*  </NavLink> */}
        {/* </div> */}
        <div className="nav-item">
          <NavLink
            className={({ isActive }) => (isActive ? "nav-item-active" : "")}
            to="log"
          >
            日志
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default Menu;
