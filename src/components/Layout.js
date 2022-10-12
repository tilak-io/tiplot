import "../css/layout.css";
import { useEffect } from "react";
import Plotly from "plotly.js/dist/plotly";
import Paper from "./Paper";
import Cesium from "./Cesium";
import TopBar from "./Navbar";

import SplitPane from "react-split-pane";

function Layout({ socket }) {
  //document.body.style.zoom = 0.75;
  useEffect(() => {}, []);

  const handleChange = (event) => {
    var i = 0;
    while (document.getElementById(`plot-${i}`)) {
      var update = {
        width: event,
      };
      Plotly.relayout(`plot-${i}`, update);
      i++;
    }
  };
  return (
    <>
      <TopBar page="home" />
      <SplitPane
        split="vertical"
        defaultSize="60%"
        onDragFinished={handleChange}
      >
        <Paper socket={socket} />
        <Cesium socket={socket} />
      </SplitPane>
    </>
  );
}

export default Layout;
