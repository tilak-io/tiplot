import "./static/css/overlay.css";
import Loader from "./views/Loader";
import Settings from "./views/Settings";
import Test from "./views/Test";
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "./views/layouts/MainLayout";
import Entities from "./views/Entities";
import { PORT } from "./static/js/constants";

function App() {
  const [socketInstance, setSocketInstance] = useState("");

  useEffect(() => {
    const socket = io(`http://localhost:${PORT}/`, {
      transports: ["websocket"],
      // cors: {
      //   origin: "http://localhost:3000/",
      // },
    });

    setSocketInstance(socket);

    socket.on("connect", () => {
      // console.log("Connected");
    });

    socket.on("entities_loaded", () => {
      console.log("app recieved the signal");
      // navigate("/home");
    });

    socket.on("disconnect", () => {
      // console.log("Disconnected");
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("entities_loaded");
    };
    // return function cleanup() {

    //   socket.disconnect();
    // };
  }, []);

  // return <Test />;

  if (socketInstance === "") return <div>Loading</div>;
  else
    return (
      <>
        <Router>
          <Routes>
            <Route
              exact
              path="/"
              element={<Loader socket={socketInstance} />}
            />
            <Route
              path="/home"
              element={<MainLayout socket={socketInstance} />}
            />
            <Route exact path="/settings" element={<Settings />} />
            <Route exact path="/entities" element={<Entities />} />
            <Route
              exact
              path="/add_log"
              element={<Loader socket={socketInstance} isExtra={true} />}
            />
            <Route exact path="/test" element={<Test />} />
            <Route path="*" element={"not found"} />
          </Routes>
        </Router>
      </>
    );
}

export default App;
