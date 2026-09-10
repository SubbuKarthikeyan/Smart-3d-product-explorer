import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * ModelLoader.js
 * Owns GLTF model loading, mesh traversal, shadow configuration,
 * automated bounding box normalization, and fallback procedural product generation.
 */
export class ModelLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.loadedModel = null;
    this.metadata = null;
  }

  /**
   * Load a GLTF/GLB product model into the provided ProductRoot
   * @param {string} url - Path to the model (e.g. '/models/product.glb')
   * @param {THREE.Group} productRoot - Container group for the product
   * @param {Function} [onProgress] - Optional progress callback
   * @returns {Promise<Object>} Model metadata and root object
   */
  async load(url = '/models/product.glb', productRoot, onProgress = null) {
    try {
      const gltf = await new Promise((resolve, reject) => {
        this.loader.load(
          url,
          resolve,
          (xhr) => {
            if (onProgress && xhr.total > 0) {
              onProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          reject
        );
      });

      const model = gltf.scene;

      // 1. Shadow configuration
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.side = THREE.FrontSide;
          }
        }
      });

      // 2. Normalization (center & scale)
      const normalization = this.normalizeModel(model, 3.5);

      // 3. Inspect hierarchy
      this.inspectNodes(model);

      productRoot.add(model);
      this.loadedModel = model;
      this.metadata = {
        model,
        isFallback: false,
        ...normalization
      };

      console.log(`[ModelLoader] GLB model '${url}' loaded and normalized successfully.`);
      return this.metadata;
    } catch (error) {
      const isEngine = url.toLowerCase().includes('engine');
      const modelLabel = isEngine ? 'Engine Assembly' : 'Demo Product Model';

      console.warn(
        `[ModelLoader] Notice: '${url}' was not found (${error.message}). Building procedural 3D ${modelLabel}...`
      );

      const fallbackModel = isEngine
        ? this.createProceduralEngine()
        : this.createProceduralProduct();

      const normalization = this.normalizeModel(fallbackModel, 3.5);
      this.inspectNodes(fallbackModel);

      productRoot.add(fallbackModel);
      this.loadedModel = fallbackModel;
      this.metadata = {
        model: fallbackModel,
        isFallback: true,
        ...normalization
      };

      return this.metadata;
    }
  }

  /**
   * Center model to origin and normalize maximum dimension to targetSize
   */
  normalizeModel(model, targetSize = 3.5) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center model at origin
    model.position.x -= center.x;
    model.position.y -= center.y;
    model.position.z -= center.z;

    // Uniformly scale model
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = targetSize / maxDim;
      model.scale.multiplyScalar(scale);
    }

    // Recompute final bounding box
    const finalBox = new THREE.Box3().setFromObject(model);
    const finalCenter = finalBox.getCenter(new THREE.Vector3());
    const finalSize = finalBox.getSize(new THREE.Vector3());

    return {
      boundingBox: finalBox,
      center: finalCenter,
      size: finalSize
    };
  }

  /**
   * Inspect and log named nodes and meshes
   */
  inspectNodes(model) {
    const nodes = [];
    model.traverse((child) => {
      if (child.name) {
        nodes.push({ name: child.name, type: child.type });
      }
    });
    console.log('[ModelLoader] Model Node Hierarchy:', nodes);
  }

  /**
   * High-precision procedural multi-part product model
   * Creates named components: MainBody, Engine, Battery, CoolingSystem, ControlUnit
   */
  createProceduralProduct() {
    const productGroup = new THREE.Group();
    productGroup.name = 'ProceduralProduct';

    // Materials
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25
    });

    const engineMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.2
    });

    const batteryMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.7,
      roughness: 0.35
    });

    const coolingMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.4
    });

    const controlMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.6,
      roughness: 0.3
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
      roughness: 0.1
    });

    // 1. MainBody
    const mainBody = new THREE.Group();
    mainBody.name = 'MainBody';

    const fuselageGeom = new THREE.CylinderGeometry(0.7, 0.9, 2.4, 32);
    const fuselage = new THREE.Mesh(fuselageGeom, chassisMat);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    mainBody.add(fuselage);

    const noseGeom = new THREE.ConeGeometry(0.7, 1.0, 32);
    const nose = new THREE.Mesh(noseGeom, chassisMat);
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 1.7;
    nose.castShadow = true;
    nose.receiveShadow = true;
    mainBody.add(nose);
    productGroup.add(mainBody);

    // 2. Engine (Dual turbine thrusters)
    const engine = new THREE.Group();
    engine.name = 'Engine';

    const thrusterGeom = new THREE.CylinderGeometry(0.35, 0.4, 1.2, 24);
    const thrusterLeft = new THREE.Mesh(thrusterGeom, engineMat);
    thrusterLeft.rotation.z = Math.PI / 2;
    thrusterLeft.position.set(-1.4, 0.4, 0.65);
    thrusterLeft.castShadow = true;
    thrusterLeft.receiveShadow = true;
    engine.add(thrusterLeft);

    const thrusterRight = thrusterLeft.clone();
    thrusterRight.position.set(-1.4, 0.4, -0.65);
    engine.add(thrusterRight);

    // Thruster ring accents
    const ringGeom = new THREE.TorusGeometry(0.4, 0.04, 16, 32);
    const ringLeft = new THREE.Mesh(ringGeom, accentMat);
    ringLeft.rotation.y = Math.PI / 2;
    ringLeft.position.set(-2.0, 0.4, 0.65);
    engine.add(ringLeft);

    const ringRight = ringLeft.clone();
    ringRight.position.set(-2.0, 0.4, -0.65);
    engine.add(ringRight);
    productGroup.add(engine);

    // 3. Battery (Modular Power Core)
    const battery = new THREE.Group();
    battery.name = 'Battery';

    const packGeom = new THREE.BoxGeometry(1.2, 0.45, 1.1);
    const pack = new THREE.Mesh(packGeom, batteryMat);
    pack.position.set(-0.2, -0.75, 0);
    pack.castShadow = true;
    pack.receiveShadow = true;
    battery.add(pack);

    // Battery cell indicator ribs
    for (let i = -0.4; i <= 0.4; i += 0.2) {
      const ribGeom = new THREE.BoxGeometry(0.08, 0.48, 1.14);
      const rib = new THREE.Mesh(ribGeom, accentMat);
      rib.position.set(i, -0.75, 0);
      battery.add(rib);
    }
    productGroup.add(battery);

    // 4. CoolingSystem (Intercooler Radiator Fins)
    const cooling = new THREE.Group();
    cooling.name = 'CoolingSystem';

    for (let i = 0; i < 7; i++) {
      const finGeom = new THREE.BoxGeometry(0.06, 0.6, 1.4);
      const fin = new THREE.Mesh(finGeom, coolingMat);
      fin.position.set(-0.6 + i * 0.18, 0.7, 0);
      fin.castShadow = true;
      fin.receiveShadow = true;
      cooling.add(fin);
    }
    productGroup.add(cooling);

    // 5. ControlUnit (Avionics & Sensor Dome)
    const control = new THREE.Group();
    control.name = 'ControlUnit';

    const domeGeom = new THREE.SphereGeometry(0.45, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeom, controlMat);
    dome.position.set(0.6, 0.65, 0);
    dome.castShadow = true;
    dome.receiveShadow = true;
    control.add(dome);

    const sensorRingGeom = new THREE.TorusGeometry(0.3, 0.03, 16, 32);
    const sensorRing = new THREE.Mesh(sensorRingGeom, accentMat);
    sensorRing.rotation.x = Math.PI / 2;
    sensorRing.position.set(0.6, 1.0, 0);
    control.add(sensorRing);
    productGroup.add(control);

    return productGroup;
  }

  /**
   * High-precision procedural engine assembly model
   * Creates named components: TurbineFan, CompressorCore, CombustionChamber, ExhaustNozzle, BypassNacelle
   */
  createProceduralEngine() {
    const engineGroup = new THREE.Group();
    engineGroup.name = 'ProceduralEngine';

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.2
    });

    const alloyDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.3
    });

    const copperGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.8,
      roughness: 0.25
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.5,
      roughness: 0.4
    });

    const cyanGlowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
      roughness: 0.1
    });

    // 1. BypassNacelle (Outer casing)
    const nacelleGroup = new THREE.Group();
    nacelleGroup.name = 'BypassNacelle';

    const outerCowlGeom = new THREE.CylinderGeometry(1.2, 1.1, 2.6, 32, 1, true);
    const outerCowl = new THREE.Mesh(outerCowlGeom, carbonMat);
    outerCowl.rotation.z = Math.PI / 2;
    outerCowl.castShadow = true;
    outerCowl.receiveShadow = true;
    nacelleGroup.add(outerCowl);

    const cowlLipGeom = new THREE.TorusGeometry(1.2, 0.08, 16, 32);
    const cowlLip = new THREE.Mesh(cowlLipGeom, titaniumMat);
    cowlLip.rotation.y = Math.PI / 2;
    cowlLip.position.x = 1.3;
    nacelleGroup.add(cowlLip);
    engineGroup.add(nacelleGroup);

    // 2. TurbineFan (Front intake fan blades & spinner cone)
    const fanGroup = new THREE.Group();
    fanGroup.name = 'TurbineFan';

    const coneGeom = new THREE.ConeGeometry(0.35, 0.8, 24);
    const spinner = new THREE.Mesh(coneGeom, titaniumMat);
    spinner.rotation.z = -Math.PI / 2;
    spinner.position.x = 1.35;
    fanGroup.add(spinner);

    // Radial fan blades
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const bladeGeom = new THREE.BoxGeometry(0.04, 0.75, 0.18);
      const blade = new THREE.Mesh(bladeGeom, titaniumMat);
      blade.position.set(1.0, Math.sin(angle) * 0.65, Math.cos(angle) * 0.65);
      blade.rotation.x = angle;
      blade.rotation.y = 0.35;
      fanGroup.add(blade);
    }
    engineGroup.add(fanGroup);

    // 3. CompressorCore (Multi-stage axial compressor)
    const compressorGroup = new THREE.Group();
    compressorGroup.name = 'CompressorCore';

    const coreShaftGeom = new THREE.CylinderGeometry(0.45, 0.5, 1.2, 24);
    const coreShaft = new THREE.Mesh(coreShaftGeom, alloyDarkMat);
    coreShaft.rotation.z = Math.PI / 2;
    coreShaft.position.x = 0.3;
    compressorGroup.add(coreShaft);

    for (let s = -0.2; s <= 0.8; s += 0.25) {
      const stageRingGeom = new THREE.TorusGeometry(0.65, 0.04, 12, 24);
      const stageRing = new THREE.Mesh(stageRingGeom, cyanGlowMat);
      stageRing.rotation.y = Math.PI / 2;
      stageRing.position.x = s;
      compressorGroup.add(stageRing);
    }
    engineGroup.add(compressorGroup);

    // 4. CombustionChamber (Fuel injectors & burn rings)
    const combustionGroup = new THREE.Group();
    combustionGroup.name = 'CombustionChamber';

    const chamberGeom = new THREE.CylinderGeometry(0.55, 0.52, 0.9, 24);
    const chamber = new THREE.Mesh(chamberGeom, copperGoldMat);
    chamber.rotation.z = Math.PI / 2;
    chamber.position.x = -0.7;
    chamber.castShadow = true;
    chamberGroup.add(chamber);

    // Fuel manifold pipes
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const pipeGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8);
      const pipe = new THREE.Mesh(pipeGeom, copperGoldMat);
      pipe.position.set(-0.7, Math.sin(angle) * 0.68, Math.cos(angle) * 0.68);
      pipe.rotation.z = Math.PI / 2;
      combustionGroup.add(pipe);
    }
    engineGroup.add(combustionGroup);

    // 5. ExhaustNozzle (Variable geometry vectoring nozzle)
    const nozzleGroup = new THREE.Group();
    nozzleGroup.name = 'ExhaustNozzle';

    const nozzleGeom = new THREE.ConeGeometry(0.65, 0.9, 24, 1, true);
    const nozzle = new THREE.Mesh(nozzleGeom, alloyDarkMat);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.x = -1.6;
    nozzle.castShadow = true;
    nozzleGroup.add(nozzle);

    const glowRingGeom = new THREE.TorusGeometry(0.42, 0.05, 16, 32);
    const glowRing = new THREE.Mesh(glowRingGeom, cyanGlowMat);
    glowRing.rotation.y = Math.PI / 2;
    glowRing.position.x = -2.0;
    nozzleGroup.add(glowRing);
    engineGroup.add(nozzleGroup);

    return engineGroup;
  }
}
