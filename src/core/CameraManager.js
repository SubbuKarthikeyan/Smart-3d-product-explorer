import * as THREE from 'three';

/**
 * CameraManager.js
 * Owns PerspectiveCamera, initial placement, aspect updates, and automatic model framing.
 */
export class CameraManager {
  constructor(aspect = window.innerWidth / window.innerHeight) {
    this.defaultFov = 45;
    this.defaultNear = 0.1;
    this.defaultFar = 1000;

    this.camera = new THREE.PerspectiveCamera(
      this.defaultFov,
      aspect,
      this.defaultNear,
      this.defaultFar
    );

    // Initial default position before model is loaded
    this.defaultPosition = new THREE.Vector3(3.5, 2.5, 4.5);
    this.defaultTarget = new THREE.Vector3(0, 0, 0);
    this.camera.position.copy(this.defaultPosition);
    this.camera.lookAt(this.defaultTarget);
  }

  getCamera() {
    return this.camera;
  }

  updateAspect(width, height) {
    if (height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Automatically frame an object or group within the camera frustum
   * @param {THREE.Object3D} object - The target 3D object to frame
   * @param {OrbitControls} [controls] - Optional OrbitControls to update target
   * @param {number} [offsetMultiplier=1.4] - Distance padding multiplier
   */
  frameObject(object, controls = null, offsetMultiplier = 1.4) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraDistance = (maxDim / 2) / Math.tan(fov / 2);

    // Add padding multiplier
    cameraDistance *= offsetMultiplier;

    // View from an isometric angle (slightly elevated and to the side)
    const direction = new THREE.Vector3(1, 0.65, 1.2).normalize();
    const newPos = center.clone().add(direction.multiplyScalar(cameraDistance));

    this.camera.position.copy(newPos);
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();

    this.defaultPosition.copy(newPos);
    this.defaultTarget.copy(center);

    if (controls) {
      controls.target.copy(center);
      controls.update();
    }

    return { center, size, distance: cameraDistance };
  }

  reset(controls = null) {
    this.camera.position.copy(this.defaultPosition);
    this.camera.lookAt(this.defaultTarget);
    this.camera.updateProjectionMatrix();

    if (controls) {
      controls.target.copy(this.defaultTarget);
      controls.update();
    }
  }
}
