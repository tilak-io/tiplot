import { useState } from "react";
import { Button } from "react-bootstrap";
import { MdLegendToggle, MdZoomOutMap } from "react-icons/md";
import { BsArrowBarDown, BsArrowBarUp, BsTrash } from "react-icons/bs";
import { HiOutlineTicket } from "react-icons/hi";
import { AiOutlineDotChart, AiOutlineLineChart } from "react-icons/ai";
import { TbChartDots } from "react-icons/tb";
import Plotly from "plotly.js/dist/plotly";

function GraphOptions({ plotId, graphIndex, removeGraph }) {
  const [showLegend, setShowLegend] = useState(true);
  const [plotType, setPlotType] = useState(1);
  const [legendAnchor, setLegendAnchor] = useState(1);

  const toggleLegend = () => {
    var update;

    switch (legendAnchor) {
      case 0:
        update = {
          showlegend: true,
          legend: {
            xanchor: "right",
            x: 1,
          },
        };
        break;
      case 1:
        update = {
          showlegend: true,
          legend: {
            xanchor: "left",
            x: 0,
          },
        };
        break;
      case 2:
        update = {
          showlegend: false,
        };
        break;
    }

    const plot = document.getElementById(plotId);
    Plotly.relayout(plot, update);

    if (legendAnchor >= 2) {
      setLegendAnchor(0);
      setShowLegend(false);
    } else {
      setLegendAnchor(legendAnchor + 1);
      setShowLegend(true);
    }
  };

  const changeHeight = (value) => {
    const plot = document.getElementById(plotId);
    const currentHeight = plot.clientHeight;
    if (currentHeight + value < 150) return;
    var update = {
      height: currentHeight + value,
    };
    Plotly.relayout(plot, update);
  };

  const autoscale = () => {
    const update = {
      "xaxis.autorange": true,
      "yaxis.autorange": true,
    };
    const plot = document.getElementById(plotId);
    Plotly.relayout(plot, update);
  };

  const toggleScatter = () => {
    var update;
    switch (plotType) {
      case 0:
        update = {
          mode: "line",
        };
        break;
      case 1:
        update = {
          mode: "lines+markers",
        };
        break;
      case 2:
        update = {
          mode: "markers",
        };
        break;
    }
    const plot = document.getElementById(plotId);
    Plotly.restyle(plot, update);

    if (plotType >= 2) setPlotType(0);
    else setPlotType(plotType + 1);
  };

  function ToggleScatterIcon() {
    var icon;
    switch (plotType) {
      case 0:
        icon = <AiOutlineDotChart style={{ width: "100%" }} />;
        break;
      case 1:
        icon = <AiOutlineLineChart style={{ width: "100%" }} />;
        break;
      case 2:
        icon = <TbChartDots style={{ width: "100%" }} />;
        break;
      default:
        icon = <AiOutlineLineChart style={{ width: "100%" }} />;
        break;
    }
    return icon;
  }

  return (
    <div className="plot-options">
      <span onClick={() => removeGraph(graphIndex)}>
        <BsTrash style={{ width: "100%", color: "red" }} />
      </span>

      <span
        onClick={toggleLegend}
        style={{ color: showLegend ? "black" : "grey" }}
      >
        <HiOutlineTicket style={{ width: "100%" }} />
      </span>

      <span onClick={toggleScatter}>
        <ToggleScatterIcon style={{ width: "100%" }} />
      </span>

      <span onClick={autoscale}>
        <MdZoomOutMap style={{ width: "100%" }} />
      </span>
    </div>
  );
}
export default GraphOptions;
