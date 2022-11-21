import { useState, useEffect } from "react";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Modal,
  Button,
} from "react-bootstrap";
import {
  FaPlay,
  FaPause,
  FaToggleOn,
  FaToggleOff,
  FaForward,
  FaExpand,
} from "react-icons/fa";
import logo from "../img/logo.png";

function TopBar({ page, toggle3dView, showView }) {
  const [isPlaying, setPlaying] = useState(false);
  const [layouts, setLayouts] = useState([]);
  const [showSaveMsg, setShowSaveMsg] = useState(false);
  const [speed, setSpeed] = useState(1);

  const handleClose = () => setShowSaveMsg(false);
  const saveCurrentLayoutNamed = () => setShowSaveMsg(true);

  useEffect(() => {
    mapLayouts();
  }, []);

  const togglePlay = () => {
    if (window.viewer) {
      window.viewer.clock.shouldAnimate = !isPlaying;
      setPlaying(!isPlaying);
    }
  };

  const toggleSpeed = () => {
    if (window.viewer) {
      switch (speed) {
        case 1:
          window.viewer.clock.multiplier = 2;
          setSpeed(2);
          break;
        case 2:
          window.viewer.clock.multiplier = 5;
          setSpeed(5);
          break;
        case 5:
          window.viewer.clock.multiplier = 10;
          setSpeed(10);
          break;
        default:
          window.viewer.clock.multiplier = 1;
          setSpeed(1);
          break;
      }
    }
  };

  const fitGraphsToScreen = () => {
    const containers = document.getElementsByClassName("resizable");
    const plots = document.getElementsByClassName("plot-yt");
    const multiselects = document.getElementsByClassName("multiselect");
    var additionalHeight = 130; // buttons + navbar height
    for (var i = 0; i < multiselects.length; i++)
      additionalHeight += multiselects[i].clientHeight;
    const plotHeight = (window.innerHeight - additionalHeight) / plots.length;
    var update = {
      autoresize: true,
      height: plotHeight,
    };

    for (var i = 0; i < plots.length; i++)
      containers[i].style.height = plotHeight + "px";
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

  function PlayButton() {
    if (!isPlaying)
      return (
        <span title="Play">
          <FaPlay style={{ color: "#00ff4f" }} />
        </span>
      );
    else
      return (
        <span title="Pause">
          <FaPause style={{ color: "#ffff00" }} />
        </span>
      );
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

  function SpeedButton() {
    var color;
    switch (speed) {
      case 1:
        color = "#593f73";
        break;
      case 2:
        color = "#7460bf";
        break;
      case 5:
        color = "#8372f2";
        break;
      default:
        color = "#b3bdf2";
        break;
    }
    return (
      <span>
        <FaForward style={{ color: color }} />
      </span>
    );
  }

  function Controls() {
    if (window.viewer)
      return (<Nav>
        <Nav.Link onClick={fitGraphsToScreen}>
          <FaExpand style={{ color: "#0af" }} title="Fit graphs to screen" />
        </Nav.Link>
        <Nav.Link onClick={togglePlay}>
          <PlayButton />
        </Nav.Link>
        <Nav.Link onClick={toggleSpeed}>
          <SpeedButton />
        </Nav.Link>
        <Nav.Link onClick={toggle3dView}>
          <ViewButton />
        </Nav.Link>
      </Nav>);
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
          </Nav>
          <Controls />
        </Container>
      </Navbar>
    </>
  );
}
export default TopBar;
