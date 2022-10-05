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

function GraphXY(props) {
  const [xs, setXs] = useState([]);
  const [ys, setYs] = useState([]);
  const [data, setData] = useState([]);
  const [selected_x, setSelected_X] = useState();

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
        setXs(options);
      });
  };

  const addData = async (table, key_x, key_y) => {
    await fetch("http://localhost:5000/values", {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },

      body: JSON.stringify({
        table: table,
        keys: [key_x, key_y],
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        var x = [],
          y = [];
        res.values.forEach((e) => {
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
  };

  const handleChangeX = (value) => {
    setSelected_X(value);
    fetch(`http://localhost:5000/key/${value.key}`)
      .then((res) => res.json())
      .then((res) => {
        var mapped_y = res.map((nested) => {
          return {
            key: value.key,
            nested: nested,
            label: `${value.key}/${nested}`,
            value: `${value.key}/${nested}`,
          };
        });
        setYs(mapped_y);
      });
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

  useEffect(() => {
    getKeys();
    function handleResize() {
      var update = {
        width: window.innerWidth * 0.6,
      };
      Plotly.update(`plot-${props.index}`, data, update);
    }
    window.addEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <Select options={xs} onChange={handleChangeX} />
      <Select options={ys} onChange={handleChangeY} />
      <Plot
        divId={`plot-${props.index}`}
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
