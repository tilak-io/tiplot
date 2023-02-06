import { useState, useEffect } from "react";
import Select from "react-select";
import Plot from "react-plotly.js";
import { Container, Form, Row, Col } from "react-bootstrap";
import ToolBar from "../components/ToolBar";
import PlotData from "../controllers/PlotData";

function SyncTimestamp() {
  const plotData = new PlotData("sync-timestamp", []);

  const [mainOptions, setMainOptions] = useState([]);
  const [mainData, setMainData] = useState({});
  const [extraOptions, setExtraOptions] = useState([]);
  const [extraData, setExtraData] = useState({});
  const [shiftedData, setShiftedData] = useState({});
  const [data, setData] = useState([]);
  const [delta, setDelta] = useState(0);
  const [xaxis, setXAxis] = useState(null);
  const [zoomed, setZoomed] = useState(false);

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
  }, [delta]);

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
    console.log(xaxis);
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

  return (
    <>
      <ToolBar />
      <br />
      <Container className="settings-page">
        <Row>
          <Col>
            <Form.Control placeholder="Prefix" defaultValue="extra_" />
          </Col>
          <Col>
            <Form.Control
              placeholder="Timestamp Delta"
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
            />
          </Col>
        </Row>
        <Form.Range
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          min={-100}
          max={100}
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
          data={data}
          style={{ width: "100%", height: "100%" }}
          onRelayout={handleRelayout}
          layout={{
            autoresize: true,
            showlegend: true,
            legend: {
              x: 1,
              xanchor: "right",
              y: 1,
            },
            xaxis: {
              range: xaxis,
            },
          }}
          config={{
            responsive: true,
            displayModeBar: false,
          }}
        />
      </Container>
    </>
  );
}
export default SyncTimestamp;
