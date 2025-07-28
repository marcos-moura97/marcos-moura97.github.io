import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js";

class Goal {
  constructor(position = { x: 5, y: 5, z: 0 }) {
    this.radius = 1;
    this.tubeRadius = 0.15;
    this.radialSegments = 8;
    this.tubularSegments = 24;

    this.geometry = new THREE.TorusGeometry(
      this.radius,
      this.tubeRadius,
      this.radialSegments,
      this.tubularSegments
    );

    this.material = new THREE.MeshLambertMaterial({
      color: 0x072904,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.receiveShadow = true;
  }

  getMesh() {
    return this.mesh;
  }
}

export default Goal;
