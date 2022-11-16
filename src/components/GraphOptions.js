import { useState } from "react";
import { Button } from "react-bootstrap";
import { MdLegendToggle, MdZoomOutMap } from "react-icons/md";
import { RiDeleteBack2Fill } from "react-icons/ri";
import { BsArrowBarDown, BsArrowBarUp } from "react-icons/bs";
import { HiOutlineTicket } from "react-icons/hi";
import { CiCircleRemove } from "react-icons/ci";
import Plotly from "plotly.js/dist/plotly";

function GraphOptions({ plotId, graphIndex, removeGraph }) {
  const [showLegend, setShowLegend] = useState(false);
  const [showSelect, setShowSelect] = useState(false);

  const toggleLegend = () => {
    setShowLegend(!showLegend);
    const update = {
      showlegend: showLegend,
    };
    const plot = document.getElementById(plotId);
    Plotly.relayout(plot, update);
  };

  const changeHeight = (value) => {
    const plots = document.getElementsByClassName("js-plotly-plot");
    const currentHeight = plots[0].clientHeight;
    if (currentHeight + value < 150) return;
    var update = {
      height: currentHeight + value,
      "yaxis.autorange": true,
    };
    for (let i = 0; i < plots.length; i++) {
      Plotly.relayout(plots[i], update);
    }
  };

  const toggleSelect = () => {
    setShowSelect(!showSelect);
    const select = document.getElementById(`select-${graphIndex}`);
    if (showSelect) select.style.display = "block";
    else select.style.display = "none";
  };

  const autoscale = () => {
    const update = {
      "xaxis.autorange": true,
      "yaxis.autorange": true,
    };
    const plot = document.getElementById(plotId);
    Plotly.relayout(plot, update);
  };

  return (
    <div className="plot-options">
      <span onClick={() => removeGraph(graphIndex)}>
        <RiDeleteBack2Fill style={{ width: "100%", color: "red" }} />
      </span>

      <span onClick={() => changeHeight(-20)}>
        <BsArrowBarUp style={{ width: "100%" }} />
      </span>

      <span onClick={() => changeHeight(20)}>
        <BsArrowBarDown style={{ width: "100%" }} />
      </span>

      <span
        onClick={toggleLegend}
        style={{ color: showLegend ? "grey" : "black" }}
      >
        <HiOutlineTicket style={{ width: "100%" }} />
      </span>

      <span onClick={autoscale}>
        <MdZoomOutMap style={{ width: "100%" }} />
      </span>
    </div>
  );
}
export default GraphOptions;
