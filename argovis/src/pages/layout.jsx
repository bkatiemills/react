import React from "react";
import {Outlet} from "react-router-dom";
import ArgovisNav from "../nav";

const Layout = () => {
  return (
    <>
      <ArgovisNav />
      <Outlet />
    </>
  );
};

export default Layout;