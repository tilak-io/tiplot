import { useState, useEffect } from "react";
import Select from "react-select";
import Plot from "react-plotly.js";
import { Container, Form, Row, Col, Button } from "react-bootstrap";
import ToolBar from "../components/ToolBar";
import PlotData from "../controllers/PlotData";
import { PORT } from "../static/js/constants";
import { useNavigate } from "react-router-dom";
import Plotly from "plotly.js/dist/plotly";
import { debounce } from "lodash";

function SyncTimestamp() {
  const plotData = new PlotData("sync-plot", []);

  const [mainOptions, setMainOptions] = useState([]);
  const [mainData, setMainData] = useState({});
  const [extraOptions, setExtraOptions] = useState([]);
  const [extraData, setExtraData] = useState({});
  const [shiftedData, setShiftedData] = useState({});
  const [data, setData] = useState([]);
  const [delta, setDelta] = useState(0);
  const [xaxis, setXAxis] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [syncType, setSyncType] = useState("custom");
  const [range, setRange] = useState(1000);
  const [step, setStep] = useState(1);
  const [prefix, setPrefix] = useState("extra_");
  const navigate = useNavigate();

  useEffect(() => {
    getOptions();
    setupControls();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setData([mainData, shiftedData]);
  }, [mainData, shiftedData]);

  useEffect(() => {
    debouncedShiftTimestamp(delta);
    // eslint-disable-next-line
  }, [delta, extraData]);

  useEffect(() => {
    calculateRange();
    switch (syncType) {
      case "first-change":
        if ("x" in mainData && "x" in extraData) {
          const main_x = findFirstChange(mainData);
          const extra_x = findFirstChange(extraData);
          setDelta(main_x - extra_x);
          updateXAxis();
        }
        break;

      case "first-point":
        if ("x" in mainData && "x" in extraData) {
          const main_x = mainData.x[0];
          const extra_x = extraData.x[0];
          setDelta(main_x - extra_x);
          updateXAxis();
        }
        break;

      case "closest-point":
        if ("y" in mainData && "y" in extraData) {
          const extra_y = extraData.y[0];
          const extra_x = extraData.x[0]; // Time reference
          console.log("Extra Y", extra_y);
          // Find time whe,e we have the closest value of main_y in extra_y 
          console.log("Closest is", mainData.x[findClosestIndex(mainData.y, extra_y)]);
          const main_x = mainData.x[findClosestIndex(mainData.y, extra_y)];

          setDelta(main_x - extra_x);
          updateXAxis();
        }
        break;

      case "back-to-back":
      case "btb-inversed":
        const inv = document.getElementById("btb-inversed").checked;

        if (syncType === "back-to-back" && inv) {
          setSyncType("btb-inversed");
          return;
        }
        if ("x" in mainData && "x" in extraData) {
          if (inv) {
            const main_x = mainData.x[0];
            const extra_x = extraData.x[extraData.x.length - 1];
            setDelta(main_x - extra_x);
          } else {
            const main_x = mainData.x[mainData.x.length - 1];
            const extra_x = extraData.x[0];
            setDelta(main_x - extra_x);
          }
          updateXAxis();
        }
        break;
      case "custom":
      default:
        break;
    }
    // eslint-disable-next-line
  }, [syncType, mainData, extraData]);

  const getOptions = async () => {
    const m_opt = await plotData.getOptions(false);
    setMainOptions(m_opt);

    const e_opt = await plotData.getOptions(true);
    setExtraOptions(e_opt);
  };

  const getMainData = async (field) => {
    const d = await plotData.getData(field, false);
    setXAxis([d.x[0], d.x[d.x.length - 1]]);
    setMainData(d);
  };

  const getExtraData = async (field) => {
    const d = await plotData.getData(field, true);
    setExtraData(d);
    setShiftedData(d);
    updateXAxis();
  };

  const debouncedShiftTimestamp = debounce((_delta) => {
    const dt = parseFloat(_delta);
    const ed = Object.assign({}, extraData);
    if ("x" in ed) {
      ed.x = ed.x.map((t) => t + dt);
      setShiftedData(ed);
    }
    updateXAxis();
  }, 50);

  const updateXAxis = () => {
    if (zoomed) return;
    if ("x" in mainData && "x" in shiftedData) {
      const main_x = mainData.x;
      const shifted_x = shiftedData.x;

      const x0 = Math.min(main_x[0], shifted_x[0]);
      const x1 = Math.max(
        main_x[main_x.length - 1],
        shifted_x[shifted_x.length - 1]
      );
      setXAxis([x0, x1]);
    }
  };

  const handleRelayout = (event) => {
    if (event["xaxis.autorange"] === true) {
      setZoomed(false);
    } else {
      setZoomed(true);
    }
  };

  const handleClick = (event) => {
    // TODO: Add setting delta with the diff between two points
    if (event.event.ctrlKey) {
      console.log(event);
    }
  };

  const handleRadioChange = (event) => {
    var selected = event.target.id;
    setSyncType(selected);
    setTimeout(function() {
      autoRange();
    }, 200);
  };

  const handleInversedCheck = (event) => {
    var selected = event.target.id;
    if (event.target.checked) setSyncType(selected);
    else setSyncType("back-to-back");
    setTimeout(function() {
      autoRange();
    }, 200);
  };

  const findFirstChange = (data) => {
    for (let i = 0; i < data.y.length - 1; i++) {
      if (data.y[i] !== data.y[i + 1]) {
        return data.x[i];
      }
    }
    return data.x[0];
  };

  const findClosestIndex = (arr, value) => {
    let minDiff = Number.MAX_VALUE;
    let closestIndex = -1;

    for (let i = 0; i < arr.length; i++) {
      const diff = Math.abs(arr[i] - value);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    return closestIndex;
  }

  const handleApply = async () => {
    const req = {
      prefix: prefix,
      delta: delta,
    };

    await fetch(`http://localhost:${PORT}/merge_extra`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(req),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) navigate("/home");
        else alert("Error: Can't merge datadicts");
      });
  };

  const calculateRange = () => {
    if ("x" in mainData && "x" in extraData) {
      let min = Math.min(mainData.x[0], extraData.x[0]);
      let max = Math.max(
        mainData.x[mainData.x.length - 1],
        extraData.x[extraData.x.length - 1]
      );
      setRange(max - min);

      let stp = mainData.x[1] - mainData.x[0];
      setStep(stp);
    }

    setTimeout(function() {
      autoRange();
    }, 200);
  };

  const autoRange = () => {
    const plot = document.getElementById("sync-plot");
    const update = {
      "xaxis.autorange": true,
      "yaxis.autorange": true,
    };
    Plotly.relayout(plot, update);
  };

  const setupControls = () => {
    // TODO: Add Keyboard controls
    document.onkeyup = function(e) {
      switch (e.code) {
        case "ArrowRight":
        case "ArrowLeft":
        default:
          break;
      }
    };
  };

  return (
    <>
      <ToolBar />
      <br />
      <Container className="settings-page">
        <Row>
          <Col>
            <Form.Control
              placeholder="Prefix"
              defaultValue="extra_"
              onChange={(e) => setPrefix(e.target.value)}
            />
          </Col>
          <Col>
            <Form.Control
              placeholder="Timestamp Delta"
              type="number"
              value={delta}
              step={step}
              onChange={(e) => setDelta(e.target.value)}
              disabled={syncType !== "custom"}
            />
          </Col>
        </Row>
        <Form.Range
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          step={step}
          min={-range}
          max={range}
          disabled={syncType !== "custom"}
          onMouseUp={autoRange}
        />
        <Form.Check
          name="sync-type"
          id="custom"
          type="radio"
          label="Custom"
          defaultChecked={true}
          onChange={handleRadioChange}
        />
        <Form.Check
          name="sync-type"
          id="first-change"
          type="radio"
          label="Sync on first change"
          onChange={handleRadioChange}
        />
        <Form.Check
          name="sync-type"
          id="first-point"
          type="radio"
          label="Sync on first point"
          onChange={handleRadioChange}
        />
        <Form.Check
          name="sync-type"
          id="closest-point"
          type="radio"
          label="Sync on closest point"
          onChange={handleRadioChange}
        />
        <div className="mb-3">
          <Form.Check
            inline
            name="sync-type"
            id="back-to-back"
            type="radio"
            label="Back to back"
            onChange={handleRadioChange}
          />
          <Form.Check
            inline
            id="btb-inversed"
            type="checkbox"
            label="Inversed"
            onChange={handleInversedCheck}
            disabled={
              syncType !== "back-to-back" && syncType !== "btb-inversed"
            }
          />
        </div>
        <br />
        <Select
          placeholder="Main Datadict"
          options={mainOptions}
          onChange={(e) => getMainData(e.value)}
        />
        <Select
          placeholder="Extra Datadict"
          options={extraOptions}
          onChange={(e) => getExtraData(e.value)}
        />
        <Plot
          className="plot-yt"
          divId="sync-plot"
          data={data}
          style={{ width: "100%", height: "600px" }}
          onRelayout={handleRelayout}
          onClick={handleClick}
          layout={{
            autoresize: true,
            showlegend: false,
            legend: {
              x: 1,
              xanchor: "right",
              y: 1,
            },
            xaxis: {
              showspikes: true,
              spikecolor: "#000",
              spikemode: "across+marker",
              spikethickness: 1,
              exponentformat: "e",
              range: xaxis,
            },
            yaxis: {
              exponentformat: "e",
            },
            hovermode: "x",
          }}
          config={{
            responsive: true,
            displayModeBar: false,
          }}
        />

        <Col className="text-center">
          <Button variant="primary" onClick={handleApply} type="submit">
            Apply
          </Button>
        </Col>
        <div className="break" />
      </Container>
    </>
  );
}
export default SyncTimestamp;
