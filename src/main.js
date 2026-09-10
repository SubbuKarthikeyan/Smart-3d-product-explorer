import './styles/main.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SceneManager } from './core/SceneManager.js';
import { CameraManager } from './core/CameraManager.js';
import { Renderer } from './core/Renderer.js';
import { Lighting } from './core/Lighting.js';

import { ModelLoader } from './model/ModelLoader.js';
import { getComponentsForModel } from './model/ComponentData.js';
import { ComponentManager } from './interaction/ComponentManager.js';
import { HotspotManager } from './interaction/HotspotManager.js';
import { SceneRaycaster } from './interaction/Raycaster.js';
import { CameraFocus } from './experience/CameraFocus.js';
import { ExplodedView } from './experience/ExplodedView.js';
import { GuidedTour } from './experience/GuidedTour.js';

import { InfoPanel } from './ui/InfoPanel.js';
import { Controls } from './ui/Controls.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { ModelSelector } from './ui/ModelSelector.js';
import { MODEL_CATALOG } from './model/ModelCatalog.js';
import { appState } from './state/AppState.js';

/**
 * Smart 3D Product Explorer — Phase V2.3 Bootstrap
 * Orchestrates multi-model component registration, interactive inspection,
 * 3D beacons, camera focus, dynamic loading, and model switching.
 */

class App {
  /**
   * @param {string} [modelPath] - GLB path to load (from model catalog selection).
   * @param {Function} [onChangeModel] - Callback to return to model selection.
   */
  constructor(modelPath = '/models/product.glb', onChangeModel = null) {
    this._modelPath = modelPath;
    this._onChangeModel = onChangeModel;
    this._modelType = (this._modelPath.toLowerCase().includes('engine') || appState.selectedModel?.type === 'engine' || appState.selectedModel?.id === 'engine') ? 'engine' : 'product';
    this._modelTitle = appState.selectedModel?.name || (this._modelType === 'engine' ? 'Engine Assembly' : 'Demo Product Model');
    this._animFrameId = null;
    this.container = document.getElementById('canvas-container');

    // 1. UI Loading Screen
    this.loadingScreen = new LoadingScreen();

    // 2. Pre-flight WebGL Check
    if (!Renderer.isWebGLAvailable()) {
      console.error('[App] WebGL is not available in this environment.');
      this.loadingScreen.showWebGLError();
      return;
    }

    this.loadingScreen.updateProgress(20, 'Initializing 3D renderer...');

    // 3. Core Three.js Systems
    this.sceneManager = new SceneManager();
    this.cameraManager = new CameraManager();
    this.renderer = new Renderer(this.container);
    this.lighting = new Lighting(this.sceneManager.getScene());

    // 4. OrbitControls
    this.controls = new OrbitControls(
      this.cameraManager.getCamera(),
      this.renderer.getDomElement()
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 25;
    this.controls.maxPolarAngle = Math.PI * 0.95;

    // 5. Experience & Interaction Managers
    this.cameraFocus = new CameraFocus(this.cameraManager.getCamera(), this.controls);
    this.componentManager = new ComponentManager();
    this.hotspotManager = new HotspotManager(this.sceneManager.getProductRoot());
    this.explodedView = new ExplodedView(this.componentManager);
    this.guidedTour = new GuidedTour(this.componentManager, this.cameraFocus);

    // 6. UI Presentation Layer
    this.infoPanel = new InfoPanel(
      () => this.componentManager.deselectComponent(),
      (comp) => {
        const entry = this.componentManager.getComponentEntry(comp.id);
        if (entry && entry.object3D) {
          this.cameraFocus.focusOn(entry.object3D);
        }
      },
      this._modelTitle
    );

    this.controlsUI = new Controls({
      onExplodeToggle: () => this.explodedView.toggle(),
      onTourStart: () => this.guidedTour.start(),
      onTourNext: () => this.guidedTour.next(),
      onTourPrev: () => this.guidedTour.previous(),
      onTourExit: () => this.guidedTour.stop(),
      onReset: () => this.resetApplication(),
      onChangeModel: () => this.destroyAndChangeModel()
    });

    // Sync Experience Managers with UI
    this.explodedView.onStateChange((isExploded) => {
      this.controlsUI.setExplodedState(isExploded);
    });

    this.guidedTour.onStepChange((current, total, step) => {
      this.controlsUI.setTourActive(true, current, total, step);
    });

    this.guidedTour.onTourEnd(() => {
      this.controlsUI.setTourActive(false);
    });

    this.componentManager.onSelect((comp) => {
      this.infoPanel.update(comp);
      this.hotspotManager.setSelected(comp.id);
    });

    this.componentManager.onDeselect(() => {
      this.infoPanel.reset();
      this.hotspotManager.clearSelection();
    });

    // 7. Model Loader & Raycaster
    this.modelLoader = new ModelLoader();
    this.raycaster = null;

    // 8. Event Listeners & Animation Loop
    this._onResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._onResize);

    this.animate = this.animate.bind(this);
    this._animFrameId = requestAnimationFrame(this.animate);

    // 9. Load Product/Engine Model & Initialize Systems
    this.initProduct();
  }

