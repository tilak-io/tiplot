import React, { useState, useEffect, useRef } from "react";
import Graph from "./Graph";
import GraphXY from "./GraphXY";

function Paper({ socket }) {
  const [graphNbr, setGraphNbr] = useState(0);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    initializeLayout();
  }, []);

  const addXT = (index) => {
    var graph = (
      <Graph
        key={index}
        graphIndex={index}
        socket={socket}
        updateKeys={updateKeys}
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
      />
    );
    setRows([...rows, graph]);
    setGraphNbr(graphNbr + 1);
    addGraphToLayout("xy");
  };

  const handleRemove = () => {
    setRows(rows.slice(0, -1));
    setGraphNbr(graphNbr - 1);
    var layout = localStorage.getItem("layout");
    layout = JSON.parse(layout);
    layout.pop();
    localStorage.setItem("layout", JSON.stringify(layout));
  };

  const addGraphToLayout = (type) => {
    var layout = localStorage.getItem("layout");
    if (layout == "") layout = [];
    else layout = JSON.parse(layout);
    layout.push({ type: type, keys: [] });
    localStorage.setItem("layout", JSON.stringify(layout));
  };

  const updateKeys = (index, keys) => {
    var layout = localStorage.getItem("layout");
    layout = JSON.parse(layout);
    console.log(layout[index]);
    layout[index]["keys"] = keys;
    localStorage.setItem("layout", JSON.stringify(layout));
  };

  const initializeLayout = () => {
    var layout = localStorage.getItem("layout");
    if (layout == "") layout = [];
    else layout = JSON.parse(layout);
    var graphs = [];
    layout.forEach((plot, index) => {
      if (plot.type == "yt")
        var graph = (
          <Graph
            key={index}
            graphIndex={index}
            socket={socket}
            updateKeys={updateKeys}
            initialKeys={plot.keys}
          />
        );
      if (plot.type == "xy")
        var graph = (
          <GraphXY
            key={index}
            graphIndex={index}
            socket={socket}
            initialKeys={plot.keys}
            updateKeys={updateKeys}
          />
        );
      graphs.push(graph);
    });
    setRows(graphs);
    setGraphNbr(layout.length);
  };

  return (
    <>
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
