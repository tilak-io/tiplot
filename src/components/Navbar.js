import { Button, Table, Modal, Navbar, Container, Nav } from "react-bootstrap";
import { useState, useEffect } from "react";

function LoggedMessagesModal(props) {
  const [loggedMessages, setLoggedMessages] = useState([]);

  useEffect(() => {
    //getLoggedMessages();
  }, []);

  const getLoggedMessages = () => {
    fetch("http://localhost:5000/logged_messages")
      .then((res) => res.json())
      .then((res) => {
        setLoggedMessages(res.messages);
      });
  };

  const rows = [];
  for (let i = 0; i < loggedMessages.length; i++) {
    rows.push(
      <tr key={i}>
        <td>{loggedMessages[i]["log_level"]}</td>
        <td>{loggedMessages[i]["msg"]}</td>
        <td>
          {Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }).format(loggedMessages[i]["timestamp"])}
        </td>
      </tr>
    );
  }

  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Logged Messages
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Log Level</th>
              <th>Message</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

function MsgInfoModal(props) {
  const [msgInfo, setMsgInfo] = useState({});

  useEffect(() => {
    //getMsgInfo();
  }, []);

  const getMsgInfo = () => {
    fetch("http://localhost:5000/msg_info")
      .then((res) => res.json())
      .then((res) => {
        setMsgInfo(res.info);
      });
  };

  const rows = [];

  for (let i = 0; i < Object.keys(msgInfo).length; i++) {
    var k = Object.keys(msgInfo)[i];
    rows.push(
      <tr key={i}>
        <td>{k}</td>
        <td>{msgInfo[k]}</td>
      </tr>
    );
  }
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">Info</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

function TopBar() {
  const [loggedMessagesShow, setLoggedMessagesShow] = useState(false);
  const [msgInfoShow, setMsgInfoShow] = useState(false);

  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="#/home">TiPlot</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link onClick={() => setLoggedMessagesShow(true)}>
              Logged Messages
            </Nav.Link>
            <Nav.Link onClick={() => setMsgInfoShow(true)}>Info</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <LoggedMessagesModal
        show={loggedMessagesShow}
        onHide={() => setLoggedMessagesShow(false)}
      />
      <MsgInfoModal show={msgInfoShow} onHide={() => setMsgInfoShow(false)} />
    </>
  );
}
export default TopBar;
