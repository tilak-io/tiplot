import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default class Entity {
  startIndex = 24000;
  positions = [];
  quaternions = [];
  timestamp = [];
  currentIndex = this.startIndex;
  isMoving = true;
  pathPoints = null;
  path = new THREE.Line();
  mesh = null;

  constructor(e) {
    console.log(e);
    const size = e.props.length;
    this.useXYZ = e.useXYZ;
    this.setReference(e.props[0]);
    // using a single loop to do all the mapping
    for (let i = 0; i < size; i++) {
      this.timestamp.push(e.props[i].timestamp_tiplot);
      if (e.useXYZ) {
        this.addPointToPath(e.props[i], i, size);
      } else {
        this.addCoordinatesToPath(e.props[i], i, size);
      }
      this.addQuaternion(e.props[i]);
    }
  }

  ///////////////////// Entity Attitude
  addQuaternion(props) {
    this.quaternions.push(
      new THREE.Quaternion(props.q1, props.q2, props.q3, props.q0)
    );
  }

  // Using Longitude/Lattitude/Altitude
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
    const point = new THREE.Vector3(props.x, props.y, props.z);
    point.toArray(this.pathPoints, i * 3);

    // Entity position
    this.positions.push(new THREE.Vector3(props.x, props.y, props.z));
  }

  //////////////////// Drawing the entity's path
  //
  loadPath(scene) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.pathPoints, 3)
    );

    var material = new THREE.LineBasicMaterial({
      color: this.useXYZ ? 0x00ff00ff : 0xffff00,
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
        scene.add(gltf.scene);
        instance.mesh.children[0].material.color = new THREE.Color("blue");
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

  setReference(props) {
    const [x, y] = getXY(props.longitude, props.lattitude);
    const z = -props.altitude;
    this.ref_x = x;
    this.ref_y = y;
    this.ref_z = z;
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

    // this.currentIndex = window.currentIndex ?? 0;
    this.mesh.position.x = this.positions[this.currentIndex].x;
    this.mesh.position.y = this.positions[this.currentIndex].y;
    this.mesh.position.z = this.positions[this.currentIndex].z;

    this.mesh.setRotationFromQuaternion(this.quaternions[this.currentIndex]);

    if (this.isMoving) {
      this.currentIndex++;
      this.currentIndex++;
      if (this.currentIndex >= this.positions.length)
        this.currentIndex = this.startIndex;
    }
  }
}

// Extra Math
//
const findInTimeArray = (x, array) => {
  return array.reduce((a, b) => {
    return Math.abs(b - x) < Math.abs(a - x) ? b : a;
  });
};

const CONSTANTS_RADIUS_OF_EARTH = 6371000;
const k = 0.677; // PX4 constant

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
