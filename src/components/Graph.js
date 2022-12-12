import Select from "react-select";
import Plot from "react-plotly.js";
import Plotly from "plotly.js/dist/plotly";
import { useState, useEffect } from "react";
import GraphOptions from "./GraphOptions";

function Graph({ id }) {


  return (
    <div>
      <Select
        id={`select-${id}`}
        className="multiselect"
        // options={keys}
        isMulti
        // onChange={handleChange}
        // value={selectedValue}
        closeMenuOnSelect={false}
      />
      <div className="d-flex resizable">
        <Plot
          className="plot-yt"
          divId={`plot-${id}`}
          // data={data}
          // onRelayout={relayoutHandler}
          // onHover={handleHover}
          // onClick={handleClick}
          // useResizeHandler
          layout={{
            autoresize: true,
            showlegend: true,
            legend: {
              x: 1,
              xanchor: "right",
              y: 1,
            },
            margin: {
              t: 10,
              b: 25,
              l: 50,
              r: 25,
            },
            hovermode: "x unified"
          }}
          config={{
            displayModeBar: false,
          }}
        />

        <GraphOptions
          plotId={`plot-${id}`}
          graphIndex={id}
        // removeGraph={removeGraph}
        />
      </div>
    </div>
  );
}
export default Graph;
