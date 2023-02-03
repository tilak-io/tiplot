import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import ToolBar from "../components/ToolBar";
import EntityConfig from "../components/EntityConfig";
import { BsPlus } from "react-icons/bs";
import { Container, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import { PORT } from "../static/js/constants";

function Entities() {
  const [current_entities, setCurrentEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentEntities();
  }, []);

  const getCurrentEntities = () => {
    fetch(`http://localhost:${PORT}/entities_config`)
      .then((res) => res.json())
      .then((res) => {
        setCurrentEntities(res.config);
        setLoading(false);
        validateCurrentConfig(res.config);
      });
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

  const addEntity = () => {
    fetch(`http://localhost:${PORT}/default_entity`)
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

  const validateCurrentConfig = async (entities) => {
    const response = await fetch(`http://localhost:${PORT}/validate_config`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(entities),
    }).then((res) => res.json());

    if (!response.ok) {
      setErrorMsg(response.msg);
      setShowError(true);
      window.scrollTo(0, 0);
    }
  };

  const applyConfig = async () => {
    // Entity Configs
    const configs = [];
    current_entities.forEach((e) => {
      const c = getEntityConfig(e.id);
      configs.push(c);
    });

    const response = await fetch(`http://localhost:${PORT}/write_config`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(configs),
    }).then((res) => res.json());

    if (!response.ok) {
      setErrorMsg(response.msg);
      setShowError(true);
      window.scrollTo(0, 0);
    } else {
      setErrorMsg(response.msg);
      setShowError(false);
      navigate("/home");
    }
  };

  function AlertError() {
    if (showError) {
      return (
        <Alert variant="danger" onClose={() => setShowError(false)} dismissible>
          <Alert.Heading>Invalid Config!</Alert.Heading>
          <p>{errorMsg}</p>
        </Alert>
      );
    }
  }
  const showSettings = loading ? "hide" : "show";
  const showLoading = loading ? "show" : "hide";

  return (
    <>
      <ToolBar />
      <Container className={"loading " + showLoading}>
        <Spinner variant="primary" />
      </Container>

      <Container className={"settings-page " + showSettings}>
        <AlertError />
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
            <Button variant="primary" onClick={applyConfig} type="submit">
              Apply
            </Button>
          </Col>

          <Col className="text-end">
            <Button
              variant="secondary"
              style={{ backgroundColor: "transparent" }}
              onClick={addEntity}
            >
              <BsPlus style={{ color: "#000" }} />
            </Button>
          </Col>
        </Row>
      </Container>
    </>
  );
}
export default Entities;
