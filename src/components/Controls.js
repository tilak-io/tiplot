import { useState, useEffect } from "react";
import { FaPlay, FaPause, FaForward, FaBackward } from "react-icons/fa";
import { IoMdRadioButtonOff, IoMdCheckmarkCircleOutline } from "react-icons/io";

const update_ms = 1000;

function Controls() {
  const [isPlaying, setPlaying] = useState(false);
  const [track, setTrack] = useState(true);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {}, []);

  const play = () => {
    window.viewer.clock.shouldAnimate = true;
    setPlaying(true);
  };

  const pause = () => {
    window.viewer.clock.shouldAnimate = false;
    setPlaying(false);
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
    <div className="container">
      <center>
        <button className="btn btn-secondary btn-lg" onClick={backward}>
          <FaBackward />
        </button>
        <PlayOrPause />
        <button className="btn btn-secondary btn-lg" onClick={forward}>
          <FaForward />
        </button>
        <button className="btn btn-danger btn-lg" onClick={toggleTrack}>
          {track === true ? (
            <IoMdCheckmarkCircleOutline />
          ) : (
            <IoMdRadioButtonOff />
          )}
        </button>
        <button className="btn btn-success btn-lg" onClick={toggleSpeed}>
          {speed}x
        </button>
      </center>
    </div>
  );
}

export default Controls;
