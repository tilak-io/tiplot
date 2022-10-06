import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

function TopBar(props) {
  const [isPlaying, setPlaying] = useState(false);

  const toggle = (value) => {
    if (window.viewer) {
      window.viewer.clock.shouldAnimate = value;
      setPlaying(value);
    }
  };

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
