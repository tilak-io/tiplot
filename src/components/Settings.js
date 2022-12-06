import TopBar from "./TopBar";
import EntityConfig from "./EntityConfig";

import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";
import "../css/settings.css";

function Settings() {
  const [current_entities, setCurrentEntities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentEntities();
    return () => {
      window.location.reload();
    };
  }, []);

  const getCurrentEntities = () => {
    fetch("http://localhost:5000/entities_config")
      .then((res) => res.json())
      .then((res) => {
        setCurrentEntities(res);
      });
  };

  const removeEntity = (id) => {
    const remaining = current_entities.filter((e) => e.id != id);
    setCurrentEntities(remaining);
  };

  const addEntity = () => {
    const id = parseInt(Math.random() * 10000);
    const position = {
      table: "vehicle_local_position",
      x: "x",
      y: "y",
      z: "z",
    };

    const attitude = {
      table: "vehicle_attitude",
      q1: "q[1]",
      q2: "q[2]",
      q3: "q[3]",
      q0: "q[0]",
    };

    const entity = {
      id: id,
      name: `new entity ${id}`,
      color: "white",
      pathColor: "blue",
      wireframe: false,
      alpha: 1,
      useXYZ: true,
      useRPY: false,
      position: position,
      attitude: attitude,
    };
    setCurrentEntities([...current_entities, entity]);
  };

  const getValue = (id) => {
    return document.getElementById(id).value;
  };

  const getEntityConfig = (eId) => {
    const _useXYZ = document.getElementById(`useXYZ-${eId}`).checked;
    const _useRPY = document.getElementById(`useRPY-${eId}`).checked;
    const wireframe = document.getElementById(`wireframe-${eId}`).checked;

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
      alpha: getValue(`alpha-${eId}`),
      useRPY: _useRPY,
      useXYZ: _useXYZ,
      pathColor: getValue(`pathColor-${eId}`),
      wireframe: wireframe,
      color: getValue(`color-${eId}`),
      position: position,
      attitude: attitude,
    };
    return config;
  };

  const applyConfig = () => {
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
        else alert(res.error);
      });
  };

  return (
    <>
      <TopBar page="settings" />
      <Container className="settings-page">
        <Form>
          {/* <fieldset> */}
          {/*   <legend>• View Helpers 🌎</legend> */}
          {/*   <Form.Check type="checkbox" label="X Axis Grid" /> */}
          {/*   <Form.Check type="checkbox" label="Y Axis Grid" /> */}
          {/*   <Form.Check type="checkbox" label="Z Axis Grid" /> */}
          {/* </fieldset> */}
          {current_entities.map((e, i) => (
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
