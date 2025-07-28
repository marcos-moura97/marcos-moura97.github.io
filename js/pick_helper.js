import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js";

class PickedObject {
  constructor(object) {
    this.object = object;
    this.originalPosition = object.position.clone();
    this.originalColor = object.material.emissive.getHex();
  }

  flash(time) {
    const flashColor = (time * 8) % 2 > 1 ? 0xffff00 : 0xff0000;
    this.object.material.emissive.setHex(flashColor);
  }

  restoreColor() {
    this.object.material.emissive.setHex(this.originalColor);
  }
}

class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
  }

  tryPick(normalizedPosition, scene, camera, balls) {
    this.raycaster.setFromCamera(normalizedPosition, camera);
    const intersects = this.raycaster.intersectObjects(balls);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      this.pickedObject = new PickedObject(obj);
      return true;
    }

    return false;
  }

  updateFlash(time) {
    if (this.pickedObject) {
      this.pickedObject.flash(time);
    }
  }

  clearPickedObject() {
    if (this.pickedObject) {
      this.pickedObject.restoreColor();
      //this.pickedObject = null;
    }
  }

  picked() {
    this.pickedObject = null;
  }
}

export default PickHelper;
