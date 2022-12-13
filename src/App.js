import "./css/overlay.css";
import Layout from "./components/Layout";
import Loader from "./components/Loader";
import Settings from "./components/Settings";
import Test from "./components/Test";
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { HashRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  const [socketInstance, setSocketInstance] = useState("");

  useEffect(() => {
    const socket = io("http://localhost:5000/", {
      transports: ["websocket"],
      // cors: {
      //   origin: "http://localhost:3000/",
      // },
    });

    setSocketInstance(socket);

    socket.on("connect", () => {
      // console.log("Connected");
    });

    socket.on("disconnect", () => {
      // console.log("Disconnected");
    });

    return function cleanup() {
      socket.disconnect();
    };
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
              exact
              path="/home"
              element={<Layout socket={socketInstance} />}
            />
            <Route exact path="/settings" element={<Settings />} />
            <Route path="/test" element={<Test />} />
            <Route path="*" element={"not found"} />
          </Routes>
        </Router>
      </>
    );
}

export default App;
