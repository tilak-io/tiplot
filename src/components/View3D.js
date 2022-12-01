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
  camera.position.set(0, 0, 1);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  const stalker = new THREE.Vector3();
  const entities = [];

  useEffect(() => {
    // Getting the entities
    socket.emit("get_entities_props");
    socket.on("entities_props", (entities) => {
      entities.forEach(initEntity);
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
    entities.forEach((e) => {
      e.update();
    });
    orbit.object.position.copy(target.mesh.position).add(stalker);
    orbit.target.copy(target.mesh.position);
    orbit.update();
  };

  var gridx = new THREE.GridHelper(100, 100);
  scene.add(gridx);

  const animation = () => {
    if (entities.length === 0) return;
    updateEntities();
    renderer.render(scene, camera);
  };

  return <div ref={mount} />;
}

export default View3D;
