import * as THREE from 'three';

/**
 * HotspotManager.js
 * Owns 3D hotspot beacons, interactive visual states (Default, Hover, Selected),
 * dynamic position tracking with moving/exploded components, and rhythmic idle pulse animation.
 */
export class HotspotManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'HotspotGroup';

    // Map: componentId -> { hotspotObject, innerDot, outerRing, baseScale, componentNode }
    this.hotspots = new Map();
    this.selectedComponentId = null;
    this.hoveredComponentId = null;

    if (scene) {
      scene.add(this.group);
    }
  }

  getGroup() {
    return this.group;
  }

  /**
   * Create hotspots from component definitions and attach to the 3D model
   * @param {Array<Object>} componentList - Metadata array
   * @param {ComponentManager} componentManager - Registry containing 3D object nodes
   */
  createHotspots(componentList, componentManager) {
    this.clear();

    componentList.forEach((comp) => {
      let position = new THREE.Vector3(0, 0, 0);
      let targetNode = null;

      const entry = componentManager.getComponentEntry(comp.id);
      if (entry && entry.object3D) {
        targetNode = entry.object3D;
        const box = new THREE.Box3().setFromObject(targetNode);
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3());
          position.copy(center);
          position.y += Math.max(0.2, (box.max.y - box.min.y) * 0.25);
        }
      } else if (comp.hotspotPosition) {
        position.set(comp.hotspotPosition.x, comp.hotspotPosition.y, comp.hotspotPosition.z);
      }

      const hotspot = this.buildHotspotMesh(comp.id, position, targetNode);
      this.group.add(hotspot.root);
      this.hotspots.set(comp.id, hotspot);
    });

    console.log(`[HotspotManager] Created ${this.hotspots.size} 3D interactive beacons.`);
  }

  buildHotspotMesh(componentId, position, targetNode) {
    const root = new THREE.Group();
    root.name = `Hotspot_${componentId}`;
    root.position.copy(position);
    root.userData = { componentId, isHotspot: true };

    // 1. Inner core dot (sphere)
    const dotGeom = new THREE.SphereGeometry(0.08, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.95
    });
    const innerDot = new THREE.Mesh(dotGeom, dotMat);
    innerDot.userData = { componentId, isHotspot: true };
    root.add(innerDot);

    // 2. Outer pulse ring (torus)
    const ringGeom = new THREE.TorusGeometry(0.16, 0.02, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65
    });
    const outerRing = new THREE.Mesh(ringGeom, ringMat);
    outerRing.userData = { componentId, isHotspot: true };
    root.add(outerRing);

    return {
      root,
      innerDot,
      outerRing,
      dotMat,
      ringMat,
      targetNode,
      baseScale: 1.0
    };
  }

  getHotspotMeshes() {
    const meshes = [];
    this.hotspots.forEach((h) => {
      meshes.push(h.innerDot);
      meshes.push(h.outerRing);
    });
    return meshes;
  }

  setHovered(componentId) {
    this.hoveredComponentId = componentId;
    this.updateVisualStates();
  }

  clearHover() {
    this.hoveredComponentId = null;
    this.updateVisualStates();
  }

  setSelected(componentId) {
    this.selectedComponentId = componentId;
    this.updateVisualStates();
  }

  clearSelection() {
    this.selectedComponentId = null;
    this.updateVisualStates();
  }

  updateVisualStates() {
    this.hotspots.forEach((h, id) => {
      const isSelected = id === this.selectedComponentId;
      const isHovered = id === this.hoveredComponentId;

      if (isSelected) {
        h.dotMat.color.setHex(0xffffff);
        h.ringMat.color.setHex(0x06b6d4);
        h.ringMat.opacity = 0.95;
        h.baseScale = 1.35;
      } else if (isHovered) {
        h.dotMat.color.setHex(0x38bdf8);
        h.ringMat.color.setHex(0x06b6d4);
        h.ringMat.opacity = 0.85;
        h.baseScale = 1.2;
      } else {
        h.dotMat.color.setHex(0x06b6d4);
        h.ringMat.color.setHex(0x38bdf8);
        h.ringMat.opacity = 0.6;
        h.baseScale = 1.0;
      }
    });
  }

  /**
   * Central animation loop update:
   * - Tracks moving/exploded component node positions
   * - Billboards toward camera
   * - Applies rhythmic breathing pulse
   */
  update(camera, time = performance.now() * 0.001) {
    if (!camera) return;

    this.hotspots.forEach((h) => {
      // 1. Follow component world position dynamically
      if (h.targetNode) {
        const box = new THREE.Box3().setFromObject(h.targetNode);
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3());
          center.y += Math.max(0.2, (box.max.y - box.min.y) * 0.25);
          h.root.position.copy(center);
        }
      }

      // 2. Billboard hotspots to face the active camera
      h.root.quaternion.copy(camera.quaternion);

      // 3. Subtle rhythmic pulse on outer ring
      const pulse = Math.sin(time * 3.0) * 0.12 + 1.0;
      h.root.scale.setScalar(h.baseScale * pulse);
    });
  }

  clear() {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.hotspots.clear();
  }
}
