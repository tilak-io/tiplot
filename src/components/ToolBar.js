import { useState, useEffect } from "react";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Modal,
  Button,
} from "react-bootstrap";
import { FaToggleOn, FaToggleOff, FaInfoCircle } from "react-icons/fa";
import { FcRadarPlot, FcScatterPlot } from "react-icons/fc";
import logo from "../static/img/logo.png";

function ToolBar({ page, toggle3dView, showView, addYT, addXY, showControls }) {
  const [layouts, setLayouts] = useState([]);
  const [showSaveMsg, setShowSaveMsg] = useState(false);
  const [currentFile, setCurrentFile] = useState("");
  const [showInfoBox, setShowInfo] = useState(false);

  const handleClose = () => setShowSaveMsg(false);
  const saveCurrentLayoutNamed = () => setShowSaveMsg(true);

  useEffect(() => {
    getCurrentFile();
    mapLayouts();
    // eslint-disable-next-line
  }, []);

  const getCurrentFile = async () => {
    var response = await fetch("http://localhost:5000/current_file").then((res) => res.json());
    setCurrentFile(response.file[0]);
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

  function ShowFirstDivider() {
    if (layouts.length > 0) return <NavDropdown.Divider />;
  }

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
        <Nav.Link onClick={addYT}>
          <FcScatterPlot />
        </Nav.Link>
        <Nav.Link onClick={addXY}>
          <FcRadarPlot />
        </Nav.Link>
        <Nav.Link onClick={toggle3dView}>
          <ViewButton />
        </Nav.Link>
      </Nav>
    );
  }

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
      <Modal show={showInfoBox} onHide={() => setShowInfo(false)} animation={false} centered>
        <Modal.Header closeButton>
          <Modal.Title>
              <FaInfoCircle />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Current File: {currentFile}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInfo(false)}>
            Close
          </Button>
        </Modal.Footer>
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
            <Nav.Link href="#/home" className={page === "home" ? "active" : ""}>
              Home
            </Nav.Link>
            <Nav.Link href="#/" className={page === "loader" ? "active" : ""}>
              Loader
            </Nav.Link>
            <Nav.Link
              href="#/settings"
              className={page === "settings" ? "active" : ""}
            >
              Settings
            </Nav.Link>
            <NavDropdown title="Layouts" id="navbarScrollingDropdown">
              {layouts}
              <ShowFirstDivider />
              <NavDropdown.Item onClick={saveCurrentLayoutNamed}>
                Save current layout
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
            </NavDropdown>
            <Nav.Link href="#" onClick={() => setShowInfo(true)}>
              <FaInfoCircle />
            </Nav.Link>
          </Nav>
          <Controls />
        </Container>
      </Navbar>
    </>
  );
}
export default ToolBar;
