import ToolBar from "./ToolBar";
import EntityConfig from "./EntityConfig";
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { useState, useEffect } from "react";
import "../static/css/settings.css";

export const defaultSettings = {
  backgroundColor: "#3b3b3b",
  originHelper: false,
  xGrid: false,
  yGrid: false,
  zGrid: false,
  maxDistance: 1500,
  dampingFactor: 0.8,
  fov: 75,
};

function Settings() {
  const [current_entities, setCurrentEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentSettings();
    getCurrentEntities();
    return () => {
      // window.location.reload();
    };
  }, []);

  const getCurrentEntities = () => {
    fetch("http://localhost:5000/entities_config")
      .then((res) => res.json())
      .then((res) => {
        setCurrentEntities(res);
        setLoading(false);
      });
  };

  const addEntity = () => {
    fetch("http://localhost:5000/default_entity")
      .then((res) => res.json())
      .then((res) => {
        // res.id = parseInt(Math.random() * 10000);
        res.id = uuid();
        setCurrentEntities([...current_entities, res]);
      });
  };

  const removeEntity = (id) => {
    const remaining = current_entities.filter((e) => e.id != id);
    setCurrentEntities(remaining);
  };

  const getValue = (id) => {
    return document.getElementById(id).value;
  };

  const getDropdownValue = (id) => {
    return document.getElementById(id).textContent;
  };

  const getEntityConfig = (eId) => {
    const _useXYZ = document.getElementById(`useXYZ-${eId}`).checked;
    const _useRPY = document.getElementById(`useRPY-${eId}`).checked;
    const wireframe = document.getElementById(`wireframe-${eId}`).checked;
    const tracked = document.getElementById(`tracked-${eId}`).checked;

    const position = _useXYZ
      ? {
          table: getDropdownValue(`positionTable-${eId}`),
          x: getDropdownValue(`x-${eId}`),
          y: getDropdownValue(`y-${eId}`),
          z: getDropdownValue(`z-${eId}`),
        }
      : {
          table: getDropdownValue(`positionTable-${eId}`),
          longitude: getDropdownValue(`lon-${eId}`),
          lattitude: getDropdownValue(`lat-${eId}`),
          altitude: getDropdownValue(`alt-${eId}`),
        };
    const attitude = _useRPY
      ? {
          table: getDropdownValue(`attitudeTable-${eId}`),
          roll: getDropdownValue(`roll-${eId}`),
          pitch: getDropdownValue(`pitch-${eId}`),
          yaw: getDropdownValue(`yaw-${eId}`),
        }
      : {
          table: getDropdownValue(`attitudeTable-${eId}`),
          q0: getDropdownValue(`qw-${eId}`),
          q1: getDropdownValue(`qx-${eId}`),
          q2: getDropdownValue(`qy-${eId}`),
          q3: getDropdownValue(`qz-${eId}`),
        };

    const config = {
      name: getValue(`name-${eId}`),
      alpha: parseFloat(getValue(`alpha-${eId}`)),
      useRPY: _useRPY,
      useXYZ: _useXYZ,
      pathColor: getValue(`pathColor-${eId}`),
      wireframe: wireframe,
      color: getValue(`color-${eId}`),
      tracked: tracked,
      scale: parseFloat(getValue(`scale-${eId}`)),
      position: position,
      attitude: attitude,
    };
    return config;
  };

  const parseLocalStorage = (key) => {
    var value = localStorage.getItem(key);
    if (value === "" || value === null) value = defaultSettings;
    else value = JSON.parse(value);
    return value;
  };

  const applyConfig = () => {
    // Entity Configs
    const configs = [];
    current_entities.forEach((e) => {
      const c = getEntityConfig(e.id);
      configs.push(c);
    });
    fetch("http://localhost:5000/write_config", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(configs),
    })
      .then((res) => res.json())
      .then((res) => {
        navigate("/home");
      });
  };

  const getCurrentSettings = () => {
    const general_settings = parseLocalStorage("general_settings");
    const keys = Object.keys(defaultSettings);
    keys.forEach((key) => {
      const input = document.getElementById(key);
      if (input.type == "checkbox")
        input.checked = general_settings[key] ?? defaultSettings[key];
      else input.value = general_settings[key] ?? defaultSettings[key];
    });
  };

  const handleChange = (e) => {
    const general_settings = parseLocalStorage("general_settings");
    if (e.target.type == "checkbox")
      general_settings[e.target.id] = e.target.checked;
    else general_settings[e.target.id] = e.target.value;
    localStorage.setItem("general_settings", JSON.stringify(general_settings));
  };

  const showSettings = loading ? "hide" : "show";
  const showLoading = loading ? "show" : "hide";

  return (
    <>
      <ToolBar page="settings" />
      <Container className={"loading " + showLoading}>
        <Spinner variant="primary" />
      </Container>
      <Container className={"settings-page " + showSettings}>
        <Form>
          <fieldset>
            <legend>• View Helpers 🌎</legend>
            <Form.Check
              id="originHelper"
              type="checkbox"
              label="Origin Helper"
              onChange={handleChange}
            />
            <Form.Check
              id="xGrid"
              type="checkbox"
              label="X Axis Grid"
              onChange={handleChange}
            />
            <Form.Check
              id="yGrid"
              type="checkbox"
              label="Y Axis Grid"
              onChange={handleChange}
            />
            <Form.Check
              id="zGrid"
              type="checkbox"
              label="Z Axis Grid"
              onChange={handleChange}
            />
            <br />
            <InputGroup>
              <InputGroup.Text id="backgroundColorLabel">
                Background Color
              </InputGroup.Text>
              <Form.Control
                onChange={handleChange}
                id="backgroundColor"
                type="color"
                aria-label="Background Color"
                aria-describedby="backgroundColorLabel"
              />
            </InputGroup>
          </fieldset>
          <fieldset>
            <legend>• Camera 📸</legend>
            <Row>
              <Col>
                <InputGroup>
                  <InputGroup.Text>Max Distance</InputGroup.Text>
                  <Form.Control
                    onChange={handleChange}
                    id="maxDistance"
                    type="number"
                    min={1}
                    aria-label="MaxDistance"
                  />
                </InputGroup>
              </Col>
              <Col>
                <InputGroup>
                  <InputGroup.Text>Damping Factor</InputGroup.Text>
                  <Form.Control
                    onChange={handleChange}
                    id="dampingFactor"
                    type="number"
                    max={1}
                    step={0.01}
                    min={0.01}
                  />
                </InputGroup>
              </Col>
            </Row>
            <Row>
              <Col>
                <InputGroup>
                  <InputGroup.Text>FOV</InputGroup.Text>
                  <Form.Control
                    onChange={handleChange}
                    id="fov"
                    type="number"
                  />
                </InputGroup>
              </Col>
            </Row>
          </fieldset>
          {current_entities.map((e) => (
            <EntityConfig
              key={e.id}
              eId={e.id}
              name={e.name}
              pathColor={e.pathColor}
              color={e.color}
              wireframe={e.wireframe}
              alpha={e.alpha}
              useRPY={e.useRPY}
              useXYZ={e.useXYZ}
              tracked={e.tracked}
              scale={e.scale}
              position={e.position}
              attitude={e.attitude}
              removeEntity={removeEntity}
            />
          ))}

          <Row>
            <Col className="text-start"></Col>

            <Col className="text-center">
              <Button variant="success" onClick={addEntity}>
                Add Entity
              </Button>
            </Col>

            <Col className="text-end">
              <Button variant="primary" onClick={applyConfig} type="submit">
                Apply
              </Button>
            </Col>
          </Row>
        </Form>
      </Container>
    </>
  );
}

export default Settings;
