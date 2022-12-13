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
  const [selected_x, setSelectedX] = useState(null);
  const [selected_y, setSelectedY] = useState(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    getInitialData();
    getOptions();
  }, []);

  const getInitialData = async () => {
    if (initialKeys == null) return;
    if (initialKeys.length !== 2) return;
    setSelectedX(initialKeys[0]);
    setSelectedY(initialKeys[1]);
    addData(initialKeys[0].value, initialKeys[1].value);
  };

  const getOptions = async () => {
    const opt = await plotData.getOptions();
    setOptionsX(opt);
  };

  const handleChangeX = (e) => {
    setSelectedX(e);
    const opt = options_x.filter((o) => o.value.table == e.value.table);
    setOptionsY(opt);

    if (selected_y == null) return;
    if (selected_y.value.table == e.value.table) {
      addData(e.value, selected_y.value);
      updateKeys(id, [e, selected_y]);
    }
  };

  const handleChangeY = (e) => {
    setSelectedY(e);
    addData(selected_x.value, e.value);
    updateKeys(id, [selected_x, e]);
  };

  const addData = async (x, y) => {
    const d = await plotData.getDataXY(x, y);
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
        value={selected_x}
      />
      <Select
        className="multiselect"
        options={options_y}
        onChange={handleChangeY}
        value={selected_y}
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
        <GraphOptions plotId={`plot-${id}`} id={id} removeGraph={removeGraph} />
      </div>
    </div>
  );
}
export default GraphXY;
