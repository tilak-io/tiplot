import Plotly from "plotly.js/dist/plotly";

export default class PlotData {

  constructor(id) {
    this.id = id;
  }

  getOptions = async () => {
    const options = [];
    const response = await fetch("http://localhost:5000/tables")
      .then((res) => res.json());
    const tables = response.tables;
    tables.forEach((table) => {
      var key = Object.keys(table)[0];
      var columns = Object.values(table)[0];
      columns.forEach((column) => {
        options.push({
          value: {
            "key": key,
            "column": column
          },
          label: `${key}/${column}`,
        });
      });
    });
    return options;
  }


  getData = async (field) => {
    const response = await fetch("http://localhost:5000/table_values", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(field)
    })
      .then((res) => res.json());


    const table = response["table"]
    const x_name = response["x"];
    const x_values = [];
    const y_name = response["y"];
    const y_values = [];

    response.values.forEach((e) => {
      x_values.push(e[x_name]);
      y_values.push(e[y_name]);
    });

    return {
      x: x_values,
      y: y_values,
      name: `${table}/${y_name}`,
      hovertemplate: `${table}: %{y:.2f}<extra></extra>`,
    }
  }

  // find the closest point to 'x' in 'array'
  findClosest = (x, array) => {
    return array.x.reduce((a, b) => {
      return Math.abs(b - x) < Math.abs(a - x) ? b : a;
    });
  };

  updateTimelineIndicator = (timestamp, index) => {
    window.currentX = timestamp;
    this.drawTimelineIndicator(timestamp);
    // drawCrosshair(index);
  };

  drawTimelineIndicator = (x) => {
    const plots = document.getElementsByClassName("plot-yt");
    const update = {
      custom: true,
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
          },
        },
      ],
    };

    for (let i = 0; i < plots.length; i++) {
      Plotly.relayout(plots[i], update);
    }
  };


}
