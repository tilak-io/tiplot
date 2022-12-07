import { useEffect, useRef } from "react";
import "../css/cesium.css";
import Entity from "../models/Entity.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function View3D({ socket }) {
  const mount = useRef(0);
  var renderer = new THREE.WebGLRenderer();
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, 1, 0.0001, 10000);
  window.scene = scene;

  // Scene setup
  camera.up.set(0, 0, -1);
  camera.position.set(-15, -5, -10);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.maxDistance = 1500;

  const stalker = new THREE.Vector3();
  const entities = [];

  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  useEffect(() => {
    // Helpers setup
    setupHelpers();
    // Getting the entities
    socket.emit("get_entities_props");
    // Errors
    socket.on("error", (error) => {
      alert(error);
    });

    socket.on("entities_props", (raw_entities) => {
      raw_entities.forEach(initEntity);
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mount.current.childElementCount === 0) {
      mount.current.appendChild(renderer.domElement);
    }
    renderer.setAnimationLoop(animation);

    return () => {
      window.location.reload();
    };
    // eslint-disable-next-line
  }, []);

  const initEntity = (e, index) => {
    entities.push(new Entity(e));
    entities[index].loadPath(scene, index);
    entities[index].loadObj(scene, index);
  };

  const getTrackedEntity = () => {
    var tracked = entities[0]; // by default, the first entity is the tracked one
    entities.forEach((e) => {
      if (e.tracked) tracked = e;
    });
    return tracked;
  };

  const updateEntities = () => {
    const target = getTrackedEntity();
    if (!target.mesh) return;
    stalker.subVectors(camera.position, target.mesh.position);
    entities.forEach((e) => e.update());
    orbit.object.position.copy(target.mesh.position).add(stalker);
    orbit.target.copy(target.mesh.position);
    orbit.update();
  };

  const animation = () => {
    if (entities.length === 0) return;
    updateEntities();
    resizeCanvasToDisplaySize();
    renderer.render(scene, camera);
  };

  const resizeCanvasToDisplaySize = () => {
    const view = document.getElementById("view-3d");
    const canvas = renderer.domElement;

    if (!view) return;

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

  const parseLocalStorage = (key) => {
    var value = localStorage.getItem(key);
    if (value === "" || value === null)
      value = {
        originHelper: false,
        xGrid: false,
        yGrid: false,
        zGrid: false,
      };
    else value = JSON.parse(value);
    return value;
  };

  const setupHelpers = () => {
    const general_settings = parseLocalStorage("general_settings");
    const xGrid = new THREE.GridHelper(1500, 150);
    const yGrid = new THREE.GridHelper(1500, 150);
    const zGrid = new THREE.GridHelper(1500, 150);
    const originHelper = new THREE.AxesHelper(5);
    xGrid.rotateZ(Math.PI / 2);
    zGrid.rotateX(Math.PI / 2);
    if (general_settings.xGrid) scene.add(xGrid);
    if (general_settings.yGrid) scene.add(yGrid);
    if (general_settings.zGrid) scene.add(zGrid);
    if (general_settings.originHelper) scene.add(originHelper);
  };

  return (
    <div id="view-3d">
      <div ref={mount} />
    </div>
  );
}

export default View3D;
