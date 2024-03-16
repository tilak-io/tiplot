import { Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import { useState, useEffect } from "react";
import PlotData from "../controllers/PlotData";
import Select from "react-select";

function EntityConfig({
  removeEntity,
  eId,
  name,
  color,
  wireframe,
  pathColor,
  alpha,
  useXYZ,
  useRPY,
  tracked,
  active,
  scale,
  position,
  attitude,
}) {
  const [_useXYZ, setXYZ] = useState(useXYZ);
  const [_useRPY, setRPY] = useState(useRPY);
  const [tables, setTables] = useState([]);
  const [options, setOptions] = useState([]);
  const [positionOptions, setPositionOptions] = useState([]);
  const [attitudeOptions, setAttitudeOptions] = useState([]);
  const [disabled, setDisabled] = useState(true);

  const mockPlot = new PlotData(0, null);

  useEffect(() => {
    getOptions();
    getTables();
    hideUnusedFields();
    setDisabled(!active);
    // eslint-disable-next-line
  }, []);

  position = position ?? { table: "" };
  attitude = attitude ?? { table: "" };

  const getTables = async () => {
    const tbl = await mockPlot.getTables();
    setTables(tbl);
  };

  const getOptions = async () => {
    const opt = await mockPlot.getOptions();
    setOptions(opt);

    // setting default options
    const p_opt = opt.filter((o) => o.value.table === position["table"]);
    const p_mapped = p_opt.map((o) => {
      return { value: o.value, label: o.value.column };
    });
    setPositionOptions(p_mapped);

    const a_opt = opt.filter((o) => o.value.table === attitude["table"]);
    const a_mapped = a_opt.map((o) => {
      return { value: o.value, label: o.value.column };
    });
    setAttitudeOptions(a_mapped);
  };

  const handlePositionTableSelect = (e) => {
    const opt = options.filter((o) => o.value.table === e.value.table);
    const mapped = opt.map((o) => {
      return { value: o.value, label: o.value.column };
    });
    setPositionOptions(mapped);
  };

  const handleAttitudeTableSelect = (e) => {
    const opt = options.filter((o) => o.value.table === e.value.table);
    const mapped = opt.map((o) => {
      return { value: o.value, label: o.value.column };
    });
    setAttitudeOptions(mapped);
  };

  const handlePositionTypeChanged = () => {
    const xyzContainer = document.getElementById(`XYZ-${eId}`);
    const coordinatesContainer = document.getElementById(`Coordinates-${eId}`);
    xyzContainer.style.display = _useXYZ ? "none" : "block";
    coordinatesContainer.style.display = _useXYZ ? "block" : "none";
    setXYZ(!_useXYZ);
  };

  const handleAttitudeTypeChanged = () => {
    const rpyContainer = document.getElementById(`RPY-${eId}`);
    const quaternionsContainer = document.getElementById(`Quaternions-${eId}`);
    rpyContainer.style.display = _useRPY ? "none" : "block";
    quaternionsContainer.style.display = _useRPY ? "block" : "none";
    setRPY(!_useRPY);
  };

  const hideUnusedFields = () => {
    const xyzContainer = document.getElementById(`XYZ-${eId}`);
    const coordinatesContainer = document.getElementById(`Coordinates-${eId}`);
    const rpyContainer = document.getElementById(`RPY-${eId}`);
    const quaternionsContainer = document.getElementById(`Quaternions-${eId}`);

    rpyContainer.style.display = useRPY ? "block" : "none";
    quaternionsContainer.style.display = useRPY ? "none" : "block";
    xyzContainer.style.display = useXYZ ? "block" : "none";
    coordinatesContainer.style.display = useXYZ ? "none" : "block";
  };

  const handleActiveChange = (e) => {
    const checked = e.target.checked;
    setDisabled(!checked);
  };

  return (
    <fieldset id={`entity-${eId}`}>
      <Row>
        <Col className="text-start">
          <legend>• Entity 🛩️</legend>
        </Col>
        <Col className="text-end">
          <Button variant="close" onClick={() => removeEntity(eId)}></Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <InputGroup>
            <InputGroup.Text>Name</InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Name"
              id={`name-${eId}`}
              defaultValue={name}
              disabled={disabled}
            />
          </InputGroup>
        </Col>
        <Col>
          <InputGroup>
            <InputGroup.Text>Color</InputGroup.Text>
            <Form.Control
              type="color"
              placeholder="Color"
              id={`color-${eId}`}
              defaultValue={color}
              disabled={disabled}
            />
          </InputGroup>
        </Col>
        <Col>
          <InputGroup>
            <InputGroup.Text>Opacity</InputGroup.Text>
            <Form.Control
              type="number"
              placeholder="Alpha"
              min={0}
              max={1}
              step={0.1}
              id={`alpha-${eId}`}
              defaultValue={alpha}
              disabled={disabled}
            />
          </InputGroup>
        </Col>
        <Col>
          <InputGroup>
            <InputGroup.Text>Scale</InputGroup.Text>
            <Form.Control
              type="number"
              placeholder="Scale"
              min={0.1}
              step={0.1}
              id={`scale-${eId}`}
              defaultValue={scale}
              disabled={disabled}
            />
          </InputGroup>
        </Col>
      </Row>

      <Row>
        <Col>
          <InputGroup>
            <InputGroup.Text>Path Color</InputGroup.Text>
            <Form.Control
              type="color"
              placeholder="Path Color"
              id={`pathColor-${eId}`}
              defaultValue={pathColor}
              disabled={disabled}
            />
          </InputGroup>
        </Col>

        <Col>
          <Form.Check
            type="checkbox"
            label="Wireframe"
            id={`wireframe-${eId}`}
            defaultChecked={wireframe}
            disabled={disabled}
          />
        </Col>

        <Col>
          <Form.Check
            type="radio"
            label="Tracked"
            id={`tracked-${eId}`}
            name="tracked"
            defaultChecked={tracked}
            disabled={disabled}
          />
        </Col>

        <Col>
          <Form.Check
            type="switch"
            label="Active"
            id={`active-${eId}`}
            defaultChecked={active}
            onChange={handleActiveChange}
          />
        </Col>
      </Row>
      <div className="break" />

      <legend>• Position</legend>
      <Select
        options={tables}
        id={`positionTable-${eId}`}
        placeholder="Position table"
        onChange={handlePositionTableSelect}
        defaultValue={{ label: position["table"] }}
        isDisabled={disabled}
      />
      <Form.Check
        id={`useXYZ-${eId}`}
        type="switch"
        label="use X/Y/Z"
        defaultChecked={useXYZ}
        onChange={handlePositionTypeChanged}
        disabled={disabled}
      />
      <Form.Group id={`XYZ-${eId}`}>
        <Row>
          <Col>
            <Select
              options={positionOptions}
              placeholder="X"
              id={`x-${eId}`}
              defaultValue={{ label: position["x"] ?? "Select X" }}
              isDisabled={disabled}
            />
          </Col>
          <Col>
            <Select
              options={positionOptions}
              placeholder="Y"
              id={`y-${eId}`}
              defaultValue={{ label: position["y"] ?? "Select Y" }}
              isDisabled={disabled}
            />
          </Col>
          <Col>
            <Select
              options={positionOptions}
              placeholder="Z"
              id={`z-${eId}`}
              defaultValue={{ label: position["z"] ?? "Select Z" }}
              isDisabled={disabled}
            />
          </Col>
        </Row>
      </Form.Group>

      <Form.Group id={`Coordinates-${eId}`}>
        <Row>
          <Col>
            <Select
              options={positionOptions}
              placeholder="Longitude"
              id={`lon-${eId}`}
              defaultValue={{
                label: position["longitude"] ?? "Select Longitude",
              }}
              isDisabled={disabled}
            />
          </Col>
          <Col>
            <Select
              options={positionOptions}
              placeholder="Latitude"
              id={`lat-${eId}`}
              defaultValue={{
                label: position["lattitude"] ?? "Select Latitude",
              }}
              isDisabled={disabled}
            />
          </Col>
          <Col>
            <Select
              options={positionOptions}
              placeholder="Altitude"
              id={`alt-${eId}`}
              defaultValue={{
                label: position["altitude"] ?? "Select Altitude",
              }}
              isDisabled={disabled}
            />
          </Col>
        </Row>
      </Form.Group>
      <div className="break" />

      <legend>• Attitude</legend>
      <Select
        options={tables}
        id={`attitudeTable-${eId}`}
        placeholder="Position table"
        onChange={handleAttitudeTableSelect}
        defaultValue={{ label: attitude["table"] }}
        isDisabled={disabled}
      />

      <Form.Check
        type="switch"
        id={`useRPY-${eId}`}
        label="use roll/pitch/yaw"
        defaultChecked={useRPY}
        onChange={handleAttitudeTypeChanged}
        disabled={disabled}
      />
      <Form.Group id={`RPY-${eId}`}>
        <Row>
          <Col>
            <Select
              options={attitudeOptions}
              placeholder="Roll"
              id={`roll-${eId}`}
              defaultValue={{ label: attitude["roll"] ?? "Select Roll" }}
              isDisabled={disabled}
            />
          </Col>
          <Col>
            <Select
              options={attitudeOptions}
              placeholder="Pitch"
              id={`pitch-${eId}`}
              defaultValue={{ label: attitude["pitch"] ?? "Select Pitch" }}
              isDisabled={disabled}
            />
          </Col>
          <Col>
            <Select
              options={attitudeOptions}
              placeholder="Yaw"
              id={`yaw-${eId}`}
              defaultValue={{ label: attitude["yaw"] ?? "Select Yaw" }}
              isDisabled={disabled}
            />
          </Col>
        </Row>
      </Form.Group>
      <Form.Group id={`Quaternions-${eId}`}>
        <Row>
          <Col>
            <Select
              options={attitudeOptions}
              placeholder="Qx"
              id={`qx-${eId}`}
              defaultValue={{ label: attitude["q1"] ?? "Select Qx" }}
              isDisabled={disabled}
            />
          </Col>
          <Col>
            <Select
              options={attitudeOptions}
              placeholder="Qy"
              id={`qy-${eId}`}
              defaultValue={{ label: attitude["q2"] ?? "Select Qy" }}
              isDisabled={disabled}
            />
          </Col>
          <Col>
            <Select
              options={attitudeOptions}
              placeholder="Qz"
              id={`qz-${eId}`}
              defaultValue={{ label: attitude["q3"] ?? "Select Qz" }}
              isDisabled={disabled}
            />
          </Col>
          <Col>
            <Select
              options={attitudeOptions}
              placeholder="Qw"
              id={`qw-${eId}`}
              defaultValue={{ label: attitude["q0"] ?? "Select Qw" }}
              isDisabled={disabled}
            />
          </Col>
        </Row>
      </Form.Group>
    </fieldset>
  );
}
export default EntityConfig;
