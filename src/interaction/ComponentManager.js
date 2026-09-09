import * as THREE from 'three';
import { appState } from '../state/AppState.js';

/**
 * ComponentManager.js
 * Central source of truth for component registration, selection,
 * deselection, hover management, and safe reversible material highlighting.
 */
export class ComponentManager {
  constructor() {
    // Map: componentId -> { metadata, object3D, meshes: Array<{ mesh, originalEmissive, originalIntensity }> }
    this.components = new Map();
    // Map: Mesh -> componentId
    this.meshToComponent = new Map();

    this.selectedComponentId = null;
    this.hoveredComponentId = null;

    this.onSelectCallbacks = [];
    this.onDeselectCallbacks = [];
    this.onHoverCallbacks = [];
  }

  /**
   * Register a component and store safe original material states
   * @param {Object} metadata - ComponentData entry
   * @param {THREE.Object3D} object3D - Matching 3D node
   */
  registerComponent(metadata, object3D) {
    if (!metadata || !object3D) return;

    const meshes = [];

    object3D.traverse((child) => {
      if (child.isMesh) {
        // Clone material if needed to avoid shared highlight bleed
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map((mat) => mat.clone());
          } else {
            child.material = child.material.clone();
          }

          const primaryMat = Array.isArray(child.material) ? child.material[0] : child.material;

          meshes.push({
            mesh: child,
            hasEmissive: 'emissive' in primaryMat,
            originalEmissive: primaryMat.emissive ? primaryMat.emissive.clone() : new THREE.Color(0x000000),
            originalIntensity: primaryMat.emissiveIntensity || 0
          });

          child.userData.componentId = metadata.id;
          this.meshToComponent.set(child, metadata.id);
        }
      }
    });

    object3D.userData.componentId = metadata.id;

    this.components.set(metadata.id, {
      metadata,
      object3D,
      meshes
    });
  }

  getComponent(id) {
    const entry = this.components.get(id);
    return entry ? entry.metadata : null;
  }

  getComponentEntry(id) {
    return this.components.get(id) || null;
  }

  /**
   * Resolve an intersected object or its ancestors to a registered component
   */
  getComponentFromObject(object3D) {
    let current = object3D;
    while (current) {
      if (current.userData && current.userData.componentId) {
        return this.getComponent(current.userData.componentId);
      }
      if (this.meshToComponent.has(current)) {
        return this.getComponent(this.meshToComponent.get(current));
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * Get all registered meshes for raycasting
   */
  getInteractiveMeshes() {
    const allMeshes = [];
    this.components.forEach((entry) => {
      entry.meshes.forEach(({ mesh }) => {
        allMeshes.push(mesh);
      });
    });
    return allMeshes;
  }

  /**
   * Select a component by ID
   */
  selectComponent(id) {
    if (!id || !this.components.has(id)) {
      this.deselectComponent();
      return;
    }

    if (this.selectedComponentId === id) {
      return; // Already selected
    }

    // 1. Clear previous selection highlight
    if (this.selectedComponentId) {
      this.clearHighlight(this.selectedComponentId);
    }

    // 2. Set new selection
    this.selectedComponentId = id;
    appState.selectedComponent = id;

    // 3. Apply strong selection highlight
    this.applyHighlight(id, 0x06b6d4, 0.75);

    const component = this.getComponent(id);
    this.onSelectCallbacks.forEach((cb) => cb(component));

    console.log(`[ComponentManager] Selected component: ${component.name} (${id})`);
  }

  /**
   * Deselect active component
   */
  deselectComponent() {
    if (!this.selectedComponentId) return;

    const prevId = this.selectedComponentId;
    this.clearHighlight(prevId);

    this.selectedComponentId = null;
    appState.selectedComponent = null;

    this.onDeselectCallbacks.forEach((cb) => cb());
    console.log('[ComponentManager] Deselected component.');
  }

  /**
   * Set hovered component state
   */
  setHovered(id) {
    if (this.hoveredComponentId === id) return;

    // Clear previous hover (if not selected)
    if (this.hoveredComponentId && this.hoveredComponentId !== this.selectedComponentId) {
      this.clearHighlight(this.hoveredComponentId);
    }

    this.hoveredComponentId = id;
    appState.hoveredComponent = id;

    // Apply subtle hover highlight if component is not already selected
    if (id && id !== this.selectedComponentId && this.components.has(id)) {
      this.applyHighlight(id, 0x38bdf8, 0.35);
    }

    this.onHoverCallbacks.forEach((cb) => cb(id));
  }

  /**
   * Clear hovered component state
   */
  clearHover() {
    if (!this.hoveredComponentId) return;

    if (this.hoveredComponentId !== this.selectedComponentId) {
      this.clearHighlight(this.hoveredComponentId);
    }

    this.hoveredComponentId = null;
    appState.hoveredComponent = null;

    this.onHoverCallbacks.forEach((cb) => cb(null));
  }

  /**
   * Safely apply highlight to component meshes
   */
  applyHighlight(id, hexColor, intensity) {
    const entry = this.components.get(id);
    if (!entry) return;

    entry.meshes.forEach(({ mesh, hasEmissive }) => {
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (mat && hasEmissive) {
        mat.emissive.setHex(hexColor);
        mat.emissiveIntensity = intensity;
      }
    });
  }

  /**
   * Safely restore original materials
   */
  clearHighlight(id) {
    const entry = this.components.get(id);
    if (!entry) return;

    entry.meshes.forEach(({ mesh, hasEmissive, originalEmissive, originalIntensity }) => {
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (mat && hasEmissive) {
        mat.emissive.copy(originalEmissive);
        mat.emissiveIntensity = originalIntensity;
      }
    });
  }

  onSelect(cb) {
    this.onSelectCallbacks.push(cb);
  }

  onDeselect(cb) {
    this.onDeselectCallbacks.push(cb);
  }

  onHover(cb) {
    this.onHoverCallbacks.push(cb);
  }
}
