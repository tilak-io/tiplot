import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Plotly from "plotly.js/dist/plotly";

export default class Entity {
  positions = [];
  rotations = [];
  timestamp = [];
  currentIndex = 0;
  isMoving = false;
  pathPoints = null;
  path = new THREE.Line();
  mesh = null;

  constructor(e) {
    const size = e.props.length;
    this.useXYZ = e.useXYZ;
    this.useRPY = e.useRPY;
    this.pathColor = e.pathColor;
    this.color = e.color;
    this.alpha = e.alpha;
    this.wireframe = e.wireframe;
    this.tracked = e.tracked;
    this.scale = e.scale;
    this.setReference(e);
    // using a single loop to do all the mapping
    for (let i = 0; i < size; i++) {
      this.timestamp.push(e.props[i].timestamp_tiplot);
      // position
      if (e.useXYZ) this.addPointToPath(e.props[i], i, size);
      else this.addCoordinatesToPath(e.props[i], i, size);
      // rotation
      if (e.useRPY) this.addEuler(e.props[i]);
      else this.addQuaternion(e.props[i]);
    }
  }

  // Entity position
  //
  addCoordinatesToPath(props, i, length) {
    if (this.pathPoints === null)
      this.pathPoints = new Float32Array(length * 3);

    // Entity path
    const [x, y] = getXY(props.longitude, props.lattitude);
    const z = -props.altitude;
    const point = new THREE.Vector3(
      x - this.ref_x,
      y - this.ref_y,
      z - this.ref_z
    );
    point.toArray(this.pathPoints, i * 3);

    // Entity position
    this.positions.push(
      new THREE.Vector3(x - this.ref_x, y - this.ref_y, z - this.ref_z)
    );
  }

  addPointToPath(props, i, length) {
    if (this.pathPoints === null)
      this.pathPoints = new Float32Array(length * 3);

    // Entity path
    const point = new THREE.Vector3(
      props.x - this.ref_x,
      props.y - this.ref_y,
      props.z - this.ref_z
    );
    point.toArray(this.pathPoints, i * 3);

    // Entity position
    this.positions.push(
      new THREE.Vector3(
        props.x - this.ref_x,
        props.y - this.ref_y,
        props.z - this.ref_z
      )
    );
  }

  ///////////////////// Entity Attitude
  addQuaternion(props) {
    this.rotations.push(
      new THREE.Quaternion(props.q1, props.q2, props.q3, props.q0)
    );
  }

  addEuler(props) {
    this.rotations.push(
      new THREE.Euler(props.roll, props.pitch, props.yaw, "XYZ")
    );
  }

