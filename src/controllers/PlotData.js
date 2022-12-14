import Plotly from "plotly.js/dist/plotly";

export default class PlotData {
  constructor(id, initialKeys) {
    this.id = id;
    this.initialKeys = initialKeys;
  }

  getOptions = async () => {
    const options = [];
    const response = await fetch("http://localhost:5000/tables").then((res) =>
      res.json()
    );
    const tables = response.tables;
    tables.forEach((t) => {
      var table = Object.keys(t)[0];
      var columns = Object.values(t)[0];
      columns.forEach((column) => {
        options.push({
          value: {
            table: table,
            column: column,
          },
          label: `${table}/${column}`,
        });
      });
    });
    return options;
  };

  // get data for yt graphs
  getData = async (field) => {
    const response = await fetch("http://localhost:5000/values_yt", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(field),
    }).then((res) => res.json());
    const table = response["table"];
    const column = response["column"];
    const x_name = "timestamp_tiplot";
    const x_values = [];
    const y_name = column;
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

  // get data for xy graphs
  getDataXY = async (x, y) => {
    const field = { table: x.table, columns: [x.column, y.column] };
    const response = await fetch("http://localhost:5000/values_xy", {
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
    const t_name = "timestamp_tiplot";
    const t_values = [];
    response.values.forEach((e) => {
      x_values.push(e[x_name]);
      y_values.push(e[y_name]);
      t_values.push(e[t_name]);
    });
    return {
      x: x_values,
      y: y_values,
      t: t_values,
      name: `${y_name}/${x_name}`,
      hovertemplate: `${table}: %{y:.2f}<extra></extra>`,
    };
  };

  // find the closest point to 'x' in 'array'
  findClosest = (x, array) => {
    return array.reduce((a, b) => {
      return Math.abs(b - x) < Math.abs(a - x) ? b : a;
    });
  };

  updateTimelineIndicator = (timestamp) => {
    window.currentX = timestamp;
    this.drawTimelineIndicator(timestamp);
    this.drawCrosshair(timestamp);
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

  drawCrosshair = (x) => {
    const plots = document.getElementsByClassName("plot-xy");
    for (let i = 0; i < plots.length; i++) {
      const plot = plots[i];
      if (plot.data.length == 0) return;
      const t = plot.data[0].t;
      const closest = this.findClosest(x, t);
      const index = t.indexOf(closest);
      const xp = plot.data[0].x[index];
      const yp = plot.data[0].y[index];
      const update = {
        custom: true,
        shapes: [
          {
            type: "line",
            yref: "paper",
            x0: xp,
            y0: 0,
            x1: xp,
            y1: 1,
            line: {
              color: "red",
              width: 1.5,
            },
          },

          {
            type: "line",
            xref: "paper",
            x0: 0,
            y0: yp,
            x1: 1,
            y1: yp,
            line: {
              color: "red",
              width: 1.5,
            },
          },
        ],
      };

      Plotly.relayout(plot, update);
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
      "xaxis.range": event["xaxis.range"],
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
      var x0 = this.findClosest(xrange[0], e.x);
      var x1 = this.findClosest(xrange[1], e.x);
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

  stretchHeight = () => {
    const plot = document.getElementById(`plot-${this.id}`);
    var update = {
      autoresize: true,
      width: plot?.clientWidth,
      height: plot?.clientHeight,
      "yaxis.autorange": true,
    };
    if (plot) Plotly.relayout(plot, update);
  };
}
