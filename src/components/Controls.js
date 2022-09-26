import { useState } from "react";
import { FaPlay, FaPause, FaForward, FaBackward } from "react-icons/fa";
import { IoMdRadioButtonOff, IoMdCheckmarkCircleOutline } from "react-icons/io";

function Controls() {
  const [track, setTrack] = useState(true);
  const [speed, setSpeed] = useState(1);

  const play = () => {
    window.viewer.clock.shouldAnimate = true;
  };

  const pause = () => {
    window.viewer.clock.shouldAnimate = false;
  };

  const backward = () => {
    window.viewer.clock.currentTime = window.viewer.clock.startTime;
  };

  const forward = () => {
    window.viewer.clock.currentTime = window.viewer.clock.stopTime;
  };

  const toggleTrack = () => {
    setTrack(!track);
    if (track) window.viewer.trackedEntity = undefined;
    else window.viewer.trackedEntity = window.airplaneEntity;
  };

  const toggleSpeed = () => {
    switch (speed) {
      case 1:
        setSpeed(2);
        window.viewer.clock.multiplier = 2;
        break;
      case 2:
        setSpeed(5);
        window.viewer.clock.multiplier = 5;
        break;
      case 5:
        setSpeed(10);
        window.viewer.clock.multiplier = 10;
        break;
      default:
        setSpeed(1);
        window.viewer.clock.multiplier = 1;
        break;
    }
  };

  return (
    <div className="container">
      <center>
        <button variant="secondary" onClick={backward}>
          <FaBackward />
        </button>
        <button variant="info" onClick={play}>
          <FaPlay />
        </button>
        <button variant="warning" onClick={pause}>
          <FaPause />
        </button>
        <button variant="secondary" onClick={forward}>
          <FaForward />
        </button>
        <button variant="danger" onClick={toggleTrack}>
          {track === true ? (
            <IoMdCheckmarkCircleOutline />
          ) : (
            <IoMdRadioButtonOff />
          )}
        </button>
        <button variant="success" onClick={toggleSpeed}>
          {speed}x
        </button>
      </center>
    </div>
  );
}

export default Controls;
