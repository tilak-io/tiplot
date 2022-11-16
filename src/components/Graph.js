import Select from "react-select";
import Plot from "react-plotly.js";
import Plotly from "plotly.js/dist/plotly";
import { useState, useEffect } from "react";
import GraphOptions from "./GraphOptions";

const defaultLayout = {
  showlegend: true,
  legend: {
    x: 1,
    xanchor: "right",
    y: 1,
  },
  margin: {
    t: 0,
  },
  yaxis: {
    // linecolor: "white",
    // gridcolor: "#ddd",
    // color: "#fff"
  },
  xaxis: {
    showspikes: true,
    spikesnap: "cursor",
    // linecolor: "white",
    // gridcolor: "#eee",
    // color: "#fff"
  },
  hovermode: "x unified",
  // plot_bgcolor: "#121212",
  // paper_bgcolor: "#121212",

  // colorway:["#ea5545", "#f46a9b", "#ef9b20", "#edbf33", "#ede15b", "#bdcf32", "#87bc45", "#27aeef", "#b33dc6"]
  // colorway: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
};

function Graph({ graphIndex, socket, updateKeys, initialKeys, removeGraph }) {
  const [keys, setKeys] = useState([]);
  const [data, setData] = useState([]);
  const [selectedValue, setSelected] = useState();

  useEffect(() => {
    plotInitialData();
    socket.emit("get_table_keys", graphIndex);

    // map and set the keys when recieved from backend
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
      setKeys(options);
    });
    // eslint-disable-next-line
  }, []);

  const addData = async (table, key) => {
    socket.off("table_values");
    socket.emit("get_table_values", {
      index: graphIndex,
      table: table,
      keys: [key],
    });

    socket.on("table_values", (response) => {
      const index = response["index"];
      const table = response["table"];
      const key = response["y"];
      const values = response["values"];

      // return if its not the components that made the request
      if (index !== graphIndex) return;

      var x = [],
        y = [];
      values.forEach((e) => {
        x.push(e["timestamp"]);
        y.push(e[key]);
      });
      var line = {
        x: x,
        y: y,
        name: `${table}/${key}`,
      };
      setData([...data, line]);

      // autoscale after adding new data
      var update = {
        "yaxis.autorange": true,
      };
      Plotly.relayout(`plot-${graphIndex}`, update);
    });
  };

  const removeData = async (key, nested) => {
    const name = `${key}/${nested}`;
    setData(data.filter((graph) => graph.name !== name));
  };

  const handleChange = (keysList, actionMeta) => {
    updateKeys(graphIndex, keysList);
    setSelected(keysList);
    switch (actionMeta.action) {
      case "select-option":
        addData(actionMeta.option.key, actionMeta.option.nested);
        break;
      case "remove-value":
        removeData(actionMeta.removedValue.key, actionMeta.removedValue.nested);
        break;
      case "pop-value":
        removeData(actionMeta.removedValue.key, actionMeta.removedValue.nested);
        break;
      case "clear":
        setData([]);
        break;
      default:
        break;
    }
  };

  // find the closest point to 'x' in 'array'
  const findClosest = (x, array) => {
    return array.x.reduce((a, b) => {
      return Math.abs(b - x) < Math.abs(a - x) ? b : a;
    });
  };

  const relayoutHandler = (event) => {
    var event_xrange = [event["xaxis.range[0]"], event["xaxis.range[1]"]];
    // adjust range when zooming on xaxis only
    if (event["xaxis.range[0]"] !== undefined) {
      let i = 0;
      while (document.getElementById(`plot-${i}`)) {
        var plot = document.getElementById(`plot-${i}`);

        var max_values = [];
        var min_values = [];
        for (let j = 0; j < plot.data.length; j++) {
          var e = plot.data[j];
          var x0 = findClosest(event_xrange[0], e);
          var x1 = findClosest(event_xrange[1], e);
          const visible_y_data = e.y.slice(e.x.indexOf(x0), e.x.indexOf(x1));

          max_values.push(Math.max.apply(Math, visible_y_data));
          min_values.push(Math.min.apply(Math, visible_y_data));
        }

        const max = Math.max.apply(Math, max_values);
        const min = Math.min.apply(Math, min_values);
        const margin = (max - min) / 4;
        var new_y_range = [min - margin, max + margin];
        var update = {
          yaxis: {
            range: new_y_range,
          },
          xaxis: {
            range: event_xrange,
            spikesnap: "cursor",
            showspikes: true,
          },
        };

        i++;
        // only zoom on y/t plots
        if (plot.classList.contains("plot-yt"))
          Plotly.update(plot, data, update);
      }
    }

    // resetting all layouts when double tap
    if (
      event["xaxis.autorange"] !== undefined &&
      event["yaxis.autorange"] !== undefined
    ) {
      let i = 0;
      while (document.getElementById(`plot-${i}`)) {
        plot = document.getElementById(`plot-${i}`);
        Plotly.update(plot, data, event);
        i++;
      }
    }
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
      if (graphIndex === i - 1) continue; // dont mimic hover on the same graph we're hovering over
      if (plot.data.length === 0) continue; // dont mimic hover on a graph that has no data
      // mimic hover for t/y graphs
      if (plot.classList.contains("plot-yt")) {
        Plotly.Fx.hover(plot, event.event);
      }

      // mimic hover for x/y graphs
      if (plot.classList.contains("plot-xy")) {
        const factor = plot.data[0].x.length / nbrPoints;
        const mapped_index = parseInt(factor * index);

        Plotly.Fx.hover(plot, {
          xval: plot.data[0].x[mapped_index],
          yval: plot.data[0].y[mapped_index],
        });
      }
    }
  };

  const handleClick = (event) => {
    let i = 0;
    const index = event.points[0].pointIndex;
    const nbrPoints = event.points[0].data.x.length;
    // const x = event.points[0].x;
    if (window.time_array !== undefined) {
      const start = window.time_array[0];
      const stop = window.time_array[window.time_array.length - 1];
      const totalSecs = window.Cesium.JulianDate.secondsDifference(stop, start);
      if (event.event.ctrlKey)
        window.viewer.clock.currentTime.secondsOfDay =
          window.viewer.clock.startTime.secondsOfDay +
          (index / nbrPoints) * totalSecs;
    }
  };

  const plotInitialData = () => {
    if (initialKeys === undefined) return; // return if we have no initial keys

    setSelected(initialKeys);
    var initialData = [];
    initialKeys.forEach((option, index) => {
      socket.emit("get_table_values", {
        index: graphIndex,
        table: option.key,
        keys: [option.nested],
      });
    });

    socket.on("table_values", (response) => {
      // console.log(initialData);
      const index = response["index"];
      const table = response["table"];
      const key = response["y"];
      const values = response["values"];

      // return if its not the components that made the request
      if (index !== graphIndex) return;

      var x = [],
        y = [];
      values.forEach((e) => {
        x.push(e["timestamp"]);
        y.push(e[key]);
      });
      var line = {
        x: x,
        y: y,
        // mode: "markers",
        // type: "scatter",
        // marker: { size: 5 },
        name: `${table}/${key}`,
      };
      initialData.push(line);
      setData(initialData);
    });
  };

  return (
    <div>
      <Select
        id={`select-${graphIndex}`}
        options={keys}
        isMulti
        onChange={handleChange}
        value={selectedValue}
        closeMenuOnSelect={false}
      />
      <div className="d-flex">
        <Plot
          className="plot-yt"
          divId={`plot-${graphIndex}`}
          data={data}
          layout={defaultLayout}
          onRelayout={relayoutHandler}
          onHover={handleHover}
          onClick={handleClick}
          useResizeHandler
          config={{
            displayModeBar: false,
            // responsive: true,
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
export default Graph;
