import { useState } from "react";
import { MdZoomOutMap } from "react-icons/md";
import { BsTrash } from "react-icons/bs";
import { HiOutlineTicket } from "react-icons/hi";
import { AiOutlineDotChart, AiOutlineLineChart } from "react-icons/ai";
import { BiMoveHorizontal } from "react-icons/bi";
import { TbChartDots } from "react-icons/tb";
import Plotly from "plotly.js/dist/plotly";

function GraphOptions({ plotId, id, removeGraph }) {
  const [showLegend, setShowLegend] = useState(true);
  const [plotType, setPlotType] = useState(1);
  const [legendAnchor, setLegendAnchor] = useState(1);
  const [rslider, setRSlider] = useState(true);

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
      default:
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
      default:
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

  const toggleRangeslider = () => {
    setRSlider(!rslider);
    const rs = rslider ? {} : false;
    const update = {
      xaxis: { rangeslider: rs },
    };
    const plot = document.getElementById(plotId);

    Plotly.relayout(plot, update);
  };

  return (
    <div className="plot-options">
      <span onClick={() => removeGraph(id)}>
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

      {/* <span onClick={toggleRangeslider}> */}
      {/*   <BiMoveHorizontal */}
      {/*     style={{ color: rslider ? "grey" : "black", width: "100%" }} */}
      {/*   /> */}
      {/* </span> */}
    </div>
  );
}
export default GraphOptions;
