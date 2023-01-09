import { useState, useEffect } from "react";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Modal,
  Button,
  Tab,
  Tabs,
  Table,
} from "react-bootstrap";
import { DropdownSubmenu, NavDropdownMenu } from "react-bootstrap-submenu";
import { FaToggleOn, FaToggleOff, FaInfoCircle } from "react-icons/fa";
import { FcRadarPlot, FcScatterPlot, FcHeatMap } from "react-icons/fc";
import "react-bootstrap-submenu/dist/index.css";
import logo from "../static/img/logo.png";
import { generateUUID } from "three/src/math/MathUtils";
import { PORT } from "../static/js/constants";

function ToolBar({
  page,
  toggle3dView,
  showView,
  addYT,
  addXY,
  addHM,
  showControls,
}) {
  const [layouts, setLayouts] = useState([]);
  const [showSaveMsg, setShowSaveMsg] = useState(false);
  const [currentFile, setCurrentFile] = useState("");
  const [showInfoBox, setShowInfo] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState([]);

  const handleClose = () => setShowSaveMsg(false);
  const saveCurrentLayoutNamed = () => setShowSaveMsg(true);

  useEffect(() => {
    getCurrentFile();
    getAdditionalInfo();
    mapLayouts();
    // eslint-disable-next-line
  }, []);

  const getAdditionalInfo = async () => {
    var response = await fetch(`http://localhost:${PORT}/additional_info`).then(
      (res) => res.json()
    );
    setAdditionalInfo(response);
  };

  const getCurrentFile = async () => {
    var response = await fetch(`http://localhost:${PORT}/current_file`).then(
      (res) => res.json()
    );
    if (response.msg) setCurrentFile(response.msg);
    else setCurrentFile("Current File: " + response.file[0]);
  };

  const parseLocalStorage = (key) => {
    var value = localStorage.getItem(key);
    if (value === "" || value === null)
      value = {}; // {} instead of [] so we can use associative arrays
    else value = JSON.parse(value);
    return value;
  };

  const onSave = () => {
    var name = document.getElementById("layout-name").value;
    var savedLayouts = parseLocalStorage("saved_layouts");
    var currentLayout = parseLocalStorage("current_layout");
    savedLayouts[name] = currentLayout;
    localStorage.setItem("saved_layouts", JSON.stringify(savedLayouts));
    mapLayouts();
    setShowSaveMsg(false);
  };

  const mapLayouts = () => {
    const savedLayouts = parseLocalStorage("saved_layouts");
    var rows = [];
    Object.keys(savedLayouts).forEach((layout_name, i) => {
      rows.push(
        <NavDropdown.Item key={i} onClick={() => selectLayout(layout_name)}>
          {layout_name}
        </NavDropdown.Item>
      );
    });
    if (rows.length == 0) {
      rows.push(
        <NavDropdown.Item key={generateUUID()} disabled>
          No Saved Layouts
        </NavDropdown.Item>
      );
    }

    setLayouts(rows);
  };

  const selectLayout = (name) => {
    var savedLayouts = parseLocalStorage("saved_layouts");
    var selectedLayout = savedLayouts[name];
    localStorage.setItem("current_layout", JSON.stringify(selectedLayout));
    window.location.reload();
  };

  const exportLayout = () => {
    var currentLayout = parseLocalStorage("current_layout");
    var dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(currentLayout));
    var a = document.getElementById("export-layout");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "layout.json");
    a.click();
  };

  const importLayout = () => {
    const fr = new FileReader();
    var input = document.getElementById("import-layout");

    fr.onload = (event) => {
      const layout = event.target.result;
      localStorage.setItem("current_layout", layout);
      window.location.reload();
    };

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file.type !== "application/json") {
        alert("Please import a JSON file");
        return;
      }
      fr.readAsText(file);
    };

    input.click();
  };

  const clearLayouts = () => {
    localStorage.setItem("saved_layouts", "{}");
    localStorage.setItem("current_layout", "[]");
    window.location.reload();
  };

  const handle3DViewClicked = () => {
    toggle3dView();
    localStorage.setItem("show_view", JSON.stringify(!showView));
  };

  function ViewButton() {
    if (showView)
      return (
        <span title="Show 3d View">
          <FaToggleOn style={{ color: "#00ffff" }} />
        </span>
      );
    else
      return (
        <span title="Hide 3d View">
          <FaToggleOff style={{ color: "#DDDDDD" }} />
        </span>
      );
  }

  function Controls() {
    if (!showControls) return;
    return (
      <Nav>
        <Nav.Link onClick={addHM}>
          <FcHeatMap />
        </Nav.Link>
        <Nav.Link onClick={addYT}>
          <FcScatterPlot />
        </Nav.Link>
        <Nav.Link onClick={addXY}>
          <FcRadarPlot />
        </Nav.Link>
        <Nav.Link onClick={handle3DViewClicked}>
          <ViewButton />
        </Nav.Link>
      </Nav>
    );
  }

  const InfoTable = ({ data }) => {
    const headers = Object.keys(data.info[0]);
    return (
      <Table striped bordered hover>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.info.map((item) => (
            <tr key={generateUUID()}>
              {headers.map((header) => (
                <td key={`${generateUUID()}-${header}`}>{item[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <>
      {/* Pop up for setting layout name */}
      <Modal show={showSaveMsg} onHide={handleClose} animation={false} centered>
        <Modal.Header closeButton>
          <Modal.Title>Save Layout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label htmlFor="layout-name" className="col-form-label">
              Name:
            </label>
            <input type="text" className="form-control" id="layout-name" />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={onSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Pop up for info box*/}
      <Modal
        show={showInfoBox}
        onHide={() => setShowInfo(false)}
        animation={false}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Additional Info</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="current_file">
            <Tab eventKey="current_file" title="Current File">
              <br className="break" />
              <Container>{currentFile}</Container>
            </Tab>
            {additionalInfo.map((info) => (
              <Tab key={generateUUID()} eventKey={info.name} title={info.name}>
                <br className="break" />
                <Container>
                  <InfoTable data={info} />
                </Container>
              </Tab>
            ))}
          </Tabs>
        </Modal.Body>
      </Modal>

      {/* Actual Navbar */}
      <Navbar variant="dark" fixed="top" className="nav-color">
        <a id="export-layout" style={{ display: "none" }} href="#export-layout">
          export layout
        </a>
        <input id="import-layout" type="file" style={{ display: "none" }} />
        <Container>
          <Navbar.Brand target="_blank" href="https://tilak.io">
            <img
              src={logo}
              width="30"
              height="30"
              className="d-inline-block align-top"
              alt="TiPlot"
            />
            TiPlot
          </Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="#/" className={page === "loader" ? "active" : ""}>
              Loader
            </Nav.Link>
            <Nav.Link href="#/home" className={page === "home" ? "active" : ""}>
              Home
            </Nav.Link>
            <NavDropdownMenu title="Tools" id="collasible-nav-dropdown">
              <NavDropdown.Item href="#/entities">Entities</NavDropdown.Item>
              <NavDropdown.Item href="#/settings">Settings</NavDropdown.Item>
              <DropdownSubmenu href="#" title="Layouts">
                <DropdownSubmenu href="#" title="Saved Layouts">
                  {layouts}
                </DropdownSubmenu>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={saveCurrentLayoutNamed}>
                  Save current
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={importLayout}>
                  Import layout
                </NavDropdown.Item>
                <NavDropdown.Item onClick={exportLayout}>
                  Export layout
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={clearLayouts}>
                  Clear layouts
                </NavDropdown.Item>
              </DropdownSubmenu>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={() => setShowInfo(true)}>
                Info <FaInfoCircle />
              </NavDropdown.Item>
            </NavDropdownMenu>
          </Nav>
          <Controls />
        </Container>
      </Navbar>
    </>
  );
}
export default ToolBar;
