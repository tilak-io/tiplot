import TopBar from "./TopBar";
import EntityConfig from "./EntityConfig";

import { Container, Form, Button, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";
import "../css/settings.css";

function Settings() {
  const [raw_entities, setRawEntities] = useState([]);
  const [mapped_entities, setMappedEntities] = useState([]);

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
        setRawEntities(res);
        mapEntities(res);
      });
  };

  const mapEntities = (entities) => {
    const en = [];
    entities.forEach((e, i) =>
      en.push(
        <EntityConfig
          index={i}
          key={i}
          name={e.name}
          pathColor="red"
          alpha={e.alpha}
          useRPY={e.useRPY}
          useXYZ={e.useXYZ}
          position={e.position}
          attitude={e.attitude}
        />
      )
    );
    setMappedEntities(en);
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
          {mapped_entities}

          <Row>
            <Col className="text-center">
              <Button variant="danger" type="submit">
                Revert Default
              </Button>
              <Button
                variant="primary"
                // onSubmit={getEntityConfig}
                type="submit"
              >
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
