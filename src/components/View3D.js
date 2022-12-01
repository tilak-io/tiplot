import { useState, useEffect, useRef } from "react";
import "../css/cesium.css";
import Entity from "../models/Entity.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

function View3D({ socket }) {
  const mount = useRef(0);
  var renderer = new THREE.WebGLRenderer();
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, 1, 0.0001, 10000);
  camera.position.set(0, 5, 8);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  var stalker = new THREE.Vector3();
  const entity = new Entity();

  useEffect(() => {
    // Getting the entities
    socket.emit("get_entities_props");
    socket.on("entities_props", (entities) => {
      entities.forEach(drawPath);
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mount.current.childElementCount == 0) {
      mount.current.appendChild(renderer.domElement);
    }
    renderer.setAnimationLoop(animation);
    scene.add(entity.mesh);
    return () => {
      window.location.reload();
    };
  }, []);

  const drawPath = (e) => {
    const size = e.props.length;
    for (let i = 0; i < size; i++) {
      entity.addPointToPath(e.props[i], i, size);
      entity.addPositionPoint(e.props[i]);
      entity.addQuaternion(e.props[i]);
    }
    var path = entity.getPath();
    scene.add(path);
  };

  var gridx = new THREE.GridHelper(100, 100);
  scene.add(gridx);

  const animation = () => {
    stalker.subVectors(camera.position, entity.mesh.position);
    entity.update();
    orbit.object.position.copy(entity.mesh.position).add(stalker);
    orbit.target.copy(entity.mesh.position);
    orbit.update();
    renderer.render(scene, camera);
  };

  return <div ref={mount} />;
}

export default View3D;
