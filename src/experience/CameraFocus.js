import * as THREE from 'three';
import { appState } from '../state/AppState.js';

/**
 * CameraFocus.js
 * Owns smooth camera inspection transitions, component bounds calculations,
 * cubic easing interpolation, OrbitControls target synchronization, and overview reset.
 */
export class CameraFocus {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;

    // Overview default transforms
    this.overviewPosition = new THREE.Vector3(3.5, 2.5, 4.5);
    this.overviewTarget = new THREE.Vector3(0, 0, 0);

    // Animation state
    this.animating = false;
    this.startTime = 0;
    this.duration = 850; // ms

    this.startPos = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();
    this.startTarget = new THREE.Vector3();
    this.targetTarget = new THREE.Vector3();

    this.onCompleteCallback = null;
  }

  /**
   * Cache the default overview camera transform for reset transitions
   */
  setOverview(position, target) {
    if (position) this.overviewPosition.copy(position);
    if (target) this.overviewTarget.copy(target);
  }

  /**
   * Smoothly focus the camera on a 3D component node
   * @param {THREE.Object3D} componentObject - Target 3D component
   * @param {number} [duration=850] - Transition duration in ms
   * @param {Function} [onComplete] - Callback upon arrival
   */
  focusOn(componentObject, duration = 850, onComplete = null) {
    if (!componentObject) return;

    // 1. Cancel previous animation if running
    if (this.animating) {
      this.cancel();
    }

    // 2. Calculate world bounds & center
    const box = new THREE.Box3().setFromObject(componentObject);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const radius = maxDim * 0.5;

    // 3. Compute safe camera inspection distance
    const safeDistance = Math.max(radius * 2.3, 1.8);

    // 4. Determine camera approach angle (preserve viewing orientation with slight elevation)
    const viewDir = new THREE.Vector3().subVectors(this.camera.position, center);
    if (viewDir.lengthSq() < 0.001) {
      viewDir.set(1, 0.65, 1.2);
    }
    viewDir.normalize();

    // Ensure camera stays comfortably elevated
    if (viewDir.y < 0.25) viewDir.y = 0.35;
    viewDir.normalize();

    const targetCameraPos = new THREE.Vector3().copy(center).addScaledVector(viewDir, safeDistance);

    // 5. Setup interpolation
    this.startPos.copy(this.camera.position);
    this.targetPos.copy(targetCameraPos);

    this.startTarget.copy(this.controls ? this.controls.target : this.overviewTarget);
    this.targetTarget.copy(center);

    this.duration = duration;
    this.startTime = performance.now();
    this.onCompleteCallback = onComplete;
    this.animating = true;
    appState.isCameraAnimating = true;

    // Temporarily disarm controls during automated motion
    if (this.controls) {
      this.controls.enabled = false;
    }

    console.log(`[CameraFocus] Focusing on component at center (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
  }

  /**
   * Smoothly return camera to default overview
   */
  reset(duration = 900, onComplete = null) {
    if (this.animating) {
      this.cancel();
    }

    this.startPos.copy(this.camera.position);
    this.targetPos.copy(this.overviewPosition);

    this.startTarget.copy(this.controls ? this.controls.target : new THREE.Vector3(0, 0, 0));
    this.targetTarget.copy(this.overviewTarget);

    this.duration = duration;
    this.startTime = performance.now();
    this.onCompleteCallback = onComplete;
    this.animating = true;
    appState.isCameraAnimating = true;

    if (this.controls) {
      this.controls.enabled = false;
    }

    console.log('[CameraFocus] Resetting camera to overview.');
  }

  /**
   * Interpolate camera and controls target in the central animation loop
   */
  update(currentTime = performance.now()) {
    if (!this.animating) return;

    const elapsed = currentTime - this.startTime;
    const progress = Math.min(1.0, elapsed / this.duration);
    const eased = this.easeInOutCubic(progress);

    // Interpolate camera position and OrbitControls target
    this.camera.position.lerpVectors(this.startPos, this.targetPos, eased);

    if (this.controls) {
      this.controls.target.lerpVectors(this.startTarget, this.targetTarget, eased);
    } else {
      this.camera.lookAt(this.targetTarget);
    }

    // Animation complete
    if (progress >= 1.0) {
      this.animating = false;
      appState.isCameraAnimating = false;

      if (this.controls) {
        this.controls.target.copy(this.targetTarget);
        this.controls.enabled = true;
        this.controls.update();
      }

      if (this.onCompleteCallback) {
        this.onCompleteCallback();
        this.onCompleteCallback = null;
      }
    }
  }

  cancel() {
    this.animating = false;
    appState.isCameraAnimating = false;
    if (this.controls) {
      this.controls.enabled = true;
    }
  }

  isAnimating() {
    return this.animating;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
