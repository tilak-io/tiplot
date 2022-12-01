import { useState, useEffect, useRef } from "react";
import "../css/cesium.css";
import Entity from "../models/Entity.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { render } from "@testing-library/react";

function View3D({ socket }) {
  const mount = useRef(0);
  var renderer = new THREE.WebGLRenderer();
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, 1, 0.0001, 10000);
  camera.position.set(5, 5, 5);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  const stalker = new THREE.Vector3();
  const entities = [];

  useEffect(() => {
    // Getting the entities
    socket.emit("get_entities_props");
    socket.on("entities_props", (raw_entities) => {
      raw_entities.forEach(initEntity);
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mount.current.childElementCount == 0) {
      mount.current.appendChild(renderer.domElement);
    }
    renderer.setAnimationLoop(animation);

    return () => {
      window.location.reload();
    };
  }, []);

  const initEntity = (e, index) => {
    entities.push(new Entity(e));
    scene.add(entities[index].getPath());
    scene.add(entities[index].getMesh());
  };

  const updateEntities = () => {
    const target = entities[0];
    stalker.subVectors(camera.position, target.mesh.position);
    entities.forEach((e) => e.update());
    orbit.object.position.copy(target.mesh.position).add(stalker);
    orbit.target.copy(target.mesh.position);
    orbit.update();
  };

  var gridx = new THREE.GridHelper(100, 100);
  scene.add(gridx);

  const animation = () => {
    if (entities.length === 0) return;
    updateEntities();
    resizeCanvasToDisplaySize();
    renderer.render(scene, camera);
  };

  const resizeCanvasToDisplaySize = () => {
    const view = document.getElementById("view-3d");
    const canvas = renderer.domElement;

    const width = view.clientWidth;
    const height = view.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  };

  return (
    <div id="view-3d">
      <div ref={mount} />
    </div>
  );
}

export default View3D;