  async initProduct() {
    try {
      this.loadingScreen.clearError();
      this.loadingScreen.show();
      this.loadingScreen.updateProgress(35, `Loading ${this._modelTitle} geometry...`);

      // Clean product root and hotspots if this is a reload
      if (this.sceneManager) {
        this.sceneManager.clearProduct();
      }
      if (this.hotspotManager) {
        this.hotspotManager.clear();
      }

      const result = await this.modelLoader.load(
        this._modelPath,
        this.sceneManager.getProductRoot(),
        (percent) => {
          this.loadingScreen.updateProgress(35 + percent * 0.5, `Loading model (${percent}%)...`);
        }
      );

      this.loadingScreen.updateProgress(85, 'Configuring interactive systems & camera...');

      // Resolve model-specific component definitions
      const activeComponents = getComponentsForModel(this._modelType);

      // Map model nodes to components
      if (result && result.model) {
        this.registerModelComponents(result.model, activeComponents);
        this.hotspotManager.createHotspots(activeComponents, this.componentManager);
        this.explodedView.init(this.sceneManager.getProductRoot());

        if (this.raycaster) {
          this.raycaster.destroy();
        }

        this.raycaster = new SceneRaycaster(
          this.container,
          this.cameraManager,
          this.componentManager,
          this.hotspotManager
        );

        // Frame camera dynamically based on loaded model bounding box
        this.cameraManager.frameObject(this.sceneManager.getProductRoot(), this.controls);

        // Cache default overview camera state
        this.cameraFocus.setOverview(
          this.cameraManager.getCamera().position,
          this.controls.target
        );
      }

      this.loadingScreen.updateProgress(100, `${this._modelTitle} Ready`);
      appState.isLoading = false;
      this.loadingScreen.hide();

      console.log(`[Smart 3D Product Explorer] V2.3 — Explorer ready. Model: ${this._modelPath} (${this._modelType})`);
    } catch (err) {
      console.error('[App] Critical error during model initialization:', err);
      this.loadingScreen.showError(
        `Unable to load 3D model at "${this._modelPath}". Please verify asset availability.`,
        () => this.initProduct(),
        () => this.destroyAndChangeModel()
      );
    }
  }

  registerModelComponents(model, activeComponents = []) {
    activeComponents.forEach((compData) => {
      let matchedObject = null;

      model.traverse((child) => {
        if (child.name === compData.modelNode) {
          matchedObject = child;
        }
      });

      if (matchedObject) {
        this.componentManager.registerComponent(compData, matchedObject);
        console.log(`[App] Registered interactive node: '${compData.modelNode}' -> ${compData.name} (${compData.id})`);
      } else {
        console.warn(`[App] Component node '${compData.modelNode}' not in active model.`);
      }
    });
  }

  /**
   * Order-safe global experience reset
   */
  resetApplication() {
    console.log('[App] Executing Global Application Reset.');

    // 1. Stop active tour
    this.guidedTour.stop();

    // 2. Restore assembled transforms
    this.explodedView.reset();

    // 3. Clear component selection and hover
    this.componentManager.deselectComponent();
    this.componentManager.clearHover();

    // 4. Reset hotspots
    this.hotspotManager.clearSelection();
    this.hotspotManager.clearHover();

    // 5. Smoothly return camera to overview
    this.cameraFocus.reset(900);

    // 6. Reset UI
    this.infoPanel.reset();
    this.controlsUI.setExplodedState(false);
    this.controlsUI.setTourActive(false);

    // 7. Reset AppState
    appState.selectedComponent = null;
    appState.hoveredComponent = null;
    appState.isExploded = false;
    appState.isTourActive = false;
    appState.currentTourStep = -1;
  }

