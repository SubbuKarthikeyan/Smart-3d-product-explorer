import * as THREE from 'three';

/**
 * SceneManager.js
 * Owns THREE.Scene, studio grid room environment, depth fog,
 * and isolates the primary scene graph and product root container.
 */
export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    
    // High-contrast modern studio background & depth fog
    const bgColor = 0x161c28;
    this.scene.background = new THREE.Color(bgColor);
    this.scene.fog = new THREE.FogExp2(bgColor, 0.028);

    // Studio Environment (Grid Room & Shadow Plane)
    this.environmentGroup = new THREE.Group();
    this.environmentGroup.name = 'StudioEnvironment';
    this._buildStudioGridRoom();
    this.scene.add(this.environmentGroup);

    // Dedicated ProductRoot container for model and components
    this.productRoot = new THREE.Group();
    this.productRoot.name = 'ProductRoot';
    this.scene.add(this.productRoot);
  }

  _buildStudioGridRoom() {
    const floorY = -1.6;

    // 1. Primary Grid with Cyan Centerlines
    const primaryGrid = new THREE.GridHelper(36, 36, 0x06b6d4, 0x25334a);
    primaryGrid.position.y = floorY;
    primaryGrid.material.opacity = 0.75;
    primaryGrid.material.transparent = true;
    this.environmentGroup.add(primaryGrid);

    // 2. High-precision secondary sub-grid for tech/industrial depth
    const subGrid = new THREE.GridHelper(36, 72, 0x0284c7, 0x1b2434);
    subGrid.position.y = floorY - 0.002;
    subGrid.material.opacity = 0.35;
    subGrid.material.transparent = true;
    this.environmentGroup.add(subGrid);

    // 3. Shadow-receiving floor plane for soft grounding contact shadows
    const shadowPlaneGeo = new THREE.PlaneGeometry(60, 60);
    const shadowPlaneMat = new THREE.ShadowMaterial({
      opacity: 0.4
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = floorY - 0.005;
    shadowPlane.receiveShadow = true;
    this.environmentGroup.add(shadowPlane);

    // 4. Subtle studio matte floor disk for soft underglow
    const diskGeo = new THREE.RingGeometry(0, 18, 64);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0x1c2436,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });
    const floorDisk = new THREE.Mesh(diskGeo, diskMat);
    floorDisk.rotation.x = -Math.PI / 2;
    floorDisk.position.y = floorY - 0.01;
    this.environmentGroup.add(floorDisk);
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

