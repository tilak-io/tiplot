import Select from "react-select";
import Plot from "react-plotly.js";
import Plotly from "plotly.js/dist/plotly";
import { useState, useEffect } from "react";

const defaultLayout = {
  margin: {
    t: 0,
  },
  width: window.innerWidth * 0.6,
  //hovermode: "x unified",
  xaxis: {
    spikemode: "across",
  },
  yaxis: {
    spikemode: "across",
  },
};
function GraphXY({ socket, graphIndex }) {
  const [xs, setXs] = useState([]);
  const [ys, setYs] = useState([]);
  const [data, setData] = useState([]);
  const [selected_x, setSelected_X] = useState();

  useEffect(() => {
    // request table keys
    socket.emit("get_table_keys", graphIndex);

    // set the X array
    socket.on("table_keys", (response) => {
      const index = response["index"];
      const keys = response["keys"];
      console.log(response);

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

    function handleResize() {
      var update = {
        width: window.innerWidth * 0.6,
      };
      Plotly.update(`plot-${graphIndex}`, data, update);
    }
    window.addEventListener("resize", handleResize);
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

  const handleChangeY = (selected_y) => {
    addData(selected_x.key, selected_x.nested, selected_y.nested);
  };

  const handleHover = (event) => {
    let i = 0;
    const index = event.points[0].pointIndex;
    const nbrPoints = event.points[0].data.x.length;

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
      if (plot.data.length === 0) continue;
      //Plotly.Fx.hover(plot, { xval: x });
      const factor = plot.data[0].x.length / nbrPoints;
      const mapped_index = parseInt(factor * index);
      Plotly.Fx.hover(plot, {
        xval: plot.data[0].x[mapped_index],
        yval: plot.data[0].y[mapped_index],
      });
    }
  };

  return (
    <div>
      <Select options={xs} onChange={handleChangeX} />
      <Select options={ys} onChange={handleChangeY} />
      <Plot
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
