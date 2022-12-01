import { useState, useEffect, useRef } from "react";
import "../css/cesium.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

function Cesium({ socket }) {
  const mount = useRef(0);

  var renderer = new THREE.WebGLRenderer();
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.0001,
    10000
  );

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  camera.position.set(0, 5, 8);

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

    return () => {
      window.location.reload();
    };
  });

  var drone;

  var positions = [],
    quaternions = [],
    currentPos = 24000;

  const drawPath = (entity) => {
    // const amount = entity.props.length;
    const amount = entity.props.length;
    const points = new Float32Array(amount * 3);
    const sizes = new Float32Array(amount);
    const vertex = new THREE.Vector3();
    for (let i = 0; i < amount; i++) {
      vertex.x = entity.props[i].longitude;
      vertex.y = -entity.props[i].altitude;
      vertex.z = entity.props[i].lattitude;

      positions.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
      vertex.toArray(points, i * 3);

      quaternions.push(
        new THREE.Quaternion(
          entity.props[i].q1,
          -entity.props[i].q3,
          entity.props[i].q2,
          entity.props[i].q0
        )
      );
      sizes[i] = 10;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));

    var material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });

    // line = new THREE.Points(geometry, material);
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    // window.positions = positions;
    camera.position.z = 5;
    drone = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 1, 17),
      new THREE.MeshNormalMaterial()
    );
    scene.add(drone);
  };

  var gridx = new THREE.GridHelper(100, 100);
  scene.add(gridx);

  var stalker = new THREE.Vector3();
  var clock = new THREE.Clock();

  const animation = () => {
    if (!drone) return;
    if (currentPos >= 34395) currentPos = 24000;

    let t = clock.getElapsedTime() * 0.1;
    stalker.subVectors(camera.position, drone.position);

    drone.position.x = positions[currentPos].x;
    drone.position.y = positions[currentPos].y;
    drone.position.z = positions[currentPos].z;
    drone.setRotationFromQuaternion(quaternions[currentPos]);
    drone.rotation.z -= Math.PI / 2;

    currentPos++;
    orbit.object.position.copy(drone.position).add(stalker);
    orbit.target.copy(drone.position);
    orbit.update();

    renderer.render(scene, camera);
  };

  return <div ref={mount} />;
}

export default Cesium;
