import { useState } from "react";
import Graph from "./Graph";
import GraphXY from "./GraphXY";

function Paper() {
  const [graphNbr, setGraphNbr] = useState(0);
  const [rows, setRows] = useState([]);
  const addXT = (index) => {
    var graph = <Graph key={index} graphNbr={graphNbr} index={index} />;
    setRows([...rows, graph]);
    setGraphNbr(graphNbr + 1);
  };

  const addXY = (index) => {
    var graph = <GraphXY key={index} graphNbr={graphNbr} index={index} />;
    setRows([...rows, graph]);
    setGraphNbr(graphNbr + 1);
  };

  const handleRemove = () => {
    const index = 1;
    setRows(rows.filter((item) => item.index !== index));
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
