import * as THREE from 'three';

/**
 * Renderer.js
 * Owns WebGLRenderer instance, pixel ratio capping, shadow map setup, and tone mapping.
 */
export class Renderer {
  /**
   * Check if WebGL is available in the current browser environment
   */
  static isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2'))
      );
    } catch {
      return false;
    }
  }

  constructor(container) {
    this.container = container;

    if (!Renderer.isWebGLAvailable()) {
      throw new Error('WebGL is not available in this browser.');
    }

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    // PBR Color and Tone Mapping
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Shadow mapping
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Sizing & Device Pixel Ratio capping
    this.setPixelRatio();
    this.resize(
      container ? container.clientWidth : window.innerWidth,
      container ? container.clientHeight : window.innerHeight
    );

    if (this.container) {
      this.container.appendChild(this.renderer.domElement);
    }
  }

  setPixelRatio() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  getRenderer() {
    return this.renderer;
  }

  getDomElement() {
    return this.renderer.domElement;
  }

  resize(width, height) {
    if (width === 0 || height === 0) return;
    this.setPixelRatio();
    this.renderer.setSize(width, height);
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }
}
