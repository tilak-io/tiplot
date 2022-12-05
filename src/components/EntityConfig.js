import { Container, Form, Button, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";

function EntityConfig({
  index,
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
    const xyzContainer = document.getElementById("XYZ");
    const coordinatesContainer = document.getElementById("Coordinates");
    xyzContainer.style.display = _useXYZ ? "none" : "block";
    coordinatesContainer.style.display = _useXYZ ? "block" : "none";
    setXYZ(!_useXYZ);
  };

  const handleAttitudeTypeChanged = () => {
    const rpyContainer = document.getElementById("RPY");
    const quaternionsContainer = document.getElementById("Quaternions");
    rpyContainer.style.display = _useRPY ? "none" : "block";
    quaternionsContainer.style.display = _useRPY ? "block" : "none";
    setRPY(!_useRPY);
  };

  const hideUnusedFields = () => {
    const xyzContainer = document.getElementById("XYZ");
    const coordinatesContainer = document.getElementById("Coordinates");
    const rpyContainer = document.getElementById("RPY");
    const quaternionsContainer = document.getElementById("Quaternions");

    rpyContainer.style.display = useRPY ? "block" : "none";
    quaternionsContainer.style.display = useRPY ? "none" : "block";
    xyzContainer.style.display = useXYZ ? "block" : "none";
    coordinatesContainer.style.display = useXYZ ? "none" : "block";
  };

  const getValue = (id) => {
    return document.getElementById(id).value;
  };

  const getEntityConfig = () => {
    const position = _useXYZ
      ? {
          table: getValue("positionTable"),
          x: getValue("x"),
          y: getValue("y"),
          z: getValue("z"),
        }
      : {
          table: getValue("positionTable"),
          longitude: getValue("lon"),
          lattitude: getValue("lat"),
          altitude: getValue("alt"),
        };
    const attitude = _useRPY
      ? {
          table: getValue("attitudeTable"),
          roll: getValue("roll"),
          pitch: getValue("pitch"),
          yaw: getValue("yaw"),
        }
      : {
          table: getValue("attitudeTable"),
          q0: getValue("qw"),
          q1: getValue("qx"),
          q2: getValue("qy"),
          q3: getValue("qz"),
        };
    const config = {
      name: getValue("name"),
      alpha: getValue("alpha"),
      useRPY: _useRPY,
      useXYZ: _useXYZ,
      position: position,
      attitude: attitude,
    };
    console.log(config);
  };
  return (
    <fieldset id="">
      <Row>
        <Col className="text-start">
          <legend>• Entity 🛩️</legend>
        </Col>
        <Col className="text-end">
          <Button variant="close"></Button>
        </Col>
      </Row>
      <Form.Control
        type="text"
        placeholder="Name"
        id="name"
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
        id="alpha"
        defaultValue={alpha}
      />
      <div className="break" />

      <legend>• Position</legend>
      <Form.Control
        type="text"
        placeholder="Table"
        id="positionTable"
        defaultValue={position["table"]}
        required
      />
      <Form.Check
        type="switch"
        label="use X/Y/Z"
        defaultChecked={useXYZ}
        onChange={handlePositionTypeChanged}
      />
      <Form.Group id="XYZ">
        <Form.Control
          type="text"
          placeholder="X"
          id="x"
          required={_useXYZ}
          defaultValue={position["x"]}
        />
        <Form.Control
          type="text"
          placeholder="Y"
          id="y"
          required={_useXYZ}
          defaultValue={position["y"]}
        />
        <Form.Control
          type="text"
          placeholder="Z"
          id="z"
          required={_useXYZ}
          defaultValue={position["z"]}
        />
      </Form.Group>

      <Form.Group id="Coordinates">
        <Form.Control
          type="text"
          placeholder="Longitude"
          id="lon"
          required={!_useXYZ}
          defaultValue={position["longitude"]}
        />
        <Form.Control
          type="text"
          placeholder="Latitude"
          id="lat"
          required={!_useXYZ}
          defaultValue={position["lattitude"]}
        />
        <Form.Control
          type="text"
          placeholder="Altitude"
          id="alt"
          required={!_useXYZ}
          defaultValue={position["altitude"]}
        />
      </Form.Group>
      <div className="break" />

      <legend>• Attitude</legend>
      <Form.Control
        type="text"
        placeholder="Table"
        id="attitudeTable"
        required
        defaultValue={attitude["table"]}
      />
      <Form.Check
        type="switch"
        label="use roll/pitch/yaw"
        defaultChecked={useRPY}
        onChange={handleAttitudeTypeChanged}
      />
      <Form.Group id="RPY">
        <Form.Control
          type="text"
          placeholder="Roll"
          id="roll"
          required={_useRPY}
          defaultValue={attitude["roll"]}
        />
        <Form.Control
          type="text"
          placeholder="Pitch"
          id="pitch"
          required={_useRPY}
          defaultValue={attitude["pitch"]}
        />
        <Form.Control
          type="text"
          placeholder="Yaw"
          id="yaw"
          required={_useRPY}
          defaultValue={attitude["yaw"]}
        />
      </Form.Group>
      <Form.Group id="Quaternions">
        <Form.Control
          type="text"
          placeholder="Qx"
          id="qx"
          required={!_useRPY}
          defaultValue={attitude["q1"]}
        />
        <Form.Control
          type="text"
          placeholder="Qy"
          id="qy"
          required={!_useRPY}
          defaultValue={attitude["q2"]}
        />
        <Form.Control
          type="text"
          placeholder="Qz"
          id="qz"
          required={!_useRPY}
          defaultValue={attitude["q3"]}
        />
        <Form.Control
          type="text"
          placeholder="Qw"
          id="qw"
          required={!_useRPY}
          defaultValue={attitude["q0"]}
        />
      </Form.Group>
    </fieldset>
  );
}
export default EntityConfig;
