import Plotly from "plotly.js/dist/plotly";
import { PORT } from "../static/js/constants";

export default class PlotData {
  constructor(id, initialKeys) {
    window.Plotly = Plotly; // DEBUG purposes
    this.id = id;
    this.initialKeys = initialKeys;
  }

  getOptions = async () => {
    const options = [];
    const response = await fetch(`http://localhost:${PORT}/tables`).then(
      (res) => res.json()
    );
    const tables = response.tables;
    tables.forEach((t) => {
      var table = Object.keys(t)[0];
      var columns = Object.values(t)[0];
      columns = columns.filter((col) => col != "timestamp_tiplot");
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

  getTables = async () => {
    const response = await fetch(`http://localhost:${PORT}/keys`).then((res) =>
      res.json()
    );
    const tables = response.keys.map((table) => {
      return {
        value: {
          table: table,
        },
        label: table,
      };
    });
    return tables;
  };

  // get data for yt graphs
  getData = async (field) => {
    const response = await fetch(`http://localhost:${PORT}/values_yt`, {
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
    if (typeof y_values[0] == "string") {
      const gs = localStorage.getItem("general_settings");
      const y_text = gs ? JSON.parse(gs)["textYValue"] ?? 0 : 0;
      return {
        x: x_values,
        y: Array(x_values.length).fill(y_text),
        name: `${table}/${y_name}`,
        hovertemplate: "%{text}",
        type: "scatter",
        mode: "markers",
        text: y_values,
        textposition: "top center",
      };
    } else
      return {
        x: x_values,
        y: y_values,
        name: `${table}/${y_name}`,
        // hovertemplate: `${table}/${y_name}: %{y:f}<extra></extra>`,
        hovertemplate: `%{y}`,
      };
  };

  // get data for xy graphs
  getDataXY = async (x, y) => {
    const field = { table: x.table, columns: [x.column, y.column] };
    const response = await fetch(`http://localhost:${PORT}/values_xy`, {
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

  // get correlation matrix for heatmaps
  getCorrMatrix = async (fields) => {
    const tables = {};
    // regrouping all the columns of the same table
    for (const {
      value: { table, column },
    } of fields) {
      if (!tables[table]) {
        tables[table] = [];
      }
      tables[table] = tables[table].concat(column);
    }
    const req = { tables: tables, x_range: window.x_range };
    const response = await fetch(`http://localhost:${PORT}/correlation`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(req),
    }).then((res) => res.json());

    return {
      x: response["columns"],
      y: response["columns"],
      z: response["values"],
      zmin: 0,
      zmax: 1,
      type: "heatmap",
      hoverongaps: false,
    };
  };

  // find the closest point to 'x' in 'array'
  findClosest = (x, array) => {
    return array.reduce((a, b) => {
      return Math.abs(b - x) < Math.abs(a - x) ? b : a;
    });
  };

  updateTimelineIndicator = (timestamp) => {
    if (!timestamp) {
      console.log("undefined timestamp");
      return;
    }
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
      if (plots[i].data.length === 0) continue;
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
    // const plots = document.getElementsByClassName("plot-yt");
    // event["custom"] = true;
    // for (let i = 0; i < plots.length; i++) {
    //   if (plots[i].data === undefined) continue;
    //   Plotly.relayout(plots[i], event);
    // }
    const plots = document.getElementsByClassName("plot-yt");
    const heatmaps = document.getElementsByClassName("plot-hm");
    var max_values = [];
    var min_values = [];

    for (let i = 0; i < plots.length; i++) {
      if (plots[i].data === undefined) continue;
      if (plots[i].data.length === 0) continue;
      if (plots[i].data[0].visible === "legendonly") continue;

      // TODO: investigate
      try {
        let minMax = plots[i].data[0].x.reduce(
          (acc, cur) => {
            return {
              min: Math.min(acc.min, cur),
              max: Math.max(acc.max, cur),
            };
          },
          { min: Infinity, max: -Infinity }
        );
        min_values.push(minMax.min);
        max_values.push(minMax.max);
      } catch (e) {
        alert(e);
      }
    }

    const all_min = Math.min.apply(Math, min_values);
    const all_max = Math.max.apply(Math, max_values);

    const update = {
      custom: true,
      "xaxis.range": [all_min, all_max],
      "yaxis.autorange": true,
    };

    for (let i = 0; i < plots.length; i++) {
      if (plots[i].data === undefined) continue;
      Plotly.relayout(plots[i], update);
    }

    // reset the x_range
    // and notify the heatmaps
    window.x_range = undefined;
    for (let i = 0; i < heatmaps.length; i++) {
      Plotly.relayout(heatmaps[i], { x_rangeChanged: true });
    }
  };

  syncHorizontalAxis = (event) => {
    if (!event["xaxis.range"] && !event["xaxis.range[0]"]) return; // ignore {autoresize: true}
    const plots = document.getElementsByClassName("plot-yt");
    const heatmaps = document.getElementsByClassName("plot-hm");
    const update = {
      "xaxis.range": event["xaxis.range"],
      "xaxis.range[0]": event["xaxis.range[0]"],
      "xaxis.range[1]": event["xaxis.range[1]"],
      custom: true,
    };

    for (let i = 0; i < plots.length; i++) {
      Plotly.relayout(plots[i], update);
    }
    // this.filterPointInTimeRange(event);
    // mainly to use for heatmaps
    window.x_range = [event["xaxis.range[0]"], event["xaxis.range[1]"]];
    for (let i = 0; i < heatmaps.length; i++) {
      Plotly.relayout(heatmaps[i], { x_rangeChanged: true });
    }
  };

  // TODO: FINISH THIS
  // filterPointInTimeRange = (event) => {
  //   window.Plotly = Plotly;
  //   if (!event["xaxis.range[0]"]) return;
  //   const start = event["xaxis.range[0]"];
  //   const stop = event["xaxis.range[1]"];
  //   const plots = document.getElementsByClassName("plot-xy");
  //   for (let i = 0; i < plots.length; i++) {
  //     const xs = plots[i].data[0].x;
  //     const ys = plots[i].data[0].y;
  //     const ts = plots[i].data[0].t;
  //     const range = ts.filter((t) => t >= start && t <= stop);
  //     const startIndex = ts.indexOf(range[0]);
  //     const stopIndex = ts.indexOf(range[range.length - 1]);
  //     const newXs = xs.slice(startIndex, stopIndex);
  //     const newYs = ys.slice(startIndex, stopIndex);
  //   }
  // };

  getScaledYAxis = (xrange) => {
    const plot = document.getElementById(`plot-${this.id}`);
    // const yData = plot.data.map((series) => series.y);
    const yData = plot.data.reduce((acc, series) => {
      const filteredY = series.y.filter(
        (y, i) => series.x[i] >= xrange[0] && series.x[i] <= xrange[1]
      );
      return acc.concat(filteredY);
    }, []);
    const yMin = Math.min(...yData);
    const yMax = Math.max(...yData);

    var margin = (yMax - yMin) / 5;
    margin = margin === 0 ? 0.5 : margin; // set the margin to 1 in case of max == min
    var rangeY = [yMin - margin, yMax + margin];
    return rangeY;
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
