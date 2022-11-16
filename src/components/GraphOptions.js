import { useState } from "react";
import { Button } from "react-bootstrap";
import { MdLegendToggle, MdZoomOutMap } from "react-icons/md";
import { AiOutlineZoomIn, AiOutlineZoomOut } from "react-icons/ai";
import { IoMdRemoveCircle } from "react-icons/io";
import { BsArrowBarDown, BsArrowBarUp } from "react-icons/bs";
import Plotly from "plotly.js/dist/plotly";

function GraphOptions({ plotId }) {
  const [showLegend, setShowLegend] = useState(false);

  const toggleLegend = () => {
    setShowLegend(!showLegend);
    const update = {
      showlegend: showLegend,
    };
    const plot = document.getElementById(plotId);
    Plotly.relayout(plot, update);
  };

  const changeHeight = (value) => {
    let plots = document.getElementsByClassName("js-plotly-plot");
    const currentHeight = plots[0].clientHeight;
    var update = {
      height: currentHeight + value,
    };

    for (let i = 0; i < plots.length; i++) {
      Plotly.relayout(plots[i], update);
    }
  };

  return (
    <div className="plot-options">
      <span
        onClick={toggleLegend}
        style={{ color: showLegend ? "grey" : "blue" }}
      >
        <MdLegendToggle style={{ width: "100%" }} />
      </span>

      <span onClick={() => changeHeight(20)}>
        <BsArrowBarDown style={{ width: "100%" }} />
      </span>

      <span onClick={() => changeHeight(-20)}>
        <BsArrowBarUp style={{ width: "100%" }} />
      </span>

      <span>
        <IoMdRemoveCircle style={{ width: "100%", color: "red" }} />
      </span>
    </div>
  );
}
export default GraphOptions;
