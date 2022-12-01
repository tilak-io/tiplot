import * as THREE from "three";
export default class Entity {
  startIndex = 24000;
  positions = [];
  quaternions = [];
  currentIndex = this.startIndex;
  isMoving = true;
  mesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 1, 17),
    new THREE.MeshNormalMaterial()
  );
  pathPoints = null;
  path = new THREE.Line();

  constructor() {}

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
      this.pathPoints = new Float32Array(length * 3); // assuming the we already initialized the `positions` array

    const point = new THREE.Vector3(
      props.longitude, // x = x1
      -props.altitude, // y = -z1
      props.lattitude // z = y1
    );
    point.toArray(this.pathPoints, i * 3);
  }

  getPath() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.pathPoints, 3)
    );
    var material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });

    const line = new THREE.Line(geometry, material);
    return line;
  }

  update() {
    if (this.positions.length === 0) return;
    this.mesh.position.x = this.positions[this.currentIndex].x;
    this.mesh.position.y = this.positions[this.currentIndex].y;
    this.mesh.position.z = this.positions[this.currentIndex].z;

    this.mesh.setRotationFromQuaternion(this.quaternions[this.currentIndex]);
    this.mesh.rotation.z -= Math.PI / 2;

    if (this.isMoving) {
      this.currentIndex++;
      if (this.currentIndex >= this.positions.length)
        this.currentIndex = this.startIndex;
    }
  }
}
