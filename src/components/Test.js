import React, { useState, useEffect } from "react";
import Cesium from "./Cesium";
import { io } from "socket.io-client";
import "../css/test.css";

function Test() {
  useEffect(() => {}, []);

  return (
    <>
      <nav className="navbar navbar-default navbar-fixed-top navbar-inverse">
        <div className="container-fluid">
          <div className="navbar-header">
            <button
              type="button"
              className="navbar-toggle collapsed"
              data-toggle="collapse"
              data-target="#bs-example-navbar-collapse-1"
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <a className="navbar-brand" href="#">
              Brand
            </a>
          </div>

          <div
            className="collapse navbar-collapse"
            id="bs-example-navbar-collapse-1"
          >
            <ul className="nav navbar-nav navbar-right">
              <li role="presentation" id="navMenu" className="active">
                <a href="#">nav</a>
              </li>
              <li role="presentation" id="formMenu" className="active">
                <a href="#">form</a>
              </li>
              <li role="presentation" id="mapMenu" className="active">
                <a href="#">map</a>
              </li>
              <li role="presentation" id="utilsMenu" className="active">
                <a href="#">utils</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div id="content">
        <div id="nav" className="tab">
          nav
        </div>
        <div id="form" className="tab">
          form
        </div>
        <div id="map" className="tab">
          map
        </div>
        <div id="utils" className="tab">
          utils
        </div>
      </div>
      <script></script>
    </>
  );
}
export default Test;
