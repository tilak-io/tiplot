import { useState, useEffect } from "react";
import Select from "react-select";
import Plot from "react-plotly.js";
import PlotData from "../controllers/PlotData";
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
    const plot = document.getElementById(`plot-${id}`);
    new ResizeObserver(stretchHeight).observe(plot);
  }, []);

  const getInitialData = async () => {
    if (initialKeys == null) return;
    if (initialKeys.length !== 2) return;
    setSelectedX(initialKeys[0]);
    setSelectedY(initialKeys[1]);
    addData(initialKeys[0].value, initialKeys[1].value);
  };

  const stretchHeight = () => {
    plotData.stretchHeight();
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
    } else {
      setSelectedY(null);
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
    <div className="plot-container">
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
      <div className="d-flex flex-xy">
        <Plot
          className="plot-xy"
          divId={`plot-${id}`}
          data={data}
          onHover={handleHover}
          onClick={handleHover}
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
              spikethickness: 1,
            },
            yaxis: {
              spikecolor: "black",
              spikemode: "across",
              spikethickness: 1,
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
