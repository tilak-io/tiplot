import Plotly from "plotly.js/dist/plotly";

export default class PlotData {
  constructor(id, initialKeys) {
    this.id = id;
    this.initialKeys = initialKeys;
    this.plotInitialData();
  }

  getOptions = async () => {
    const options = [];
    const response = await fetch("http://localhost:5000/tables").then((res) =>
      res.json()
    );
    const tables = response.tables;
    tables.forEach((table) => {
      var key = Object.keys(table)[0];
      var columns = Object.values(table)[0];
      columns.forEach((column) => {
        options.push({
          value: {
            key: key,
            column: column,
          },
          label: `${key}/${column}`,
        });
      });
    });
    return options;
  };

  getData = async (field) => {
    const response = await fetch("http://localhost:5000/table_values", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(field),
    }).then((res) => res.json());

    const table = response["table"];
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
    };
  };

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

  autoRange = (event) => {
    const plots = document.getElementsByClassName("plot-yt");
    event["custom"] = true;
    for (let i = 0; i < plots.length; i++) {
      if (plots[i].data === undefined) continue;
      Plotly.relayout(plots[i], event);
    }
  };

  syncHorizontalAxis = (event) => {
    const plots = document.getElementsByClassName("plot-yt");
    const update = {
      "xaxis.range[0]": event["xaxis.range[0]"],
      "xaxis.range[1]": event["xaxis.range[1]"],
      custom: true,
    };

    for (let i = 0; i < plots.length; i++) {
      Plotly.relayout(plots[i], update);
    }
  };

  getScaledYAxis = (xrange) => {
    const plot = document.getElementById(`plot-${this.id}`);
    var max_values = [];
    var min_values = [];
    if (plot.data.length === 0) return;
    for (let j = 0; j < plot.data.length; j++) {
      var e = plot.data[j];
      if (e.visible === "legendonly") continue;
      var x0 = this.findClosest(xrange[0], e);
      var x1 = this.findClosest(xrange[1], e);
      const visible_y_data = e.y.slice(e.x.indexOf(x0), e.x.indexOf(x1));
      max_values.push(Math.max.apply(Math, visible_y_data));
      min_values.push(Math.min.apply(Math, visible_y_data));
      const max =
        Math.max.apply(Math, max_values) !== Infinity
          ? Math.max.apply(Math, max_values)
          : 1;
      const min =
        Math.min.apply(Math, min_values) !== -Infinity
          ? Math.min.apply(Math, min_values)
          : 0;

      var margin = (max - min) / 5;
      margin = margin === 0 ? 0.5 : margin; // set the margin to 1 in case of max == min
      var new_y_range = [min - margin, max + margin];
    }
    return new_y_range;
  };

  autoScaleVerticalAxis = (event) => {
    const plot = document.getElementById(`plot-${this.id}`);
    var xrange = [event["xaxis.range[0]"], event["xaxis.range[1]"]];
    var yrange = this.getScaledYAxis(xrange);
    const update = {
      custom: true,
      "xaxis.range": xrange,
      "yaxis.range": yrange,
    };
    Plotly.relayout(plot, update);
  };

  plotInitialData = async () => {};
}