  //////////////////// Drawing the entity's path
  //
  loadPath(scene, idx) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.pathPoints, 3)
    );

    var material = new THREE.LineBasicMaterial({
      color: this.pathColor,
    });

    const line = new THREE.Line(geometry, material);
    scene.add(line);
  }

  //////////////////// Drawing the 3d obj
  //
  loadObj(scene) {
    const instance = this;
    const loader = new GLTFLoader();
    loader.load(
      "http://localhost:5000/model",
      function (gltf) {
        instance.mesh = gltf.scene;
        instance.mesh.children[0].children[0].material.transparent = true;
        instance.mesh.children[0].children[0].material.opacity = instance.alpha;
        instance.mesh.children[0].children[0].material.color = new THREE.Color(
          instance.color
        );
        instance.mesh.children[0].children[0].material.wireframe =
          instance.wireframe;
        instance.mesh.scale.x = instance.scale;
        instance.mesh.scale.y = instance.scale;
        instance.mesh.scale.z = instance.scale;
        scene.add(instance.mesh);
      },
      undefined,
      function (error) {
        console.log(error);
        console.log("failed to load drone, setting up default cube");
        const geometry = new THREE.BoxGeometry(2, 0.5, 0.3);
        instance.mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshNormalMaterial()
        );
        scene.add(instance.mesh);
      }
    );
  }

  ////////////////////  Reference
  // Setting the first point as a reference
  //

  setReference(e) {
    // we set the first position as the reference
    if (e.useXYZ) {
      this.ref_x = e.props[0].x;
      this.ref_y = e.props[0].y;
      this.ref_z = e.props[0].z;
    } else {
      const [x, y] = getXY(e.props[0].longitude, e.props[0].lattitude);
      const z = -e.props[0].altitude;
      this.ref_x = x;
      this.ref_y = y;
      // this.ref_z = z;
      this.ref_z = 0;
    }
  }

  //////////////////// Updating the position/attitude
  // This function will be called every frame
  //
  update() {
    if (this.positions.length === 0) return;

    if (!this.mesh) return;

    if (!window.currentX) {
      this.currentIndex = 0;
    } else {
      const x = findInTimeArray(window.currentX, this.timestamp);
      this.currentIndex = this.timestamp.indexOf(x);
    }

    this.mesh.position.x = this.positions[this.currentIndex].x;
    this.mesh.position.y = this.positions[this.currentIndex].y;
    this.mesh.position.z = this.positions[this.currentIndex].z;

    if (this.useRPY)
      this.mesh.setRotationFromEuler(this.rotations[this.currentIndex]);
    else this.mesh.setRotationFromQuaternion(this.rotations[this.currentIndex]);
  }

  //////////////////// Moving By Frame
  // Moving forward exactly one frame
  //
  moveForward() {
    if (!window.currentX) window.currentX = this.timestamp[0];
    if (this.currentIndex === this.timestamp.length - 1)
      window.currentX = this.timestamp[0];
    else window.currentX = this.timestamp[this.currentIndex + 1];
    console.log(window.currentX);
    this.drawTimelineIndicator(window.currentX);
  }

  // Moving backward exactly one frame
  //
  moveBackward() {
    if (!window.currentX) window.currentX = this.timestamp[0];
    if (this.currentIndex === 0)
      window.currentX = this.timestamp[this.timestamp.length - 1];
    else window.currentX = this.timestamp[this.currentIndex - 1];
    this.drawTimelineIndicator(window.currentX);
  }

  // updating timeline indicators
  drawTimelineIndicator = (x) => {
    const plots = document.getElementsByClassName("plot-yt");
    const update = {
      custom: true,
      shapes: [
        {
          type: "line",
          x0: x,
          y0: 0,
          x1: x,
          yref: "paper",
          y1: 1,
          line: {
            color: "red",
            width: 1.5,
          },
        },
      ],
    };

    for (let i = 0; i < plots.length; i++) {
      if (plots[i].data.length === 0) continue;
      Plotly.relayout(plots[i], update);
    }
  };
}

// Extra
//
const CONSTANTS_RADIUS_OF_EARTH = 6371000; // radius of the earth
const k = 0.677; // PX4 constant

const findInTimeArray = (x, array) => {
  return array.reduce((a, b) => {
    return Math.abs(b - x) < Math.abs(a - x) ? b : a;
  });
};

const getXY = (lon, lat) => {
  // const ref_lat = (8.545607418125618 * 180) / Math.PI;
  // const ref_lon = (47.39775079229968 * 180) / Math.PI;
  // const ref_cos_lat = Math.cos(ref_lat);
  // const ref_sin_lat = Math.sin(ref_lat);
  // const lat_rad = (lat * 180) / Math.PI;
  // const lon_rad = (lon * 180) / Math.PI;

  // const sin_lat = Math.sin(lat_rad);
  // const cos_lat = Math.cos(lat_rad);

  // const cos_d_lon = Math.cos(lon_rad - ref_lon);
  // const arg = ref_sin_lat * sin_lat + ref_cos_lat * cos_lat * cos_d_lon;
  // const c = Math.acos(arg);

  // console.log(c / Math.sin(c));
  var x = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  x = (k * (x * Math.PI * CONSTANTS_RADIUS_OF_EARTH)) / 180;

  var y = (k * (lon * Math.PI * CONSTANTS_RADIUS_OF_EARTH)) / 180;
  return [x, y];
};
