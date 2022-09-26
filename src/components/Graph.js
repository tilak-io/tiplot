import Select from "react-select";
import Plot from "react-plotly.js";
import Plotly from "plotly.js/dist/plotly";
import { useState, useEffect } from "react";

const defaultLayout = {
  margin: {
    t: 0,
  },
  hovermode: "x unified",
  width: window.innerWidth,
};

function Graph(props) {
  const [keys, setKeys] = useState([]);
  const [data, setData] = useState([]);

  const getKeys = () => {
    fetch("http://localhost:5000/keys")
      .then((res) => res.json())
      .then((res) => {
        var options = [];
        res.forEach((value, index) => {
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
  };

  const addData = async (key, nested) => {
    await fetch(`http://localhost:5000/values/${key}/${nested}`)
      .then((res) => res.json())
      .then((res) => {
        var x = [],
          y = [];
        res.data.forEach((e) => {
          x.push(e["timestamp"]);
          y.push(e[nested]);
        });
        var line = {
          x: x,
          y: y,
          name: `${key}/${nested}`,
        };
        setData([...data, line]);
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
      case "clear":
        setData([]);
        break;
      default:
        break;
    }
  };

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
      for (let i = 0; i < props.graphNbr; i++) {
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
      }
    }

    // resetting all layouts when double tap
    if (
      event["xaxis.autorange"] !== undefined &&
      event["yaxis.autorange"] !== undefined
    ) {
      for (let i = 0; i < props.graphNbr; i++) {
        plot = document.getElementById(`plot-${i}`);
        Plotly.update(plot, data, event);
      }
    }
  };

  const handleHover = (event) => {
    const index = event.points[0].pointIndex;
    const nbrPoints = event.points[0].data.x.length;
    const x = event.points[0].x;

    if (window.startTime !== undefined) {
      const curr = window.Cesium.JulianDate.addSeconds(
        window.startTime,
        (window.totalSeconds * index) / nbrPoints,
        new window.Cesium.JulianDate()
      );
      if (event.event.altKey) window.viewer.clock.currentTime = curr.clone();
    }

    for (let i = 0; i < props.graphNbr; i++) {
      Plotly.Fx.hover(`plot-${i}`, { xval: x });
    }
  };

  useEffect(() => {
    getKeys();
    function handleResize() {
      var update = {
        width: window.innerWidth,
      };
      Plotly.update(`plot-${props.index}`, data, update);
    }
    window.addEventListener("resize", handleResize);
  });

  return (
    <div>
      <Select options={keys} isMulti onChange={handleChange} />
      <Plot
        divId={`plot-${props.index}`}
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
