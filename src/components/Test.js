import "../../node_modules/react-grid-layout/css/styles.css";
import { useState, useEffect } from "react";
import TopBar from "./TopBar";
import { WidthProvider, Responsive } from "react-grid-layout";
import Graph from "./Graph";

import { v4 as uuid } from "uuid";

const ResponsiveGridLayout = WidthProvider(Responsive);

function Test() {
  const [graphs, setGraphs] = useState([]);
  const [rowHeight, setRowHeight] = useState(window.innerHeight);

  useEffect(() => {
    fitGraphsToScreen();
  }, [graphs]);

  const addGraph = () => {
    const graph = { id: uuid() };
    setGraphs([...graphs, graph]);
  };

  const removeGraph = (id) => {
    const g = graphs.filter((e) => e.id != id);
    setGraphs(g);
  };

  const fitGraphsToScreen = () => {
    const containers = document.getElementsByClassName("plot-yt");
    const multiselects = document.getElementsByClassName("multiselect");
    var additionalHeight = 0; // buttons + navbar height
    for (var i = 0; i < multiselects.length; i++)
      additionalHeight += multiselects[i].clientHeight;
    const plotHeight =
      (window.innerHeight - additionalHeight) / containers.length;
    for (var j = 0; j < containers.length; j++)
      containers[j].style.height = plotHeight + "px";
    setRowHeight(plotHeight);
  };

  const updateKeys = () => {};
  return (
    <>
      <TopBar addX={addGraph} />
      <ResponsiveGridLayout
        isResizable={false}
        margin={[0, 0]}
        rowHeight={rowHeight}
        className="layout"
        cols={{ lg: 1, md: 1, sm: 1, xs: 1, xxs: 1 }}
        draggableHandle=".plot-options"
      >
        {graphs.map((g) => (
          <div key={g.id} style={{ backgroundColor: "red", height: 100 }}>
            <Graph
              id={g.id}
              updateKeys={updateKeys}
              removeGraph={removeGraph}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
    </>
  );
}

export default Test;
