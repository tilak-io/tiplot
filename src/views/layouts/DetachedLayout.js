import "../../../node_modules/react-grid-layout/css/styles.css";
import "../../static/css/layout.css";
import { useState, useEffect } from "react";
import RGL, { WidthProvider } from "react-grid-layout";
import { v4 as uuid } from "uuid";
import ToolBar from "../../components/ToolBar";
import Graph from "../../components/Graph";
import GraphXY from "../../components/GraphXY";
import View3D from "../../components/View3D";
import NewWindow from "react-new-window";
import Heatmap from "../../components/Heatmap";

const ReactGridLayout = WidthProvider(RGL);

function DetachedLayout({ socket, defaultShowView, ext }) {
  const [graphs, setGraphs] = useState([]);
  const [rowHeight, setRowHeight] = useState(null);
  const [positions, setPositions] = useState([]);
  const [showView, setShowView] = useState(defaultShowView);

  useEffect(() => {
    initializeLayout();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fitToScreen();
    window.addEventListener("resize", fitToScreen);
    // eslint-disable-next-line
  }, [graphs]);

  const fitToScreen = () => {
    var usedHeight = 56; // ToolBar height
    setRowHeight((window.innerHeight - usedHeight) / graphs.length);
  };

  const toggle3dView = () => {
    setShowView(!showView);
  };

  const addGraphYT = () => {
    const id = uuid();
    const graph = (
      <div key={id}>
        <Graph
          id={id}
          initialKeys={[]}
          updateKeys={updateKeys}
          removeGraph={removeGraph}
          autoFocusSelect={true}
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
          removeGraph={removeGraph}
          autoFocusSelect={true}
        />
      </div>
    );
    setGraphs([...graphs, graph]);
    addGraphToLayout("xy", id);
  };

  const addGraphHM = () => {
    const id = uuid();
    const graph = (
      <div key={id}>
        <Heatmap
          id={id}
          initialKeys={[]}
          updateKeys={updateKeys}
          removeGraph={removeGraph}
          autoFocusSelect={true}
        />
      </div>
    );
    setGraphs([...graphs, graph]);
    addGraphToLayout("hm", id);
  };

  const updateKeys = (id, keys) => {
    var layout = parseLocalStorage("curr_layout");
    const plot = layout[ext].find((p) => p.id === id);
    console.log(layout);
    plot.keys = keys;
    localStorage.setItem("curr_layout", JSON.stringify(layout));
  };

  const parseLocalStorage = (key) => {
    try {
      var value = localStorage.getItem(key);
      if (value === "" || value === null) {
        value = {};
      } else {
        value = JSON.parse(value);
      }
    } catch {
      alert("Please import a valid json file");
      localStorage.setItem(key, "{}");
      value = {};
    }

    if (!(ext in value)) {
      value[ext] = [];
    }

    return value;
  };

  const initializeLayout = () => {
    var layout = parseLocalStorage("curr_layout");
    var pos = parseLocalStorage("curr_positions");
    setPositions(pos[ext]);
    var g = [];
    layout[ext].forEach((p) => {
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
      if (p.type === "hm")
        graph = (
          <div key={p.id}>
            <Heatmap
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
    var layout = parseLocalStorage("curr_layout");
    layout[ext].push({ id: id, type: type, keys: [] });
    localStorage.setItem("curr_layout", JSON.stringify(layout));
  };

  const removeGraph = (id) => {
    var layout = parseLocalStorage("curr_layout");
    layout[ext] = layout[ext].filter((graph) => graph.id !== id);
    localStorage.setItem("curr_layout", JSON.stringify(layout));
    initializeLayout();
  };

  const handleLayoutChange = (layout) => {
    var pos = parseLocalStorage("curr_positions");
    pos[ext] = layout;
    localStorage.setItem("curr_positions", JSON.stringify(pos));
  };

  const handleToggle = (value) => {
    setShowView(value);
    localStorage.setItem("show_view", JSON.stringify(value));
  };

  return (
    <>
      <ToolBar
        page="home"
        addYT={addGraphYT}
        addXY={addGraphXY}
        addHM={addGraphHM}
        toggle3dView={toggle3dView}
        showView={showView}
        showControls={true}
      />
      <div className="fit-to-screen">
        <ReactGridLayout
          layout={positions}
          onLayoutChange={handleLayoutChange}
          isResizable={false}
          margin={[0, 0]}
          rowHeight={rowHeight}
          className="layout"
          cols={1}
          draggableHandle=".drag-button"
        >
          {graphs}
        </ReactGridLayout>
      </div>
      <Detached3D show={showView} toggle={handleToggle} />
    </>
  );
}

function Detached3D({ show, toggle }) {
  return show ? (
    <NewWindow
      title="Tiplot 3D View"
      name="Tiplot 3D View"
      center="screen"
      onOpen={() => toggle(true)}
      onUnload={() => toggle(false)}
    >
      <View3D detached />
    </NewWindow>
  ) : (
    <div></div>
  );
}

export default DetachedLayout;
