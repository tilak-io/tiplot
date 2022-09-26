import Select from "react-select";
import Plot from "react-plotly.js";
import Plotly from "plotly.js/dist/plotly";
import { useState, useEffect } from "react";

const defaultLayout = {
  margin: {
    t: 0,
  },
  width: window.innerWidth,
  xaxis: {
    showspikes: true,
  },
  yaxis: {
    showspikes: true,
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

  const addData = async (key, nested_x, nested_y) => {
    await fetch(`http://localhost:5000/valuesxy/${key}/${nested_x}/${nested_y}`)
      .then((res) => res.json())
      .then((res) => {
        var x = [],
          y = [];
        res.data.forEach((e) => {
          x.push(e[nested_x]);
          y.push(e[nested_y]);
        });
        var line = {
          x: x,
          y: y,
          name: `${key}/${nested_x}:${nested_y}`,
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
      <Select options={xs} onChange={handleChangeX} />
      <Select options={ys} onChange={handleChangeY} />
      <Plot
        divId={`plot-${props.index}`}
        data={data}
        layout={defaultLayout}
        config={{
          displayModeBar: false,
        }}
      />
    </div>
  );
}
export default GraphXY;
