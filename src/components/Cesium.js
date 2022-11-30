import { useState, useEffect, useRef } from "react";
import "../css/cesium.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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

  var cube;

  var positions = [],
    quaternions = [],
    currentPos = 24000;

  const drawPath = (entity) => {
    // const amount = entity.props.length;
    console.log(entity);
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
    console.log(quaternions);

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
    cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 0.3),
      new THREE.MeshNormalMaterial()
    );
    scene.add(cube);
  };

  var grid = new THREE.GridHelper(100, 100);
  scene.add(grid);

  var stalker = new THREE.Vector3();
  var clock = new THREE.Clock();

  const animation = () => {
    if (!cube) return;
    if (currentPos >= 38000) currentPos = 24000;

    let t = clock.getElapsedTime() * 0.1;
    stalker.subVectors(camera.position, cube.position);

    cube.position.x = positions[currentPos].x;
    cube.position.y = positions[currentPos].y;
    cube.position.z = positions[currentPos].z;
    cube.setRotationFromQuaternion(quaternions[currentPos]);

    currentPos++;
    orbit.object.position.copy(cube.position).add(stalker);
    orbit.target.copy(cube.position);
    orbit.update();

    renderer.render(scene, camera);
  };

  return <div ref={mount} />;
}

export default Cesium;
