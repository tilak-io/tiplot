import React, { useState, useEffect } from "react";
import Graph from "./Graph";
import GraphXY from "./GraphXY";

function Paper({ socket }) {
  const [graphNbr, setGraphNbr] = useState(0);
  const [rows, setRows] = useState([]);
  const [currentId, setId] = useState(0);

  useEffect(() => {
    initializeLayout();
    fitGraphsToScreen();
  }, [graphNbr]);

  const addXT = (index) => {
    var graph = (
      <Graph
        key={index}
        graphIndex={index}
        socket={socket}
        updateKeys={updateKeys}
        removeGraph={removeGraph}
      />
    );
    setRows([...rows, graph]);
    setGraphNbr(graphNbr + 1);
    setId(currentId + 1);
    addGraphToLayout("yt", index);
  };

  const addXY = (index) => {
    var graph = (
      <GraphXY
        key={index}
        graphIndex={index}
        socket={socket}
        updateKeys={updateKeys}
        removeGraph={removeGraph}
      />
    );
    setRows([...rows, graph]);
    setGraphNbr(graphNbr + 1);
    setId(currentId + 1);
    addGraphToLayout("xy", index);
  };

  const parseLocalStorage = (key) => {
    try {
      var value = localStorage.getItem(key);
      if (value === "" || value === null) value = [];
      else value = JSON.parse(value);
    } catch {
      alert("Please import a valid json file");
      localStorage.setItem("current_layout", "[]");
      var value = [];
    }
    return value;
  };

  const handleRemove = () => {
    setRows(rows.slice(0, -1));
    setGraphNbr(graphNbr - 1);
    var layout = parseLocalStorage("current_layout");
    layout.pop();
    localStorage.setItem("current_layout", JSON.stringify(layout));
  };

  const addGraphToLayout = (type, id) => {
    var layout = parseLocalStorage("current_layout");
    layout.push({ id: id, type: type, keys: [] });
    localStorage.setItem("current_layout", JSON.stringify(layout));
  };

  const updateKeys = (id, keys) => {
    var layout = parseLocalStorage("current_layout");
    layout.forEach((plot) => {
      if (plot["id"] === id) plot["keys"] = keys;
    });
    localStorage.setItem("current_layout", JSON.stringify(layout));
  };

  const initializeLayout = () => {
    var layout = parseLocalStorage("current_layout");
    var graphs = [];
    var lastPlot;
    layout.forEach((plot) => {
      var graph;
      if (plot.type === "yt")
        graph = (
          <Graph
            key={plot.id}
            graphIndex={plot.id}
            socket={socket}
            updateKeys={updateKeys}
            initialKeys={plot.keys}
            removeGraph={removeGraph}
          />
        );
      if (plot.type === "xy")
        graph = (
          <GraphXY
            key={plot.id}
            graphIndex={plot.id}
            socket={socket}
            initialKeys={plot.keys}
            updateKeys={updateKeys}
            removeGraph={removeGraph}
          />
        );
      graphs.push(graph);
      lastPlot = plot;
    });
    setRows(graphs);
    setGraphNbr(layout.length);
    if (lastPlot !== undefined) setId(lastPlot.id + 1);
  };

  const removeGraph = (index) => {
    var layout = parseLocalStorage("current_layout");
    const filtered_layout = layout.filter((graph) => graph.id != index);
    localStorage.setItem("current_layout", JSON.stringify(filtered_layout));
    initializeLayout();
  };

  const fitGraphsToScreen = () => {
    if (!window.fitGraphsToScreen) return;
    const containers = document.getElementsByClassName("resizable");
    const multiselects = document.getElementsByClassName("multiselect");
    var additionalHeight = 130; // buttons + navbar height
    for (var i = 0; i < multiselects.length; i++)
      additionalHeight += multiselects[i].clientHeight;
    const plotHeight =
      (window.innerHeight - additionalHeight) / containers.length;
    for (var i = 0; i < containers.length; i++)
      containers[i].style.height = plotHeight + "px";
  };

  return (
    <>
      <div className="break"></div>
      {rows}
      <center>
        <br />
        <div className="container">
          <button
            className="btn btn-primary btn"
            onClick={() => addXT(currentId)}
          >
            + XT
          </button>
          &nbsp;
          <button
            className="btn btn-secondary btn"
            onClick={() => addXY(currentId)}
          >
            + XY
          </button>
          &nbsp;
          <button
            className="btn btn-danger btn"
            onClick={rows.length === 0 ? null : handleRemove}
          >
            - Remove
          </button>
        </div>
      </center>
    </>
  );
}

export default Paper;
