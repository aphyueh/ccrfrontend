/*!

=========================================================
* Black Dashboard React v1.2.2
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/black-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React , { useState , useRef } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";

// core components
import AdminNavbar from "components/Navbars/AdminNavbar.js";
import Footer from "components/Footer/Footer.js";
import Sidebar from "components/Sidebar/Sidebar.js";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.js";

import routes from "routes.js";
import Dashboard from "views/Dashboard.js";


import logo from "assets/img/react-logo.png";
import { BackgroundColorContext } from "contexts/BackgroundColorContext";
import NotificationAlert from "react-notification-alert"

function Admin(props) {
  const location = useLocation();
  const mainPanelRef = React.useRef(null);
  const mainScrollbarRef = React.useRef(null);
  const tableScrollbarsRef = React.useRef([]);
  const [sidebarOpened, setsidebarOpened] = React.useState(
    document.documentElement.className.indexOf("nav-open") !== -1
  );
  const initTableScrollbars = React.useCallback(() => {
    if (navigator.platform.indexOf("Win") > -1) {
      tableScrollbarsRef.current.forEach((scrollbar) => scrollbar.destroy());
      tableScrollbarsRef.current = [];
      const tables = document.querySelectorAll(".table-responsive");
      tableScrollbarsRef.current = Array.from(tables).map(
        (table) => new PerfectScrollbar(table)
      );
    }
  }, []);
  React.useEffect(() => {
    if (navigator.platform.indexOf("Win") > -1 && mainPanelRef.current) {
      document.documentElement.classList.add("perfect-scrollbar-on");
      document.documentElement.classList.remove("perfect-scrollbar-off");
      mainScrollbarRef.current = new PerfectScrollbar(mainPanelRef.current, {
        suppressScrollX: true,
      });
      initTableScrollbars();
    }
    return function cleanup() {
      if (mainScrollbarRef.current) {
        mainScrollbarRef.current.destroy();
        mainScrollbarRef.current = null;
      }
      tableScrollbarsRef.current.forEach((scrollbar) => scrollbar.destroy());
      tableScrollbarsRef.current = [];
      if (navigator.platform.indexOf("Win") > -1) {
        document.documentElement.classList.add("perfect-scrollbar-off");
        document.documentElement.classList.remove("perfect-scrollbar-on");
      }
    };
  }, [initTableScrollbars]);
  React.useEffect(() => {
    initTableScrollbars();
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    if (mainPanelRef.current) {
      mainPanelRef.current.scrollTop = 0;
    }
  }, [location, initTableScrollbars]);
  // this function opens and closes the sidebar on small devices
  const toggleSidebar = () => {
    document.documentElement.classList.toggle("nav-open");
    setsidebarOpened(!sidebarOpened);
  };
  const [notifications, setNotifications] = useState([]);
  const notificationAlertRef = useRef(null);

  const notify = (type, message) => {
    const options = {
      place: "tr", // bottom right
      message: (
        <div>
          <div>
            <b>
              {type === "success" ? "Success - " : 
               type === "danger" ? "Error - " : 
               type === "info" ? "" : ""}
            </b>
            {message}
          </div>
        </div>
      ),
      type: type, // "success" or "danger"
      icon: type === "info" ? "tim-icons icon-notes" : "tim-icons icon-bell-55",
      autoDismiss: 5,
    };
    notificationAlertRef.current.notificationAlert(options);
    
    // Save plain text notification for the navbar dropdown
    const plainMessage =
      (type === "success" ? "Success - " :
      type === "danger" ? "Error - " :
      type === "info" ? "" : "") + message;

    setNotifications((prev) => {
      const updated = [...prev, plainMessage];
      return updated.slice(-10); // Keep max 10 latest
    });
  };  
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route path={prop.path} element={<prop.component notify={notify} />} key={key} exact />
        );
      } else {
        return null;
      }
    });
  };
  const getBrandText = (path) => {
    for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return "Brand";
  };
  return (
    <BackgroundColorContext.Consumer>
      {({ color, changeColor }) => (
        <React.Fragment>
          <NotificationAlert ref={notificationAlertRef} />
          <div className="wrapper">
            <Sidebar
              routes={routes}
              logo={{
                outterLink: "https://github.com/aphyueh/CCRWebsite",
                text: "MDS07",
                imgSrc: logo,
              }}
              toggleSidebar={toggleSidebar}
            />
            <div className="main-panel" ref={mainPanelRef} data={color}>
              <AdminNavbar
                brandText={getBrandText(location.pathname)}
                toggleSidebar={toggleSidebar}
                sidebarOpened={sidebarOpened}
                notifications={notifications}
              />
              <Routes>
                {getRoutes(routes)}
                <Route
                  path="/"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
              </Routes>
              {
                <Footer fluid />
              }
            </div>
          </div>
          <FixedPlugin bgColor={color} handleBgClick={changeColor} />
        </React.Fragment>
      )}
    </BackgroundColorContext.Consumer>
  );
}

export default Admin;
