import { useState, useEffect } from "react";
import Select from "react-select";
import Plot from "react-plotly.js";
import { Container, Form, Row, Col, Button } from "react-bootstrap";
import ToolBar from "../components/ToolBar";
import PlotData from "../controllers/PlotData";
import { PORT } from "../static/js/constants";
import { useNavigate } from "react-router-dom";

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
  const [prefix, setPrefix] = useState("extra_");
  const navigate = useNavigate();

  useEffect(() => {
    getOptions();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setData([mainData, shiftedData]);
  }, [mainData, shiftedData]);

  useEffect(() => {
    shiftTimestamp(delta);
    // eslint-disable-next-line
  }, [delta, extraData]);

  useEffect(() => {
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

      case "custom":
      default:
        break;
    }
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

  const shiftTimestamp = (_delta) => {
    const dt = parseFloat(_delta);
    const ed = Object.assign({}, extraData);
    if ("x" in ed) {
      ed.x = ed.x.map((t) => t + dt);
      setShiftedData(ed);
    }
    updateXAxis();
  };

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
    if (
      event["xaxis.autorange"] !== undefined &&
      event["yaxis.autorange"] !== undefined
    ) {
      setZoomed(false);
    } else {
      setZoomed(true);
    }
  };

  const handleClick = (event) => {
    if (event.event.ctrlKey) {
      console.log(event);
    }
  };

  const handleRadioChange = (event) => {
    var selected = event.target.id;
    setSyncType(selected);
  };

  const findFirstChange = (data) => {
    for (let i = 0; i < data.y.length - 1; i++) {
      if (data.y[i] !== data.y[i + 1]) {
        return data.x[i];
      }
    }
    return data.x[0];
  }

  const handleApply = async () => {
    const req = {
      "prefix": prefix,
      "delta": delta
    };

    const response = await fetch(`http://localhost:${PORT}/merge_extra`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(req),
    }).then((res) => res.json()).then((res) => {
      if (res.ok) navigate("/home");
      else alert("Error: Can't merge datadicts");

    });
  }

  return (
    <>
      <ToolBar />
      <br />
      <Container className="settings-page">
        <Row>
          <Col>
            <Form.Control placeholder="Prefix" defaultValue="extra_" onChange={(e) => setPrefix(e.target.value)} />
          </Col>
          <Col>
            <Form.Control
              placeholder="Timestamp Delta"
              type="number"
              value={delta}
              step={0.01}
              onChange={(e) => setDelta(e.target.value)}
              disabled={syncType !== "custom"}
            />
          </Col>
        </Row>
        <Form.Range
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          step={0.01}
          min={-range}
          max={range}
          disabled={syncType !== "custom"}
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
