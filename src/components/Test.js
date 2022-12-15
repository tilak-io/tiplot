import "../../node_modules/react-grid-layout/css/styles.css";
import { useState, useEffect } from "react";
import ToolBar from "./ToolBar";
import RGL, { Responsive, WidthProvider } from "react-grid-layout";
import Graph from "./Graph";
import GraphXY from "./GraphXY";
import { v4 as uuid } from "uuid";

const ReactGridLayout = WidthProvider(Responsive);

function Test() {
  const [graphs, setGraphs] = useState([]);
  const [rowHeight, setRowHeight] = useState(null);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    initializeLayout();
  }, []);

  useEffect(() => {
    var usedHeight = 56;
    setRowHeight((window.innerHeight - usedHeight) / graphs.length);
  }, [graphs]);

  const addGraphYT = () => {
    const id = uuid();
    const graph = (
      <div key={id}>
        <Graph
          id={id}
          initialKeys={[]}
          updateKeys={updateKeys}
          removeGraph={() => removeGraph()}
        />
      </div>
    );
    setGraphs([...graphs, graph]);
    addGraphToLayout("yt", id);
  };

  const addGraphXY = () => {
    const id = uuid();
    const graph = (
      <div key={id}>
        <GraphXY
          id={id}
          initialKeys={[]}
          updateKeys={updateKeys}
          removeGraph={() => removeGraph()}
        />
      </div>
    );
    setGraphs([...graphs, graph]);
    addGraphToLayout("xy", id);
  };

  const updateKeys = (id, keys) => {
    var layout = parseLocalStorage("current_layout");
    const plot = layout.find((p) => p.id === id);
    plot.keys = keys;
    localStorage.setItem("current_layout", JSON.stringify(layout));
  };

  const parseLocalStorage = (key) => {
    try {
      var value = localStorage.getItem(key);
      if (value === "" || value === null) value = [];
      else value = JSON.parse(value);
    } catch {
      alert("Please import a valid json file");
      localStorage.setItem(key, "[]");
      value = [];
    }
    return value;
  };

  const initializeLayout = () => {
    var layout = parseLocalStorage("current_layout");
    var pos = parseLocalStorage("current_positions");
    setPositions(pos);
    var g = [];
    layout.forEach((p) => {
      var graph;
      if (p.type === "yt")
        graph = (
          <div key={p.id}>
            <Graph
              id={p.id}
              initialKeys={p.keys}
              updateKeys={updateKeys}
              removeGraph={removeGraph}
            />
          </div>
        );
      if (p.type === "xy")
        graph = (
          <div key={p.id}>
            <GraphXY
              id={p.id}
              initialKeys={p.keys}
              updateKeys={updateKeys}
              removeGraph={removeGraph}
            />
          </div>
        );
      g.push(graph);
    });
    setGraphs(g);
  };

  const addGraphToLayout = (type, id) => {
    var layout = parseLocalStorage("current_layout");
    layout.push({ id: id, type: type, keys: [] });
    localStorage.setItem("current_layout", JSON.stringify(layout));
  };

  const removeGraph = (id) => {
    var layout = parseLocalStorage("current_layout");
    const r = layout.filter((graph) => graph.id !== id);
    localStorage.setItem("current_layout", JSON.stringify(r));
    initializeLayout();
  };

  const handleLayoutChange = (layout) => {
    localStorage.setItem("current_positions", JSON.stringify(layout));
  };

  return (
    <>
      <ToolBar addYT={addGraphYT} addXY={addGraphXY} />
      <div className="fit-to-screen">
        <ReactGridLayout
          layout={positions}
          onLayoutChange={handleLayoutChange}
          isResizable={false}
          margin={[0, 0]}
          rowHeight={rowHeight}
          className="layout"
          breakpoints={{ lg: 1200 }}
          cols={{ lg: 1 }}
          draggableHandle=".drag-button"
        >
          {graphs}
        </ReactGridLayout>
      </div>
    </>
  );
}

export default Test;
