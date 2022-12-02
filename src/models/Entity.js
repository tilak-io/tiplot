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
    const size = e.props.length;
    console.log(e);
    // using a single loop to do all the mapping
    for (let i = 0; i < size; i++) {
      this.timestamp.push(e.props[i].timestamp_tiplot);
      this.addPointToPath(e.props[i], i, size);
      this.addPositionPoint(e.props[i]);
      this.addQuaternion(e.props[i]);
    }
  }

  loadObj(scene) {
    const instance = this;
    const loader = new GLTFLoader();
    loader.load(
      "http://localhost:5000/model",
      function (gltf) {
        // console.log("Entity Loaded");
        instance.mesh = gltf.scene;
        // instance.mesh.add(new THREE.AxesHelper(5));
        scene.add(gltf.scene);
        instance.mesh.children[0].material.color = new THREE.Color("blue");
        window.mesh = instance.mesh.children[0];
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
        // instance.mesh.add(new THREE.AxesHelper(5));
        scene.add(instance.mesh);
      }
    );
  }

  addPositionPoint(props) {
    this.positions.push(
      new THREE.Vector3(props.longitude, props.lattitude, props.altitude)
    );
  }

  addQuaternion(props) {
    this.quaternions.push(
      new THREE.Quaternion(props.q1, props.q2, props.q3, props.q0)
    );
  }

  addPointToPath(props, i, length) {
    if (this.pathPoints === null)
      this.pathPoints = new Float32Array(length * 3);

    const point = new THREE.Vector3(
      props.longitude,
      props.lattitude,
      props.altitude
    );
    point.toArray(this.pathPoints, i * 3);
  }

  loadPath(scene) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.pathPoints, 3)
    );

    var material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      opacity: 0.6,
      // transparent: true,
      linewidth: 3,
    });

    const line = new THREE.Line(geometry, material);
    scene.add(line);
  }

  update() {
    if (this.positions.length === 0) return;
    if (!this.mesh) return;

    if (!window.currentX) {
      this.currentIndex = 0;
    } else {
      const x = findInTimeArray(window.currentX, this.timestamp);
      this.currentIndex = this.timestamp.indexOf(x);
      // TODO: handle situations where x is not fout in timestamp
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

const findInTimeArray = (x, array) => {
  return array.reduce((a, b) => {
    return Math.abs(b - x) < Math.abs(a - x) ? b : a;
  });
};
