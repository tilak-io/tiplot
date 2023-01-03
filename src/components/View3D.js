import { useEffect, useRef } from "react";
import "../static/css/cesium.css";
import Entity from "../controllers/Entity.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { defaultSettings } from "../views/Settings";

function View3D({ socket, detached }) {
  const mount = useRef(0);
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, 1, 0.0001, 10000);
  window.scene = scene;

  // Scene setup
  camera.up.set(0, 0, -1);
  camera.position.set(-15, -5, -10);

  const orbit = new OrbitControls(camera, renderer.domElement);

  const stalker = new THREE.Vector3();
  const entities = [];

  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  useEffect(() => {
    // Helpers setup
    setupHelpers();
    // KeyControls
    setupKeyControls();

    // Getting the entities
    getEntitiesProps();

    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mount.current.childElementCount === 0) {
      mount.current.appendChild(renderer.domElement);
    }
    renderer.setAnimationLoop(animation);

    renderer.domElement.addEventListener("dblclick", focusEntity, false);
    // eslint-disable-next-line
  }, []);

  const getEntitiesProps = async () => {
    const raw_entities = await fetch(
      "http://localhost:5000/entities_props"
    ).then((res) => res.json());
    if (raw_entities.error) alert(raw_entities.error);
    else raw_entities.forEach(initEntity);
  };

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
    // const target = getTrackedEntity();
    // target.updateTimelineIndicator();
  };

  const resizeCanvasToDisplaySize = () => {
    // const view = document.getElementById("view-3d");
    const canvas = renderer.domElement;
    if (!canvas) return;
    // #view-3d: we need to reference it this way because `document` can't read detached windows
    const view = canvas.parentElement?.parentElement;

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
    if (value === "" || value === null) value = defaultSettings;
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
    scene.background = new THREE.Color(general_settings.backgroundColor);
    orbit.enableDamping = true;
    orbit.maxDistance =
      general_settings.maxDistance ?? defaultSettings["maxDistance"];
    orbit.dampingFactor =
      general_settings.dampingFactor ?? defaultSettings["dampingFactor"];
    camera.fov = general_settings.fov ?? defaultSettings["fov"];
  };

  const focusEntity = () => {
    camera.position.x = orbit.target.x - 15;
    camera.position.y = orbit.target.y - 5;
    camera.position.z = orbit.target.z - 10;
  };

  const setupKeyControls = () => {
    document.onkeydown = function (e) {
      const target = getTrackedEntity();
      switch (e.code) {
        case "ArrowRight":
          target.moveForward();
          break;
        case "ArrowLeft":
          target.moveBackward();
          break;
        case "PageDown":
          target.goLastPoint();
          break;
        case "PageUp":
          target.goFirstPoint();
          break;
      }
    };

    document.onkeyup = function (e) {
      const target = getTrackedEntity();
      switch (e.code) {
        case "ArrowRight":
        case "ArrowLeft":
        case "PageDown":
        case "PageUp":
          target.updateTimelineIndicator();
          break;
      }
    };
  };

  return (
    <div id="view-3d">
      <div ref={mount} />
    </div>
  );
}

export default View3D;
