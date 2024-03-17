import { useEffect, useState, useRef } from "react";
import "../static/css/cesium.css";
import Entity from "../controllers/Entity.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { defaultSettings } from "../views/Settings";
import { PORT } from "../static/js/constants";
import { toast } from "react-toastify";

import front_view from "../static/vectors/front_view.svg";
import left_view from "../static/vectors/left_view.svg";
import top_view from "../static/vectors/top_view.svg";

import ButtonGroup from "react-bootstrap/ButtonGroup";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { BiTargetLock } from "react-icons/bi";

function View3D({ socket, detached }) {
  const [entities, setEntities] = useState([]);
  const [entityConfig, setEntityConfig] = useState([]);

  const entitiesRef = useRef(entities);
  const entityConfigRef = useRef(entityConfig);
  const mount = useRef(0);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, 1, 0.0001, 10000);

  // Scene setup
  camera.up.set(0, 0, -1);
  camera.position.set(-15, -5, -10);

  const orbit = new OrbitControls(camera, renderer.domElement);

  const stalker = new THREE.Vector3();

  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);
  window.camera = camera;
  window.orbit = orbit;

  useEffect(() => {
    // Helpers setup
    setupHelpers();
    // KeyControls
    setupKeyControls();

    // Getting the entities
    getEntitiesProps();

    getEntitiesConfig();

    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mount.current.childElementCount === 0) {
      mount.current.appendChild(renderer.domElement);
    }
    renderer.setAnimationLoop(animation);

    renderer.domElement.addEventListener("dblclick", focusEntity, false);
    document
      .getElementById("top-view")
      .addEventListener("click", topView, false);
    document
      .getElementById("left-view")
      .addEventListener("click", leftView, false);
    document
      .getElementById("front-view")
      .addEventListener("click", frontView, false);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    entitiesRef.current = entities;
  }, [entities]);

  useEffect(() => {
    entityConfigRef.current = entityConfig;
  }, [entityConfig]);

  const getEntitiesProps = async () => {
    setEntities([]);
    const response = await fetch(
      `http://localhost:${PORT}/entities_props`,
    ).then((res) => res.json());
    if (response.ok) {
      response.data.forEach((item) => {
        if (item.active) initEntity(item);
      });
    } else {
      toast.error(response.error);
    }
  };

  const getEntitiesConfig = async () => {
    fetch(`http://localhost:${PORT}/entities_config`)
      .then((res) => res.json())
      .then((res) => {
        setEntityConfig(res.config);
      })
      .catch((error) => console.error("Error fetching data:", error));
  };

  const initEntity = (e) => {
    const newEntity = new Entity(e);
    newEntity.loadPath(scene);
    newEntity.loadObj(scene);
    setEntities((prevEntities) => [...prevEntities, newEntity]);
  };

  const getTrackedEntity = () => {
    const trackedName = entityConfigRef.current.find((e) => e.tracked)?.name;
    return (
      entitiesRef.current.find((e) => e.name === trackedName) ||
      entitiesRef.current[0]
    );
  };

  const setTrackedEntity = (id) => {
    fetch(`http://localhost:${PORT}/set_tracked_entity`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: id,
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success(res.msg);
          getEntitiesConfig();
          stalker.clear();
        } else {
          toast.error(res.msg);
        }
      });
  };

  const updateEntities = () => {
    const target = getTrackedEntity();
    if (!target.mesh) return;
    stalker.subVectors(camera.position, target.mesh.position);
    entitiesRef.current.forEach((e) => e.update());
    orbit.object.position.copy(target.mesh.position).add(stalker);
    orbit.target.copy(target.mesh.position);
    orbit.update();
  };

  const animation = (tick) => {
    if (entitiesRef.current.length === 0) return;
    updateEntities();
    resizeCanvasToDisplaySize();
    renderer.render(scene, camera);
    // const target = getTrackedEntity();
    // target.updateTimelineOnTick(tick);
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
        default:
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
        default:
          break;
      }
    };
  };

  const topView = () => {
    const target = getTrackedEntity();
    if (!target.mesh) return;
    let offset = new THREE.Vector3(0, 0, -10);
    offset.applyQuaternion(target.mesh.quaternion);
    camera.position.copy(target.mesh.position).add(offset);
  };

  const leftView = () => {
    const target = getTrackedEntity();
    if (!target.mesh) return;
    let offset = new THREE.Vector3(0, -10, 0);
    offset.applyQuaternion(target.mesh.quaternion);
    camera.position.copy(target.mesh.position).add(offset);
  };

  const frontView = () => {
    const target = getTrackedEntity();
    if (!target.mesh) return;
    let offset = new THREE.Vector3(10, 0, 0);
    offset.applyQuaternion(target.mesh.quaternion);
    camera.position.copy(target.mesh.position).add(offset);
  };

  const DropdownTrackedEntity = () => (
    <DropdownButton
      as={ButtonGroup}
      size="sm"
      variant="secondary"
      title={<BiTargetLock />}
    >
      {entityConfig.map((entity, index) => (
        <Dropdown.Item
          eventKey={index + 1}
          key={index}
          active={entity.tracked}
          onClick={() => setTrackedEntity(entity.id, entities)}
        >
          {entity.name}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );

  return (
    <div id="view-3d">
      <div ref={mount} />
      <div className="scene-overlay">
        <button id="top-view" className="btn btn-secondary btn-sm">
          <img src={top_view} alt="Top View" width="24" height="24" />
        </button>
        <button id="left-view" className="btn btn-secondary btn-sm">
          <img src={left_view} alt="Right View" width="24" height="24" />
        </button>
        <button id="front-view" className="btn btn-secondary btn-sm">
          <img src={front_view} alt="Front View" width="24" height="24" />
        </button>
        <DropdownTrackedEntity />
      </div>
    </div>
  );
}

export default View3D;
