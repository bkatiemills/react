import React from "react";
import {Outlet} from "react-router-dom";
import ArgovisNav from "../nav";

const Layout = () => {
  return (
    <>
      <div style={{'padding': '1em', 'backgroundColor': '#ffc107'}}><p style={{'margin':0}}>Looking for the old Argovis experience? See <a href='https://argovis-legacy.colorado.edu'>https://argovis-legacy.colorado.edu</a> until March 31, 2023.</p></div>
      <ArgovisNav />
      <Outlet />
    </>
  );
};

export default Layout;