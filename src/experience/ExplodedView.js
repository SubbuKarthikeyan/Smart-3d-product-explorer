import * as THREE from 'three';
import { appState } from '../state/AppState.js';

/**
 * ExplodedView.js
 * Owns spatial product decomposition, original transform caching,
 * data-driven and radial exploded target calculations,
 * smooth cubic easing animation, and mid-animation reversing.
 */
export class ExplodedView {
  constructor(componentManager) {
    this.componentManager = componentManager;

    // Registries
    this.originalTransforms = new Map(); // componentId -> { position, rotation, scale }
    this.explodedTransforms = new Map(); // componentId -> Vector3
    this.startPositions = new Map(); // componentId -> Vector3 (dynamically captured at animation start)

    // Animation state
    this.animating = false;
    this.animationMode = null; // 'explode' | 'reassemble' | null
    this.startTime = 0;
    this.duration = 800; // ms
    this.onCompleteCallback = null;
    this.onStateChangeCallbacks = [];
  }

  /**
   * Initialize transform caches after product model is loaded
   * @param {THREE.Group} productRoot - The product root container
   */
  init(productRoot) {
    if (!this.componentManager) return;

    this.originalTransforms.clear();
    this.explodedTransforms.clear();

    const productBox = new THREE.Box3().setFromObject(productRoot);
    const productCenter = productBox.getCenter(new THREE.Vector3());

    this.componentManager.components.forEach((entry, id) => {
      const obj = entry.object3D;
      if (!obj) return;

      // 1. Capture exact original local transform once
      this.originalTransforms.set(id, {
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale: obj.scale.clone()
      });

      // 2. Compute exploded target position
      const meta = entry.metadata;
      let targetPos = new THREE.Vector3();

      if (meta && meta.explodedPosition) {
        // Use explicitly defined exploded metadata if available
        targetPos.set(meta.explodedPosition.x, meta.explodedPosition.y, meta.explodedPosition.z);
      } else {
        // Compute radial outward displacement
        const compBox = new THREE.Box3().setFromObject(obj);
        const compCenter = compBox.getCenter(new THREE.Vector3());

        const dir = new THREE.Vector3().subVectors(compCenter, productCenter);
        if (dir.lengthSq() < 0.001) {
          dir.set(0, 1, 0); // Safe upward fallback
        }
        dir.normalize();

        targetPos.copy(obj.position).addScaledVector(dir, 1.4);
      }

      this.explodedTransforms.set(id, targetPos);
    });

    console.log(`[ExplodedView] Initialized transform targets for ${this.originalTransforms.size} components.`);
  }

  /**
   * Explode product into separated component positions
   */
  explode(duration = 800, onComplete = null) {
    if (this.animating && this.animationMode === 'explode') return;

    this.startAnimation('explode', duration, onComplete);
  }

  /**
   * Reassemble product back to original positions
   */
  reassemble(duration = 800, onComplete = null) {
    if (this.animating && this.animationMode === 'reassemble') return;

    this.startAnimation('reassemble', duration, onComplete);
  }

  /**
   * Toggle between exploded and assembled states
   */
  toggle(duration = 800) {
    if (appState.isExploded || this.animationMode === 'explode') {
      this.reassemble(duration);
    } else {
      this.explode(duration);
    }
  }

  startAnimation(mode, duration, onComplete) {
    // Capture current positions as starting positions to ensure smooth reversal even mid-flight
    this.startPositions.clear();
    this.componentManager.components.forEach((entry, id) => {
      if (entry.object3D) {
        this.startPositions.set(id, entry.object3D.position.clone());
      }
    });

    this.animationMode = mode;
    this.duration = duration;
    this.startTime = performance.now();
    this.onCompleteCallback = onComplete;
    this.animating = true;

    // Notify listeners immediately of mode intent
    this.notifyStateChange(mode === 'explode');
    console.log(`[ExplodedView] Starting ${mode} animation (${duration}ms).`);
  }

  /**
   * Immediate reset restoring original transforms
   */
  reset() {
    this.animating = false;
    this.animationMode = null;
    appState.isExploded = false;

    this.originalTransforms.forEach((orig, id) => {
      const entry = this.componentManager.getComponentEntry(id);
      if (entry && entry.object3D) {
        entry.object3D.position.copy(orig.position);
        entry.object3D.rotation.copy(orig.rotation);
        entry.object3D.scale.copy(orig.scale);
      }
    });

    this.notifyStateChange(false);
    console.log('[ExplodedView] Restored original assembled transforms.');
  }

  /**
   * Update component transforms inside central animation loop
   */
  update(currentTime = performance.now()) {
    if (!this.animating) return;

    const elapsed = currentTime - this.startTime;
    const progress = Math.min(1.0, elapsed / this.duration);
    const eased = this.easeInOutCubic(progress);

    const isExploding = this.animationMode === 'explode';

    this.componentManager.components.forEach((entry, id) => {
      const obj = entry.object3D;
      const startPos = this.startPositions.get(id);
      const targetPos = isExploding
        ? this.explodedTransforms.get(id)
        : this.originalTransforms.get(id)?.position;

      if (obj && startPos && targetPos) {
        obj.position.lerpVectors(startPos, targetPos, eased);
      }
    });

    if (progress >= 1.0) {
      this.animating = false;
      appState.isExploded = isExploding;
      this.animationMode = null;

      // Final snap to ensure zero precision drift
      this.componentManager.components.forEach((entry, id) => {
        const obj = entry.object3D;
        const finalTarget = isExploding
          ? this.explodedTransforms.get(id)
          : this.originalTransforms.get(id)?.position;

        if (obj && finalTarget) {
          obj.position.copy(finalTarget);
        }
      });

      if (this.onCompleteCallback) {
        this.onCompleteCallback();
        this.onCompleteCallback = null;
      }

      console.log(`[ExplodedView] ${isExploding ? 'Explosion' : 'Reassembly'} complete.`);
    }
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  onStateChange(cb) {
    this.onStateChangeCallbacks.push(cb);
  }

  notifyStateChange(isExploded) {
    this.onStateChangeCallbacks.forEach((cb) => cb(isExploded));
  }
}
