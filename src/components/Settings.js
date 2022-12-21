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

  const getEntityConfig = (eId) => {
    const _useXYZ = document.getElementById(`useXYZ-${eId}`).checked;
    const _useRPY = document.getElementById(`useRPY-${eId}`).checked;
    const wireframe = document.getElementById(`wireframe-${eId}`).checked;
    const tracked = document.getElementById(`tracked-${eId}`).checked;

    const position = _useXYZ
      ? {
        table: getValue(`positionTable-${eId}`),
        x: getValue(`x-${eId}`),
        y: getValue(`y-${eId}`),
        z: getValue(`z-${eId}`),
      }
      : {
        table: getValue(`positionTable-${eId}`),
        longitude: getValue(`lon-${eId}`),
        lattitude: getValue(`lat-${eId}`),
        altitude: getValue(`alt-${eId}`),
      };
    const attitude = _useRPY
      ? {
        table: getValue(`attitudeTable-${eId}`),
        roll: getValue(`roll-${eId}`),
        pitch: getValue(`pitch-${eId}`),
        yaw: getValue(`yaw-${eId}`),
      }
      : {
        table: getValue(`attitudeTable-${eId}`),
        q0: getValue(`qw-${eId}`),
        q1: getValue(`qx-${eId}`),
        q2: getValue(`qy-${eId}`),
        q3: getValue(`qz-${eId}`),
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
    if (value === "" || value === null)
      value = {
        backgroundColor: "#3b3b3b",
        originHelper: false,
        xGrid: false,
        yGrid: false,
        zGrid: false,
        maxDistance: 1500,
        dampingFactor: .8,
        fov: 75,
      };
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
        if (res.ok) navigate("/home");
      });
  };

  const getCurrentSettings = () => {
    const xGrid = document.getElementById("xGrid");
    const yGrid = document.getElementById("yGrid");
    const zGrid = document.getElementById("zGrid");
    const originHelper = document.getElementById("originHelper");
    const backgroundColor = document.getElementById("backgroundColor");
    const maxDistance = document.getElementById("maxDistance");
    const dampingFactor = document.getElementById("dampingFactor");
    const fov = document.getElementById("fov");
    const general_settings = parseLocalStorage("general_settings");
    xGrid.checked = general_settings.xGrid;
    yGrid.checked = general_settings.yGrid;
    zGrid.checked = general_settings.zGrid;
    originHelper.checked = general_settings.originHelper;
    backgroundColor.value = general_settings.backgroundColor;
    maxDistance.value = general_settings.maxDistance;
    dampingFactor.value = general_settings.dampingFactor;
    fov.value = general_settings.fov;
  };

  const toggleGrid = (e) => {
    const target = e.target;
    const general_settings = parseLocalStorage("general_settings");
    general_settings[target.id] = target.checked;
    localStorage.setItem("general_settings", JSON.stringify(general_settings));
  };

  const handleBackgroundChange = (e) => {
    const general_settings = parseLocalStorage("general_settings");
    general_settings.backgroundColor = e.target.value;
    localStorage.setItem("general_settings", JSON.stringify(general_settings));
  };

  const handleChange = (e) => {
    const general_settings = parseLocalStorage("general_settings");
    general_settings[e.target.id] = parseFloat(e.target.value);
    localStorage.setItem("general_settings", JSON.stringify(general_settings));
  }

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
              onChange={toggleGrid}
            />
            <Form.Check
              id="xGrid"
              type="checkbox"
              label="X Axis Grid"
              onChange={toggleGrid}
            />
            <Form.Check
              id="yGrid"
              type="checkbox"
              label="Y Axis Grid"
              onChange={toggleGrid}
            />
            <Form.Check
              id="zGrid"
              type="checkbox"
              label="Z Axis Grid"
              onChange={toggleGrid}
            />
            <br />
            <InputGroup>
              <InputGroup.Text id="backgroundColorLabel">
                Background Color
              </InputGroup.Text>
              <Form.Control
                onChange={handleBackgroundChange}
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
                  <InputGroup.Text>
                    Max Distance
                  </InputGroup.Text>
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
                  <InputGroup.Text>
                    Damping Factor
                  </InputGroup.Text>
                  <Form.Control
                    onChange={handleChange}
                    id="dampingFactor"
                    type="number"
                    max={1}
                    step={.01}
                    min={0.01}
                  />
                </InputGroup>
              </Col>
            </Row>
            <Row>
              <Col>
                <InputGroup>
                  <InputGroup.Text>
                    FOV
                  </InputGroup.Text>
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
