import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useState, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

function TopBar(props) {
  const [isPlaying, setPlaying] = useState(false);
  const [layouts, setLayouts] = useState([]);

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
    if (value == "" || value == null) value = [];
    else value = JSON.parse(value);
    return value;
  };

  const saveCurrentLayout = () => {
    var savedLayouts = parseLocalStorage("saved_layouts");
    var currentLayout = parseLocalStorage("current_layout");
    savedLayouts.push(currentLayout);
    localStorage.setItem("saved_layouts", JSON.stringify(savedLayouts));

    mapLayouts();
  };

  const mapLayouts = () => {
    const savedLayouts = parseLocalStorage("saved_layouts");
    var rows = savedLayouts.map((e, i) => (
      <NavDropdown.Item key={i} onClick={() => selectLayout(i)}>
        Layout {i + 1}
      </NavDropdown.Item>
    ));
    setLayouts(rows);
  };

  const selectLayout = (index) => {
    var savedLayouts = parseLocalStorage("saved_layouts");
    var selectedLayout = savedLayouts[index];
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
      fr.readAsText(file);
    };

    input.click();
  };

  const clearLayouts = () => {
    localStorage.setItem("saved_layouts", "[]");
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
      <a id="export-layout" style={{ display: "none" }}></a>
      <input id="import-layout" type="file" style={{ display: "none" }} />
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand>TiPlot</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="#/home" className={page == "home" ? "active" : ""}>
              Home
            </Nav.Link>
            <Nav.Link href="#/" className={page == "loader" ? "active" : ""}>
              Loader
            </Nav.Link>
            <NavDropdown title="Layouts" id="navbarScrollingDropdown">
              {layouts}
              <ShowFirstDivider />
              <NavDropdown.Item onClick={saveCurrentLayout}>
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
            <NavDropdown title="Options" id="navbarScrollingDropdown">
              <NavDropdown.Item href="#">do something</NavDropdown.Item>
              <NavDropdown.Item href="#">do something else</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#">Refresh</NavDropdown.Item>
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
