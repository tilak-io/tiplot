import Select from "react-select";
import Plot from "react-plotly.js";
import Plotly from "plotly.js/dist/plotly";
import { useState, useEffect } from "react";

const defaultLayout = {
  margin: {
    t: 0,
  },
  hoverdistance: -1,
  xaxis: {
    spikemode: "across",
    spikesnap: "closest",
  },
  yaxis: {
    spikemode: "across",
    spikesnap: "closest",
  },
};
function GraphXY({ socket, graphIndex, updateKeys, initialKeys }) {
  const [xs, setXs] = useState([]);
  const [ys, setYs] = useState([]);
  const [data, setData] = useState([]);
  const [selected_x, setSelected_X] = useState();
  const [selected_y, setSelected_Y] = useState();

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
      keys.forEach((value, index) => {
        var key = Object.keys(value)[0];
        var nested_keys = Object.values(value)[0];
        nested_keys.forEach((nested, idx) => {
          options.push({
            label: `${key}/${nested}`,
            value: `${key}/${nested}`,
            key: key,
            nested: nested,
          });
        });
      });
      setXs(options);
    });

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
    let i = 0;
    const index = event.points[0].pointIndex;
    const nbrPoints = event.points[0].data.x.length;
    // const x = event.points[0].x;

    if (window.time_array !== undefined) {
      const start = window.time_array[0];
      const stop = window.time_array[window.time_array.length - 1];
      const totalSecs = window.Cesium.JulianDate.secondsDifference(stop, start);
      if (event.event.altKey)
        window.viewer.clock.currentTime.secondsOfDay =
          window.viewer.clock.startTime.secondsOfDay +
          (index / nbrPoints) * totalSecs;
    }
    while (document.getElementById(`plot-${i}`)) {
      var plot = document.getElementById(`plot-${i}`);
      i++;
      if (graphIndex === i - 1) continue;
      if (plot.data.length === 0) continue;
      // mimic hover for x/y graphs
      if (plot.classList.contains("plot-xy")) {
        const factor = plot.data[0].x.length / nbrPoints;
        const mapped_index = parseInt(factor * index);

        Plotly.Fx.hover(plot, {
          xval: plot.data[0].x[mapped_index],
          yval: plot.data[0].y[mapped_index],
        });
      }

      // mimic hover for t/y graphs
      if (plot.classList.contains("plot-yt")) {
        // hide the spike
        Plotly.Fx.hover(plot, {
          xpx: -100,
        });
      }
    }
  };

  const plotInitialData = () => {
    if (initialKeys === undefined) return; // return if we have no initial keys
    if (initialKeys === []) return; // return if we have no initial keys
    setSelected_X(initialKeys[0]);
    setSelected_Y(initialKeys[1]);
    addData(initialKeys[0].key, initialKeys[0].nested, initialKeys[1].nested);
  };

  return (
    <div>
      <Select options={xs} onChange={handleChangeX} value={selected_x} />
      <Select options={ys} onChange={handleChangeY} value={selected_y} />
      <Plot
        className="plot-xy"
        style={{ width: "100%" }}
        divId={`plot-${graphIndex}`}
        data={data}
        onHover={handleHover}
        layout={defaultLayout}
        config={{
          displayModeBar: false,
        }}
      />
    </div>
  );
}
export default GraphXY;
