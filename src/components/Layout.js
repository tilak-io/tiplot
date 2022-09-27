import "../css/layout.css";
import Paper from "./Paper";
import Cesium from "./Cesium";
import TopBar from "./Navbar";

import { useState, useEffect } from "react";
import SplitPane from "react-split-pane";

function Layout() {
  return (
    <>
      <TopBar />
      <SplitPane split="vertical" defaultSize="60%">
        <Paper />
        <Cesium />
      </SplitPane>
    </>
  );
}

export default Layout;
