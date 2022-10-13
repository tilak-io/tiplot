import "../css/layout.css";
import Plotly from "plotly.js/dist/plotly";
import Paper from "./Paper";
import Cesium from "./Cesium";
import TopBar from "./Navbar";

import SplitPane from "react-split-pane";

function Layout({ socket }) {
  //document.body.style.zoom = 0.75;

  const handleChange = (event) => {
    var update = { autoresize: true };
    let plots = document.getElementsByClassName("js-plotly-plot");
    for (let i = 0; i < plots.length; i++) {
      Plotly.relayout(plots[i], update);
    }
  };

  return (
    <>
      <TopBar page="home" />
      <SplitPane
        split="vertical"
        defaultSize="65%"
        onDragFinished={handleChange}
      >
        <Paper socket={socket} />
        <Cesium socket={socket} />
      </SplitPane>
    </>
  );
}

export default Layout;
