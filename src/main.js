import './styles/main.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SceneManager } from './core/SceneManager.js';
import { CameraManager } from './core/CameraManager.js';
import { Renderer } from './core/Renderer.js';
import { Lighting } from './core/Lighting.js';

import { ModelLoader } from './model/ModelLoader.js';
import { components } from './model/ComponentData.js';
import { ComponentManager } from './interaction/ComponentManager.js';
import { HotspotManager } from './interaction/HotspotManager.js';
import { SceneRaycaster } from './interaction/Raycaster.js';
import { CameraFocus } from './experience/CameraFocus.js';
import { ExplodedView } from './experience/ExplodedView.js';
import { GuidedTour } from './experience/GuidedTour.js';

import { InfoPanel } from './ui/InfoPanel.js';
import { Controls } from './ui/Controls.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { appState } from './state/AppState.js';

/**
 * Smart 3D Product Explorer — Phase 5 Bootstrap
 * Orchestrates Core Three.js, Product Model, 3D Hotspots, Raycasting,
 * Reversible Highlighting, Information Panel, Camera Focus, Exploded View,
 * Guided 3D Tour, and Global Experience Reset.
 */

class App {
  constructor() {
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
      }
    );

    this.controlsUI = new Controls({
      onExplodeToggle: () => this.explodedView.toggle(),
      onTourStart: () => this.guidedTour.start(),
      onTourNext: () => this.guidedTour.next(),
      onTourPrev: () => this.guidedTour.previous(),
      onTourExit: () => this.guidedTour.stop(),
      onReset: () => this.resetApplication()
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
    this.setupResize();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // 9. Load Product Model & Initialize Systems
    this.initProduct();
  }

  async initProduct() {
    try {
      this.loadingScreen.clearError();
      this.loadingScreen.show();
      this.loadingScreen.updateProgress(35, 'Loading 3D product geometry...');

      // Clean product root and hotspots if this is a retry
      if (this.sceneManager) {
        this.sceneManager.clearProduct();
      }
      if (this.hotspotManager) {
        this.hotspotManager.clear();
      }

      const result = await this.modelLoader.load(
        '/models/product.glb',
        this.sceneManager.getProductRoot(),
        (percent) => {
          this.loadingScreen.updateProgress(35 + percent * 0.5, `Loading model (${percent}%)...`);
        }
      );

      this.loadingScreen.updateProgress(85, 'Configuring interactive systems & tour pathways...');

      // Map model nodes to components
      if (result && result.model) {
        this.registerModelComponents(result.model);
        this.hotspotManager.createHotspots(components, this.componentManager);
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

        // Frame camera based on model bounds
        this.cameraManager.frameObject(this.sceneManager.getProductRoot(), this.controls);

        // Cache default overview camera state
        this.cameraFocus.setOverview(
          this.cameraManager.getCamera().position,
          this.controls.target
        );
      }

      this.loadingScreen.updateProgress(100, 'Product Ready');
      appState.isLoading = false;
      this.loadingScreen.hide();

      console.log('[Smart 3D Product Explorer] Phase 6 Visual Polish & Final Validation ready.');
    } catch (err) {
      console.error('[App] Critical error during product initialization:', err);
      this.loadingScreen.showError(
        'Unable to load the 3D product. Please verify asset availability.',
        () => this.initProduct()
      );
    }
  }

  registerModelComponents(model) {
    components.forEach((compData) => {
      let matchedObject = null;

      model.traverse((child) => {
        if (child.name === compData.modelNode) {
          matchedObject = child;
        }
      });

      if (matchedObject) {
        this.componentManager.registerComponent(compData, matchedObject);
        console.log(`[App] Registered interactive node: '${compData.modelNode}' -> ${compData.name}`);
      } else {
        console.warn(`[App] Optional component model node '${compData.modelNode}' not found in 3D model.`);
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

  setupResize() {
    window.addEventListener('resize', () => {
      const width = this.container ? this.container.clientWidth : window.innerWidth;
      const height = this.container ? this.container.clientHeight : window.innerHeight;

      this.cameraManager.updateAspect(width, height);
      this.renderer.resize(width, height);
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

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
    this.controls.update();

    // 5. Update 3D hotspot pulsing, billboarding, and position tracking
    if (this.hotspotManager) {
      this.hotspotManager.update(this.cameraManager.getCamera());
    }

    // 6. Single central render call
    this.renderer.render(
      this.sceneManager.getScene(),
      this.cameraManager.getCamera()
    );
  }
}

// Bootstrap Application
new App();
