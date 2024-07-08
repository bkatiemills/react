import React from "react";
import {Outlet} from "react-router-dom";
import ArgovisNav from "../nav";

const Layout = () => {
  return (
    <>
      <div className='bg-warning'><p><b>Planned service interruption:</b> Maintenance on Argovis' servers is planned for July 17; service will be intermittent on that day.</p></div>
      <ArgovisNav />
      <Outlet />
    </>
  );
};

export default Layout;