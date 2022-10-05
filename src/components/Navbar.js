import { Container, Nav, Navbar } from "react-bootstrap";
import { useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

function TopBar() {
  const [isPlaying, setPlaying] = useState(false);

  const play = () => {
    window.viewer.clock.shouldAnimate = true;
    setPlaying(true);
  };
  const pause = () => {
    window.viewer.clock.shouldAnimate = false;
    setPlaying(false);
  };

  function PlayOrPause() {
    if (!isPlaying)
      return (
        <button className="btn btn-info btn-lg" onClick={play}>
          <FaPlay />
        </button>
      );
    else
      return (
        <button className="btn btn-warning btn-lg" onClick={pause}>
          <FaPause />
        </button>
      );
  }

  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="#/">TiPlot</Navbar.Brand>
          <Nav className="me-auto">
            <PlayOrPause />
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}
export default TopBar;
