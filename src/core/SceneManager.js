import * as THREE from 'three';

/**
 * SceneManager.js
 * Owns THREE.Scene and scene-level configuration.
 * Isolates the primary scene graph and product root container.
 */
export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);

    // Dedicated ProductRoot container for model and components
    this.productRoot = new THREE.Group();
    this.productRoot.name = 'ProductRoot';
    this.scene.add(this.productRoot);
  }

  getScene() {
    return this.scene;
  }

  getProductRoot() {
    return this.productRoot;
  }

  clearProduct() {
    while (this.productRoot.children.length > 0) {
      const child = this.productRoot.children[0];
      this.productRoot.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  }
}
