import { useState, useEffect } from "react";
import Select from "react-select";
import Plot from "react-plotly.js";
import Plotly from "plotly.js/dist/plotly";
import PlotData from "../models/PlotData";
import GraphOptions from "./GraphOptions";

function GraphXY({ id, updateKeys, initialKeys, removeGraph }) {
  const plotData = new PlotData(id, initialKeys);
  const [options_x, setOptionsX] = useState([]);
  const [options_y, setOptionsY] = useState([]);
  const [selected_x, setSelectedX] = useState("");
  const [selected_y, setSelectedY] = useState("");
  const [data, setData] = useState([]);

  useEffect(() => {
    getOptions();
  }, []);

  const getOptions = async () => {
    const opt = await plotData.getOptions();
    setOptionsX(opt);
  };

  const handleChangeX = (e) => {
    setSelectedX(e.value);
    const opt = options_x.filter((o) => o.value.table == e.value.table);
    setOptionsY(opt);
  };

  const handleChangeY = (e) => {
    setSelectedY(e.value);
    addData(selected_x, e.value);
  };

  const addData = async (x, y) => {
    const d = await plotData.getDataXY(x, y);
    console.log(d);
    setData([d]);
  };

  const handleHover = (event) => {
    const index = event.points[0].pointIndex;
    const data = event.points[0].data;
    const x = data.t[index];
    if (event.event.altKey) {
      plotData.updateTimelineIndicator(x);
    }
  };

  return (
    <div>
      <Select
        className="multiselect"
        options={options_x}
        onChange={handleChangeX}
      />
      <Select
        className="multiselect"
        options={options_y}
        onChange={handleChangeY}
      />
      <div className="d-flex resizable">
        <Plot
          className="plot-xy"
          divId={`plot-${id}`}
          data={data}
          onHover={handleHover}
          useResizeHandler
          layout={{
            margin: {
              t: 10,
              b: 25,
              l: 50,
              r: 25,
            },
            hovermode: "closest",
            xaxis: {
              spikecolor: "black",
              spikemode: "across",
            },
            yaxis: {
              spikecolor: "black",
              spikemode: "across",
            },
          }}
          config={{
            displayModeBar: false,
          }}
        />
        <GraphOptions
          plotId={`plot-${id}`}
          graphIndex={id}
          removeGraph={removeGraph}
        />
      </div>
    </div>
  );
}
export default GraphXY;
