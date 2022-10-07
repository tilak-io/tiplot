import Select from "react-select";
import Plot from "react-plotly.js";
import Plotly from "plotly.js/dist/plotly";
import { useState, useEffect } from "react";

const defaultLayout = {
  margin: {
    t: 0,
  },
  hovermode: "x unified",
  width: window.innerWidth * 0.6,
};

function Graph({ graphIndex, socket }) {
  const [keys, setKeys] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {
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
    });

    // plot update on window resize
    function handleResize() {
      var update = {
        width: window.innerWidth * 0.6,
      };
      Plotly.update(`plot-${graphIndex}`, data, update);
    }
    window.addEventListener("resize", handleResize);
  }, []);

  const addData = async (table, key) => {
    socket.emit("get_table_values", {
      index: graphIndex,
      table: table,
      keys: [key],
    });
  };

  const removeData = async (key, nested) => {
    const name = `${key}/${nested}`;
    setData(data.filter((graph) => graph.name !== name));
  };

  const handleChange = (keysList, actionMeta) => {
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
    if (
      event["xaxis.range[0]"] !== undefined &&
      event["yaxis.range[0]"] === undefined
    ) {
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
          },
        };

        Plotly.update(plot, data, update);
        i++;
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
    const x = event.points[0].x;

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
      //Plotly.Fx.hover(plot, { xval: x });
      i++;
      if (plot.data.length == 0) continue;
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
      <Select options={keys} isMulti onChange={handleChange} />
      <Plot
        style={{ width: "100%" }}
        divId={`plot-${graphIndex}`}
        data={data}
        layout={defaultLayout}
        onRelayout={relayoutHandler}
        onHover={handleHover}
        config={{
          displayModeBar: false,
        }}
      />
    </div>
  );
}
export default Graph;
