import * as THREE from 'three';

/**
 * Lighting.js
 * Owns balanced studio lighting configuration:
 * - Hemisphere light for ambient bounce and ground fill
 * - Key directional light with soft shadow mapping
 * - Fill directional light for contrast balance
 * - Cool rim light for industrial depth and silhouette separation
 */
export class Lighting {
  constructor(scene) {
    this.lights = [];
    if (scene) {
      this.setup(scene);
    }
  }

  setup(scene) {
    // 1. Ambient Hemisphere (Sky + Floor Bounce)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x223048, 1.1);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    this.lights.push(hemiLight);

    // 2. Main Key Directional Light (with shadow mapping)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(6, 10, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);
    this.lights.push(keyLight);

    // 3. Fill Light (softer, cool studio tone for shadow relief)
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.0);
    fillLight.position.set(-6, 5, -4);
    scene.add(fillLight);
    this.lights.push(fillLight);

    // 4. Subtle Rim / Accent Light (separates dark edges from studio background)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(0, 4, -8);
    scene.add(rimLight);
    this.lights.push(rimLight);
  }
}

