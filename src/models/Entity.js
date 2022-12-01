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
        console.log("loaded drone");
        instance.mesh = gltf.scene;
        scene.add(gltf.scene);
      },
      undefined,
      function (error) {
        console.log(error);
        console.log("failed to load drone, setting up default cone");
        const width = 0.5; // ui: width
        const height = 0.3; // ui: height
        const depth = 2; // ui: depth
        const geometry = new THREE.BoxGeometry(width, height, depth);
        instance.mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshNormalMaterial()
        );
        scene.add(instance.mesh);
      }
    );
  }

  addPositionPoint(props) {
    this.positions.push(
      new THREE.Vector3(
        props.longitude, // x = x1
        -props.altitude, // y = -z1
        props.lattitude // z = y
      )
    );
  }

  addQuaternion(props) {
    this.quaternions.push(
      new THREE.Quaternion(
        props.q1, // qx = qx
        -props.q3, // qy = -qz
        props.q2, // qz = qy
        props.q0 // qw = qw
      )
    );
  }

  addPointToPath(props, i, length) {
    if (this.pathPoints === null)
      this.pathPoints = new Float32Array(length * 3);

    const point = new THREE.Vector3(
      props.longitude, // x = x1
      -props.altitude, // y = -z1
      props.lattitude // z = y1
    );
    point.toArray(this.pathPoints, i * 3);
  }

  loadPath(scene) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.pathPoints, 3)
    );
    var material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
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
      this.currentIndex = this.timestamp.indexOf(window.currentX);

      // TODO: handle situations where x is not fout in timestamp
    }

    // this.currentIndex = window.currentIndex ?? 0;
    this.mesh.position.x = this.positions[this.currentIndex].x;
    this.mesh.position.y = this.positions[this.currentIndex].y;
    this.mesh.position.z = this.positions[this.currentIndex].z;

    // this.mesh.setRotationFromQuaternion(this.quaternions[this.currentIndex]);
    // this.mesh.rotation.y += Math.PI;
    // this.mesh.rotation.y += Math.PI / 2;

    if (this.isMoving) {
      this.currentIndex++;
      if (this.currentIndex >= this.positions.length)
        this.currentIndex = this.startIndex;
    }
  }
}
