import { Container, Form, Button, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";

function EntityConfig({
  removeEntity,
  eId,
  name,
  pathColor,
  alpha,
  useXYZ,
  useRPY,
  position,
  attitude,
}) {
  const [_useXYZ, setXYZ] = useState(useXYZ);
  const [_useRPY, setRPY] = useState(useRPY);

  useEffect(() => {
    hideUnusedFields();
  }, []);

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
      <Form.Control
        type="text"
        placeholder="Name"
        id={`name-${eId}`}
        defaultValue={name}
      />
      <Form.Control
        type="text"
        placeholder="Path Color"
        id="pathColor"
        defaultValue={pathColor}
      />
      <Form.Control
        type="number"
        placeholder="Alpha"
        min={0}
        max={1}
        step={0.1}
        id={`alpha-${eId}`}
        defaultValue={alpha}
      />
      <div className="break" />

      <legend>• Position</legend>
      <Form.Control
        type="text"
        placeholder="Table"
        id={`positionTable-${eId}`}
        defaultValue={position["table"] ?? ""}
        required
      />
      <Form.Check
        id={`useXYZ-${eId}`}
        type="switch"
        label="use X/Y/Z"
        defaultChecked={useXYZ}
        onChange={handlePositionTypeChanged}
      />
      <Form.Group id={`XYZ-${eId}`}>
        <Form.Control
          type="text"
          placeholder="X"
          id={`x-${eId}`}
          required={_useXYZ}
          defaultValue={position["x"]}
        />
        <Form.Control
          type="text"
          placeholder="Y"
          id={`y-${eId}`}
          required={_useXYZ}
          defaultValue={position["y"]}
        />
        <Form.Control
          type="text"
          placeholder="Z"
          id={`z-${eId}`}
          required={_useXYZ}
          defaultValue={position["z"]}
        />
      </Form.Group>

      <Form.Group id={`Coordinates-${eId}`}>
        <Form.Control
          type="text"
          placeholder="Longitude"
          id={`lon-${eId}`}
          required={!_useXYZ}
          defaultValue={position["longitude"]}
        />
        <Form.Control
          type="text"
          placeholder="Latitude"
          id={`lat-${eId}`}
          required={!_useXYZ}
          defaultValue={position["lattitude"]}
        />
        <Form.Control
          type="text"
          placeholder="Altitude"
          id={`alt-${eId}`}
          required={!_useXYZ}
          defaultValue={position["altitude"]}
        />
      </Form.Group>
      <div className="break" />

      <legend>• Attitude</legend>
      <Form.Control
        type="text"
        placeholder="Table"
        id={`attitudeTable-${eId}`}
        required
        defaultValue={attitude["table"] ?? ""}
      />
      <Form.Check
        type="switch"
        id={`useRPY-${eId}`}
        label="use roll/pitch/yaw"
        defaultChecked={useRPY}
        onChange={handleAttitudeTypeChanged}
      />
      <Form.Group id={`RPY-${eId}`}>
        <Form.Control
          type="text"
          placeholder="Roll"
          id={`roll-${eId}`}
          required={_useRPY}
          defaultValue={attitude["roll"]}
        />
        <Form.Control
          type="text"
          placeholder="Pitch"
          id={`pitch-${eId}`}
          required={_useRPY}
          defaultValue={attitude["pitch"]}
        />
        <Form.Control
          type="text"
          placeholder="Yaw"
          id={`yaw-${eId}`}
          required={_useRPY}
          defaultValue={attitude["yaw"]}
        />
      </Form.Group>
      <Form.Group id={`Quaternions-${eId}`}>
        <Form.Control
          type="text"
          placeholder="Qx"
          id={`qx-${eId}`}
          required={!_useRPY}
          defaultValue={attitude["q1"]}
        />
        <Form.Control
          type="text"
          placeholder="Qy"
          id={`qy-${eId}`}
          required={!_useRPY}
          defaultValue={attitude["q2"]}
        />
        <Form.Control
          type="text"
          placeholder="Qz"
          id={`qz-${eId}`}
          required={!_useRPY}
          defaultValue={attitude["q3"]}
        />
        <Form.Control
          type="text"
          placeholder="Qw"
          id={`qw-${eId}`}
          required={!_useRPY}
          defaultValue={attitude["q0"]}
        />
      </Form.Group>
    </fieldset>
  );
}
export default EntityConfig;
