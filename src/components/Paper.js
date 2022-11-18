import React, { useState, useEffect } from "react";
import Graph from "./Graph";
import GraphXY from "./GraphXY";

function Paper({ socket }) {
  const [graphNbr, setGraphNbr] = useState(0);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    initializeLayout();
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
    addGraphToLayout("yt");
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
    addGraphToLayout("xy");
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

  const addGraphToLayout = (type) => {
    var layout = parseLocalStorage("current_layout");
    layout.push({ type: type, keys: [] });
    localStorage.setItem("current_layout", JSON.stringify(layout));
  };

  const updateKeys = (index, keys) => {
    var layout = parseLocalStorage("current_layout");
    layout[index]["keys"] = keys;
    localStorage.setItem("current_layout", JSON.stringify(layout));
  };

  const initializeLayout = () => {
    var layout = parseLocalStorage("current_layout");
    var graphs = [];
    layout.forEach((plot, index) => {
      var graph;
      if (plot.type === "yt")
        graph = (
          <Graph
            key={index}
            graphIndex={index}
            socket={socket}
            updateKeys={updateKeys}
            initialKeys={plot.keys}
            removeGraph={removeGraph}
          />
        );
      if (plot.type === "xy")
        graph = (
          <GraphXY
            key={index}
            graphIndex={index}
            socket={socket}
            initialKeys={plot.keys}
            updateKeys={updateKeys}
            removeGraph={removeGraph}
          />
        );
      graphs.push(graph);
    });
    setRows(graphs);
    setGraphNbr(layout.length);
  };

  const removeGraph = (index) => {
    var layout = parseLocalStorage("current_layout");
    layout.splice(index, 1);
    localStorage.setItem("current_layout", JSON.stringify(layout));
    setRows([]); // force clear
    setGraphNbr(graphNbr - 1); // this will trigger initializeLayout()
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
            onClick={() => addXT(graphNbr)}
          >
            + XT
          </button>
          &nbsp;
          <button
            className="btn btn-secondary btn"
            onClick={() => addXY(graphNbr)}
          >
            + XY
          </button>
          &nbsp;
          <button
            className="btn btn-danger btn"
            onClick={graphNbr === 0 ? null : handleRemove}
          >
            - Remove
          </button>
        </div>
      </center>
    </>
  );
}

export default Paper;
