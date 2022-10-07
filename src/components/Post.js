import React, { useState, useEffect } from "react";
import Cesium from "./Cesium";
import { io } from "socket.io-client";

function Post() {
  const [socketInstance, setSocketInstance] = useState("");

  useEffect(() => {
    const socket = io("localhost:5000/", {
      transports: ["websocket"],
      cors: {
        origin: "http://localhost:3000/",
      },
    });

    setSocketInstance(socket);

    socket.on("connect", () => {
      console.log("Connected");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    return function cleanup() {
      socket.disconnect();
    };
  }, []);

  if (socketInstance !== "")
    return (
      <>
        <Cesium socket={socketInstance} />
      </>
    );
  else return <div>Loading</div>;
}
export default Post;
