import { useState } from "react";
import Graph from "./Graph";
import GraphXY from "./GraphXY";

function Paper({ socket }) {
  const [graphNbr, setGraphNbr] = useState(0);
  const [rows, setRows] = useState([]);
  const addXT = (index) => {
    var graph = <Graph key={index} graphIndex={index} socket={socket} />;
    setRows([...rows, graph]);
    setGraphNbr(graphNbr + 1);
  };

  const addXY = (index) => {
    var graph = <GraphXY key={index} graphIndex={index} socket={socket} />;
    setRows([...rows, graph]);
    setGraphNbr(graphNbr + 1);
  };

  const handleRemove = () => {
    setRows(rows.slice(0, -1));
    setGraphNbr(graphNbr - 1);
  };

  return (
    <>
      {rows}
      <center>
        <br />
        <div className="container">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => addXT(graphNbr)}
          >
            + XT
          </button>
          &nbsp;
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => addXY(graphNbr)}
          >
            + XY
          </button>
          &nbsp;
          <button
            className="btn btn-danger btn-lg"
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
