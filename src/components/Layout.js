import "../css/layout.css";
import Plotly from "plotly.js/dist/plotly";
import Paper from "./Paper";
import Cesium from "./Cesium";
import TopBar from "./Navbar";

import { useState, useEffect } from "react";
import SplitPane from "react-split-pane";

function Layout() {
  //  document.body.style.zoom = 0.75;
  const handleChange = (event) => {
    var i = 0;
    while (document.getElementById(`plot-${i}`)) {
      var plot = document.getElementById(`plot-${i}`);
      var update = {
        width: event,
      };
      Plotly.relayout(`plot-${i}`, update);
      i++;
    }
  };
  return (
    <>
      <TopBar />
      <SplitPane
        split="vertical"
        defaultSize="60%"
        onDragFinished={handleChange}
      >
        <Paper />
        <Cesium />
      </SplitPane>
    </>
  );
}

export default Layout;
