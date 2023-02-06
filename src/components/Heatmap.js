import Select from "react-select";
import Plot from "react-plotly.js";
import { useState, useEffect } from "react";
import GraphOptions from "./GraphOptions";
import PlotData from "../controllers/PlotData";

function Heatmap({ id, initialKeys, updateKeys, removeGraph }) {
  const plotData = new PlotData(id, initialKeys);
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [data, setData] = useState([]);

  useEffect(() => {
    getInitialData();
    getOptions();
    const plot = document.getElementById(`plot-${id}`);
    new ResizeObserver(stretchHeight).observe(plot);
    // eslint-disable-next-line
  }, []);

  const stretchHeight = () => {
    plotData.stretchHeight();
  };

  const getInitialData = async () => {
    if (initialKeys == null) return;
    if (initialKeys.length === 0) return;
    setSelectedOptions(initialKeys);
    const d = await plotData.getCorrMatrix(initialKeys);
    setData([d]);
    squeezeSelect();
  };

  const getOptions = async () => {
    const opt = await plotData.getOptions();
    setOptions(opt);
  };

  const getCorrMatrix = async (fields) => {
    const d = await plotData.getCorrMatrix(fields);
    setData([d]);
  };

  const handleSelectChange = (keysList, actionMeta) => {
    setSelectedOptions(keysList);
    updateKeys(id, keysList);
    switch (actionMeta.action) {
      case "select-option":
      case "remove-value":
      case "pop-value":
        getCorrMatrix(keysList);
        break;
      case "clear":
        setData([]);
        break;
      default:
        break;
    }
  };

  const handleInput = (value, event) => {
    setInputValue(value);
    if (event.action === "set-value") setInputValue(event.prevInputValue);
  };

  const handleRelayout = (event) => {
    // only used for updating the correlation matrix if the zoomed x_range has changed
    if (!event["x_rangeChanged"]) return;
    getCorrMatrix(selectedOptions);
  };

  const squeezeSelect = () => {
    const select = document.querySelector(
      `#select-${id} > div > div:first-child`
    );
    if (select == null) {
      return;
    }
    select.style.maxHeight = "36px";
  };

  const stretchSelect = () => {
    const select = document.querySelector(
      `#select-${id} > div > div:first-child`
    );
    if (select == null) {
      return;
    }
    select.style.maxHeight = "500px";
  };

  const isOptionSelected = (option) => {
    const labels = selectedOptions.map((e) => e.label);
    return labels.includes(option.label);
  };

  return (
    <div className="plot-container">
      <Select
        id={`select-${id}`}
        className="multiselect"
        isMulti
        options={options}
        isOptionSelected={isOptionSelected}
        onChange={handleSelectChange}
        value={selectedOptions}
        closeMenuOnSelect={false}
        inputValue={inputValue}
        onInputChange={handleInput}
        onMenuOpen={stretchSelect}
        onBlur={squeezeSelect}
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999, fontSize: "75%" }),
        }}
      />
      <div className="placeholder" id={`whiteout-${id}`} />
      <div className="d-flex flex-yt">
        <Plot
          className="plot-hm"
          divId={`plot-${id}`}
          data={data}
          onRelayout={handleRelayout}
          useResizeHandler
          layout={{
            autoresize: true,
            showlegend: false,
            legend: {
              x: 1,
              xanchor: "right",
              y: 1,
            },
            margin: {
              t: 10,
              b: 25,
              // l: 100,
              // r: 0,
            },
            xaxis: {
              showspikes: true,
              spikemode: "across+marker",
              spikethickness: 1,
            },
            yaxis: {
              showspikes: true,
              spikemode: "across+marker",
              spikethickness: 1,
            },
            // hovermode: "x unified",
            hovermode: "x",
            hoverlabel: {
              font: {
                size: 10,
              },
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
export default Heatmap;
