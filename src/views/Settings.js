import ToolBar from "../components/ToolBar";
import { Container, Form, Row, Col, InputGroup } from "react-bootstrap";
import { useEffect } from "react";
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
  textYValue: 0,
  externalEditor: "/usr/bin/code"
};

function Settings() {
  useEffect(() => {
    getCurrentSettings();
    getCurrentLayout();
    getCurrentTrackedEntityType();
    // eslint-disable-next-line
  }, []);

  const parseLocalStorage = (key) => {
    var value = localStorage.getItem(key);
    if (value === "" || value === null) value = defaultSettings;
    else value = JSON.parse(value);
    return value;
  };

  const getCurrentSettings = () => {
    const general_settings = parseLocalStorage("general_settings");
    const keys = Object.keys(defaultSettings);
    keys.forEach((key) => {
      const input = document.getElementById(key);
      if (input.type === "checkbox")
        input.checked = general_settings[key] ?? defaultSettings[key];
      else input.value = general_settings[key] ?? defaultSettings[key];
    });
  };

  const handleChange = (e) => {
    const general_settings = parseLocalStorage("general_settings");
    if (e.target.type === "checkbox")
      general_settings[e.target.id] = e.target.checked;
    else if (e.target.type === "number")
      general_settings[e.target.id] = parseFloat(e.target.value) ?? 1;
    else general_settings[e.target.id] = e.target.value;
    localStorage.setItem("general_settings", JSON.stringify(general_settings));
  };

  const handleLayoutChange = (e) => {
    var view_layout = localStorage.getItem("view_layout", "split-fit");
    view_layout = e.target.id;
    localStorage.setItem("view_layout", JSON.stringify(view_layout));
  };

  const handleTrackedEntityChange = (e) => {
    var tracked_entity_type = localStorage.getItem("tracked_entity_type", "last-tracked");
    tracked_entity_type = e.target.id;
    localStorage.setItem("tracked_entity_type", JSON.stringify(tracked_entity_type));
  };

  const getCurrentLayout = () => {
    var view_layout = JSON.parse(localStorage.getItem("view_layout")) ?? "split-fit";
    const layouts = ["split-fit", "detached-fit"];

    layouts.forEach((layout) => {
      const input = document.getElementById(layout);
      input.checked = view_layout === input.id;
    });
  };

  const getCurrentTrackedEntityType = () => {
    var tracked_entity_type = JSON.parse(localStorage.getItem("tracked_entity_type")) ?? "last-tracked";
    const types = ["last-tracked", "last-created"];

    types.forEach((t) => {
      const input = document.getElementById(t);
      input.checked = tracked_entity_type === input.id;
    });
  };

  return (
    <>
      <ToolBar page="settings" />
      <Container className="settings-page">
        <Form>
          <fieldset>
            <legend>• General ⚙️</legend>
            <InputGroup>
              <InputGroup.Text>External Editor</InputGroup.Text>
              <Form.Control
                onChange={handleChange}
                id="externalEditor"
                type="text"
                min={1}
                aria-label="ExternalEditor"
              />
            </InputGroup>
          </fieldset>
          <fieldset>
            <legend>• View Layouts 🪟</legend>
            <Form.Check
              name="view-layout"
              id="split-fit"
              type="radio"
              label="Split Layout"
              onChange={handleLayoutChange}
            />
            <Form.Check
              name="view-layout"
              id="detached-fit"
              type="radio"
              label="Detached Layout"
              onChange={handleLayoutChange}
            />
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

          <fieldset>
            <legend>• Plots 📈</legend>
            <Row>
              <Col>
                <InputGroup>
                  <InputGroup.Text>Text Y Value</InputGroup.Text>
                  <Form.Control
                    onChange={handleChange}
                    id="textYValue"
                    type="number"
                    min={1}
                  />
                </InputGroup>
              </Col>
            </Row>
          </fieldset>
          <fieldset>
            <legend>• Entities 🛩️</legend>
            <Form.Check
              name="tracked-entity"
              id="last-created"
              type="radio"
              label="Last created"
              onChange={handleTrackedEntityChange}
            />
            <Form.Check
              name="tracked-entity"
              id="last-tracked"
              type="radio"
              label="Last tracked"
              onChange={handleTrackedEntityChange}
            />
          </fieldset>
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
        </Form>
      </Container>
    </>
  );
}

export default Settings;