  _handleResize() {
    const width = this.container ? this.container.clientWidth : window.innerWidth;
    const height = this.container ? this.container.clientHeight : window.innerHeight;

    if (this.cameraManager) {
      this.cameraManager.updateAspect(width, height);
    }
    if (this.renderer) {
      this.renderer.resize(width, height);
    }
  }

  animate() {
    this._animFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();

    // 1. Update Guided Tour step progression
    if (this.guidedTour) {
      this.guidedTour.update(now);
    }

    // 2. Update Camera Focus transitions
    if (this.cameraFocus) {
      this.cameraFocus.update(now);
    }

    // 3. Update Exploded View transformations
    if (this.explodedView) {
      this.explodedView.update(now);
    }

    // 4. Update OrbitControls damping
    if (this.controls) {
      this.controls.update();
    }

    // 5. Update 3D hotspot pulsing, billboarding, and position tracking
    if (this.hotspotManager) {
      this.hotspotManager.update(this.cameraManager.getCamera());
    }

    // 6. Single central render call
    if (this.renderer && this.sceneManager && this.cameraManager) {
      this.renderer.render(
        this.sceneManager.getScene(),
        this.cameraManager.getCamera()
      );
    }
  }

  /**
   * Tear down this app instance and return to model selection
   */
  destroyAndChangeModel() {
    this.destroy();
    if (this._onChangeModel) {
      this._onChangeModel();
    }
  }

  /**
   * Clean up all Three.js and DOM resources
   */
  destroy() {
    console.log('[App] Destroying current 3D explorer instance and freeing resources...');

    // 1. Stop animation loop
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }

    // 2. Stop experience & interaction systems
    if (this.guidedTour) this.guidedTour.stop();
    if (this.explodedView) this.explodedView.reset();
    if (this.componentManager) this.componentManager.clear();
    if (this.hotspotManager) this.hotspotManager.clear();
    if (this.raycaster) this.raycaster.destroy();
    if (this.controls) this.controls.dispose();

    // 3. Dispose 3D model resources
    if (this.modelLoader && this.modelLoader.loadedModel) {
      disposeModelHierarchy(this.modelLoader.loadedModel);
    }

    // 4. Clear scene product container
    if (this.sceneManager) {
      this.sceneManager.clearProduct();
    }

    // 5. Remove renderer DOM element
    const canvas = this.renderer ? this.renderer.getDomElement() : null;
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    // 6. Remove window listeners
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
    }

    // 7. Destroy UI components
    if (this.infoPanel) this.infoPanel.destroy();
    if (this.controlsUI) this.controlsUI.destroy();
    if (this.loadingScreen) this.loadingScreen.destroy();

    // 8. Reset AppState explorer properties
    appState.selectedComponent = null;
    appState.hoveredComponent = null;
    appState.isExploded = false;
    appState.isTourActive = false;
    appState.currentTourStep = 0;
    appState.isLoading = false;
    appState.isCameraAnimating = false;

    console.log('[App] Teardown complete.');
  }
}

// ─── Resource Cleanup Helper ────────────────────────────────────────────────

function disposeModelHierarchy(object3D) {
  if (!object3D) return;

  object3D.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            disposeMaterial(mat);
          });
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

function disposeMaterial(mat) {
  if (!mat) return;
  // Dispose attached textures
  ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'].forEach((mapProp) => {
    if (mat[mapProp] && typeof mat[mapProp].dispose === 'function') {
      mat[mapProp].dispose();
    }
  });
  mat.dispose();
}

// ─── V2.2 Bootstrap: Model Selection ⇄ Explorer Two-Way Flow ─────────────────

function bootstrap() {
  // Pre-flight check
  if (!Renderer.isWebGLAvailable()) {
    const loadingScreen = new LoadingScreen();
    loadingScreen.showWebGLError();
    console.error('[Bootstrap] WebGL is not available in this environment.');
    return;
  }

  let currentApp = null;

  const showSelection = () => {
    appState.selectedModel = null;
    appState.currentView = 'selection';
    selector.show();
  };

  const launchApp = (selectedEntry) => {
    appState.selectedModel = selectedEntry;
    appState.currentView = 'explorer';

    console.log(
      `[Bootstrap] Launching Explorer for: "${selectedEntry.name}" (${selectedEntry.path})`
    );

    selector.hide(() => {
      currentApp = new App(selectedEntry.path, () => {
        showSelection();
      });
    });
  };

  const selector = new ModelSelector(MODEL_CATALOG, (selectedEntry) => {
    launchApp(selectedEntry);
  });
}

bootstrap();
