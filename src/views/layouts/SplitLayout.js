import "../../../node_modules/react-grid-layout/css/styles.css";
import "../../static/css/layout.css";
import { useState, useEffect } from "react";
import RGL, { WidthProvider } from "react-grid-layout";
import { v4 as uuid } from "uuid";
import ToolBar from "../../components/ToolBar";
import Graph from "../../components/Graph";
import GraphXY from "../../components/GraphXY";
import Heatmap from "../../components/Heatmap";
import View3D from "../../components/View3D";
import SplitPane from "react-split-pane";
import { PORT } from "../../static/js/constants";

const ReactGridLayout = WidthProvider(RGL);

function SplitLayout({ socket, defaultShowView }) {
  const fullSize = window.innerWidth;
  const defaultSize = 0.55 * window.innerWidth; // percentage of screen width

  const [graphs, setGraphs] = useState([]);
  const [rowHeight, setRowHeight] = useState(null);
  const [positions, setPositions] = useState([]);
  const [showView, setShowView] = useState(defaultShowView);
  const [size, setSize] = useState(defaultShowView ? defaultSize : fullSize);
  const [ext, setExt] = useState("default");

  useEffect(() => {
    getExt();
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
    if (showView) setSize(fullSize);
    else setSize(defaultSize);
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
        />
      </div>
    );
    setGraphs([...graphs, graph]);
    addGraphToLayout("hm", id);
  };

  const updateKeys = async (id, keys) => {
    const e = await getCurrentExt();
    var layout = parseLocalStorage("current_layout");
    const plot = layout[e].find((p) => p.id === id);
    plot.keys = keys;
    localStorage.setItem("current_layout", JSON.stringify(layout));
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

  const initializeLayout = async () => {
    const e = await getCurrentExt();
    var layout = parseLocalStorage("current_layout");
    var pos = parseLocalStorage("current_positions");
    setPositions(pos[e]);
    var g = [];
    layout[e].forEach((p) => {
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
    var layout = parseLocalStorage("current_layout");
    layout[ext].push({ id: id, type: type, keys: [] });
    localStorage.setItem("current_layout", JSON.stringify(layout));
  };

  const removeGraph = async (id) => {
    const e = await getCurrentExt();
    var layout = parseLocalStorage("current_layout");
    layout[e] = layout[ext].filter((graph) => graph.id !== id);
    localStorage.setItem("current_layout", JSON.stringify(layout));
    initializeLayout();
  };

  const handleLayoutChange = async (layout) => {
    const e = await getCurrentExt();
    var pos = parseLocalStorage("current_positions");
    pos[e] = layout;
    localStorage.setItem("current_positions", JSON.stringify(pos));
  };

  const getExt = () => {
    fetch(`http://localhost:${PORT}/current_parser`)
      .then((res) => res.json())
      .then((res) => {
        setExt(res.ext);
      });
  };

  const getCurrentExt = async () => {
    var e = ext;
    if (e === "default") {
      e = await fetch(`http://localhost:${PORT}/current_parser`)
        .then((res) => res.json())
        .then((res) => res.ext);
    }
    var layout = parseLocalStorage("current_layout");
    if (!(e in layout)) {
      layout[e] = [];
      localStorage.setItem("current_layout", JSON.stringify(layout));
    }
    return e;
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
      <SplitPane split="vertical" size={size}>
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
        <View3D />
      </SplitPane>
    </>
  );
}

export default SplitLayout;
