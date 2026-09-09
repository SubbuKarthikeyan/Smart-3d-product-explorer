import * as THREE from 'three';

/**
 * SceneRaycaster (Raycaster.js)
 * Owns 3D raycasting, pointer normalization against canvas client rect,
 * prioritized intersection resolution (Hotspots > Component Meshes),
 * hover detection, cursor feedback, and click selection/deselection.
 */
export class SceneRaycaster {
  constructor(container, cameraManager, componentManager, hotspotManager) {
    this.container = container;
    this.cameraManager = cameraManager;
    this.componentManager = componentManager;
    this.hotspotManager = hotspotManager;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-1000, -1000); // Offscreen initially
    this.isPointerInside = false;

    // Track pointer movement to differentiate click from drag (OrbitControls)
    this.pointerDownPos = new THREE.Vector2();
    this.dragThreshold = 5; // pixels

    this.initEventListeners();
  }

  initEventListeners() {
    if (!this.container) return;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);

    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointerup', this.onPointerUp);
    this.container.addEventListener('pointerleave', this.onPointerLeave);
  }

  updatePointerCoords(event) {
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.isPointerInside = true;
  }

  onPointerMove(event) {
    this.updatePointerCoords(event);

    const hit = this.performRaycast();

    if (hit && hit.componentId) {
      this.container.classList.add('pointer-hover');
      this.componentManager.setHovered(hit.componentId);
      if (this.hotspotManager) {
        this.hotspotManager.setHovered(hit.componentId);
      }
    } else {
      this.container.classList.remove('pointer-hover');
      this.componentManager.clearHover();
      if (this.hotspotManager) {
        this.hotspotManager.clearHover();
      }
    }
  }

  onPointerDown(event) {
    this.pointerDownPos.set(event.clientX, event.clientY);
  }

  onPointerUp(event) {
    // Check if the pointer was dragged (e.g. orbit rotation) vs single click
    const deltaX = Math.abs(event.clientX - this.pointerDownPos.x);
    const deltaY = Math.abs(event.clientY - this.pointerDownPos.y);

    if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
      return; // Was an orbit drag, skip click selection
    }

    this.updatePointerCoords(event);
    const hit = this.performRaycast();

    if (hit && hit.componentId) {
      this.componentManager.selectComponent(hit.componentId);
      if (this.hotspotManager) {
        this.hotspotManager.setSelected(hit.componentId);
      }
    } else {
      // Clicked on empty scene space -> deselect
      this.componentManager.deselectComponent();
      if (this.hotspotManager) {
        this.hotspotManager.clearSelection();
      }
    }
  }

  onPointerLeave() {
    this.isPointerInside = false;
    this.pointer.set(-1000, -1000);
    this.container.classList.remove('pointer-hover');
    this.componentManager.clearHover();
    if (this.hotspotManager) {
      this.hotspotManager.clearHover();
    }
  }

  /**
   * Perform raycast test with priority:
   * 1. Hotspots
   * 2. Registered component meshes
   */
  performRaycast() {
    if (!this.cameraManager || !this.isPointerInside) return null;

    const camera = this.cameraManager.getCamera();
    this.raycaster.setFromCamera(this.pointer, camera);

    // 1. Check Hotspots (Highest priority)
    if (this.hotspotManager) {
      const hotspotMeshes = this.hotspotManager.getHotspotMeshes();
      if (hotspotMeshes.length > 0) {
        const hotspotHits = this.raycaster.intersectObjects(hotspotMeshes, false);
        if (hotspotHits.length > 0) {
          const hitObj = hotspotHits[0].object;
          if (hitObj.userData && hitObj.userData.componentId) {
            return {
              type: 'hotspot',
              componentId: hitObj.userData.componentId,
              object: hitObj
            };
          }
        }
      }
    }

    // 2. Check Registered Component Meshes
    const componentMeshes = this.componentManager.getInteractiveMeshes();
    if (componentMeshes.length > 0) {
      const meshHits = this.raycaster.intersectObjects(componentMeshes, true);
      if (meshHits.length > 0) {
        const hitMesh = meshHits[0].object;
        const component = this.componentManager.getComponentFromObject(hitMesh);
        if (component) {
          return {
            type: 'component',
            componentId: component.id,
            object: hitMesh
          };
        }
      }
    }

    return null;
  }

  destroy() {
    if (this.container) {
      this.container.removeEventListener('pointermove', this.onPointerMove);
      this.container.removeEventListener('pointerdown', this.onPointerDown);
      this.container.removeEventListener('pointerup', this.onPointerUp);
      this.container.removeEventListener('pointerleave', this.onPointerLeave);
    }
  }
}
