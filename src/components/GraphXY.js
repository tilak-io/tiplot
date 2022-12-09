import { useState, useEffect } from "react";
import Select from "react-select";
import Plot from "react-plotly.js";
import Plotly from "plotly.js/dist/plotly";
import GraphOptions from "./GraphOptions";

const defaultLayout = {
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
};
function GraphXY({ socket, graphIndex, updateKeys, initialKeys, removeGraph }) {
  const [xs, setXs] = useState([]);
  const [ys, setYs] = useState([]);
  const [data, setData] = useState([]);
  const [selected_x, setSelected_X] = useState();
  const [selected_y, setSelected_Y] = useState();
  var plot;

  useEffect(() => {
    plotInitialData();
    // request table keys
    socket.emit("get_table_keys", graphIndex);

    // set the X array
    socket.on("table_keys", (response) => {
      const index = response["index"];
      const keys = response["keys"];

      // return if its not the components that made the request
      if (index !== graphIndex) return;
      var options = [];
      keys.forEach((value) => {
        var key = Object.keys(value)[0];
        var nested_keys = Object.values(value)[0];
        nested_keys.forEach((nested) => {
          options.push({
            label: `${key}/${nested}`,
            value: `${key}/${nested}`,
            key: key,
            nested: nested,
          });
        });
      });
      setXs(options);

      // eslint-disable-next-line
      plot = document.getElementById(`plot-${graphIndex}`);
      new ResizeObserver(stretchHeight).observe(plot);
    });

    const stretchHeight = () => {
      var update = {
        autoresize: true,
        width: plot.clientWidth,
        height: plot.clientHeight,
        "yaxis.autorange": true,
      };

      if (plot.clientHeight !== 0) Plotly.relayout(plot, update);
    };
    // set the Y array
    socket.on("table_columns", (response) => {
      const index = response["index"];
      const table = response["table"];
      const columns = response["columns"];

      // return if its not the components that made the request
      if (index !== graphIndex) return;

      var mapped_y = columns.map((col) => {
        return {
          key: table,
          nested: col,
          label: `${table}/${col}`,
          value: `${table}/${col}`,
        };
      });
      setYs(mapped_y);
    });

    // set the data array

    socket.on("table_values", (response) => {
      const index = response["index"];
      const table = response["table"];
      const key_x = response["x"];
      const key_y = response["y"];
      const values = response["values"];

      // return if its not the components that made the request
      if (index !== graphIndex) return;

      var x = [],
        y = [];
      values.forEach((e) => {
        x.push(e[key_x]);
        y.push(e[key_y]);
      });
      var line = {
        x: x,
        y: y,
        name: `${table}/${key_x}:${key_y}`,
      };
      setData([line]);
    });
    // eslint-disable-next-line
  }, []);

  const addData = async (table, key_x, key_y) => {
    socket.emit("get_table_values", {
      index: graphIndex,
      table: table,
      keys: [key_y, key_x],
    });
  };

  const handleChangeX = (value) => {
    setSelected_X(value);
    socket.emit("get_table_columns", { index: graphIndex, table: value.key });
  };

  const handleChangeY = (value) => {
    setSelected_Y(value);
    addData(selected_x.key, selected_x.nested, value.nested);
    updateKeys(graphIndex, [selected_x, value]);
  };

  const handleHover = (event) => {
    const n = event.points[0].data.x.length;
    const idx = event.points[0].pointIndex;
    if (event.event.altKey) {
      updateTimelineIndicator(idx / n);
    }
  };

  const handleClick = (event) => {
    const n = event.points[0].data.x.length;
    const idx = event.points[0].pointIndex;
    if (event.event.ctrlKey) {
      updateTimelineIndicator(idx / n);
    }
  };

  const updateTimelineIndicator = (p) => {
    drawTimelineIndicator(p);
    drawCrosshair(p);
  };

  const drawTimelineIndicator = (p) => {
    const plots = document.getElementsByClassName("plot-yt");

    for (let i = 0; i < plots.length; i++) {
      if (plots[i].data.length === 0) continue;
      const nx = plots[i].data[0].x.length;
      const index = parseInt(p * nx);
      const x = plots[i].data[0].x[index];
      const update = {
        shapes: [
          {
            type: "line",
            x0: x,
            y0: 0,
            x1: x,
            yref: "paper",
            y1: 1,
            line: {
              color: "red",
              width: 1.5,
              // dash: "dot",
            },
          },
        ],
      };
      window.currentX = x;
      Plotly.relayout(plots[i], update);
    }
  };

  const drawCrosshair = (p) => {
    const plots = document.getElementsByClassName("plot-xy");

    for (let i = 0; i < plots.length; i++) {
      if (plots[i].data.length === 0) continue;
      const nx = plots[i].data[0].x.length;
      const ny = plots[i].data[0].y.length;

      const ix = parseInt(p * nx);
      const iy = parseInt(p * ny);

      const x = plots[i].data[0].x[ix];
      const y = plots[i].data[0].y[iy];

      const update = {
        shapes: [
          {
            type: "line",
            yref: "paper",
            x0: x,
            y0: 0,
            x1: x,
            y1: 1,
            line: {
              color: "red",
              width: 1.5,
              // dash: "dot",
            },
          },
          {
            type: "line",
            xref: "paper",
            x0: 0,
            y0: y,
            x1: 1,
            y1: y,
            line: {
              color: "red",
              width: 1.5,
              // dash: "dot",
            },
          },
        ],
      };
      Plotly.relayout(plots[i], update);
    }
  };

  const plotInitialData = () => {
    if (initialKeys === undefined) return; // return if we have no initial keys
    if (initialKeys.length === 0) return; // return if we have no initial keys
    setSelected_X(initialKeys[0]);
    setSelected_Y(initialKeys[1]);
    addData(initialKeys[0].key, initialKeys[0].nested, initialKeys[1].nested);
  };

  return (
    <div>
      <Select
        className="multiselect"
        options={xs}
        onChange={handleChangeX}
        value={selected_x}
      />
      <Select
        className="multiselect"
        options={ys}
        onChange={handleChangeY}
        value={selected_y}
      />
      <div className="d-flex resizable">
        <Plot
          className="plot-xy"
          divId={`plot-${graphIndex}`}
          data={data}
          onHover={handleHover}
          onClick={handleClick}
          layout={defaultLayout}
          config={{
            displayModeBar: false,
          }}
        />
        <GraphOptions
          plotId={`plot-${graphIndex}`}
          graphIndex={graphIndex}
          removeGraph={removeGraph}
        />
      </div>
    </div>
  );
}
export default GraphXY;
