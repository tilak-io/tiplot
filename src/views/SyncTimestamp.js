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

  const [data, setData] = useState([]);

  useEffect(() => {
    getOptions();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setData([mainData, extraData]);
  }, [mainData, extraData]);

  const getOptions = async () => {
    const m_opt = await plotData.getOptions(false);
    setMainOptions(m_opt);

    const e_opt = await plotData.getOptions(true);
    setExtraOptions(e_opt);
  };

  const getMainData = async (field) => {
    const d = await plotData.getData(field, false);
    setMainData(d);
  };

  const getExtraData = async (field) => {
    const d = await plotData.getData(field, true);
    setExtraData(d);
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
              defaultValue={0}
            />
          </Col>
        </Row>
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
          layout={{
            autoresize: true,
            showlegend: true,
            legend: {
              x: 1,
              xanchor: "right",
              y: 1,
            },
          }}
          // config={{ responsive: true }}
        />
      </Container>
    </>
  );
}
export default SyncTimestamp;
