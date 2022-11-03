import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Modal,
  Button,
} from "react-bootstrap";
import { useState, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import logo from "../img/logo.png";

function TopBar(props) {
  const [isPlaying, setPlaying] = useState(false);
  const [layouts, setLayouts] = useState([]);
  const [showSaveMsg, setShowSaveMsg] = useState(false);

  const handleClose = () => setShowSaveMsg(false);
  const saveCurrentLayoutNamed = () => setShowSaveMsg(true);

  useEffect(() => {
    mapLayouts();
  }, []);

  const toggle = (value) => {
    if (window.viewer) {
      window.viewer.clock.shouldAnimate = value;
      setPlaying(value);
    }
  };

  const parseLocalStorage = (key) => {
    var value = localStorage.getItem(key);
    if (value === "" || value === null)
      value = {}; // {} instead of [] so we can use associative arrays
    else value = JSON.parse(value);
    return value;
  };

  // const saveCurrentLayout = () => {
  //   var savedLayouts = parseLocalStorage("saved_layouts");
  //   var currentLayout = parseLocalStorage("current_layout");
  //   savedLayouts.push(currentLayout);
  //   localStorage.setItem("saved_layouts", JSON.stringify(savedLayouts));
  //   mapLayouts();
  // };

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

  function TogglePlay() {
    if (!isPlaying)
      return (
        <span>
          <FaPlay style={{ color: "#00ff4f" }} />
        </span>
      );
    else
      return (
        <span>
          <FaPause style={{ color: "#ffff00" }} />
        </span>
      );
  }

  const page = props.page;
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

      {/* Actual Navbar */}
      <Navbar variant="dark" fixed="top" className="nav-color">
        <a id="export-layout" style={{ display: "none" }}></a>
        <input id="import-layout" type="file" style={{ display: "none" }} />
        <Container>
          <Navbar.Brand target="_blank" href="https://tilak.io">
            <img
              src={logo}
              width="30"
              height="30"
              className="d-inline-block align-top"
              alt="TiPlot"
            />TiPlot
          </Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="#/home" className={page === "home" ? "active" : ""}>
              Home
            </Nav.Link>
            <Nav.Link href="#/" className={page === "loader" ? "active" : ""}>
              Loader
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
            <Nav.Link onClick={() => toggle(!isPlaying)}>
              <TogglePlay />
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}
export default TopBar;
