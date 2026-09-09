import { appState } from '../state/AppState.js';

/**
 * GuidedTour.js
 * Owns data-driven automated guided product tour, step-by-step telemetry inspection,
 * timing progression, manual step navigation, and smooth overview return.
 */
export class GuidedTour {
  constructor(componentManager, cameraFocus, steps = null) {
    this.componentManager = componentManager;
    this.cameraFocus = cameraFocus;

    // Data-driven tour steps mapping to registered component IDs
    this.steps = steps || [
      { component: 'engine', title: 'Turbine Propulsion', duration: 3400 },
      { component: 'battery', title: 'Lithium-Solid Core', duration: 3400 },
      { component: 'cooling', title: 'Thermal Matrix', duration: 3400 },
      { component: 'control', title: 'Avionics Guidance', duration: 3400 }
    ];

    this.active = false;
    this.currentIndex = -1;
    this.stepStartedAt = 0;

    this.onStepChangeCallbacks = [];
    this.onTourEndCallbacks = [];
  }

  start() {
    if (this.active || this.steps.length === 0) return;

    this.active = true;
    appState.isTourActive = true;
    console.log('[GuidedTour] Starting guided 3D product tour.');

    this.goToStep(0);
  }

  goToStep(index) {
    if (!this.active) return;

    if (index >= this.steps.length) {
      this.complete();
      return;
    }

    if (index < 0) {
      index = 0;
    }

    const step = this.steps[index];
    const compEntry = this.componentManager.getComponentEntry(step.component);

    // Resilient fallback: skip missing components gracefully
    if (!compEntry || !compEntry.object3D) {
      console.warn(`[GuidedTour] Component '${step.component}' not found in registry. Skipping step.`);
      this.goToStep(index + 1);
      return;
    }

    this.currentIndex = index;
    appState.currentTourStep = index;
    this.stepStartedAt = performance.now();

    // 1. Select component in central ComponentManager
    this.componentManager.selectComponent(step.component);

    // 2. Smoothly focus camera on component
    if (this.cameraFocus) {
      this.cameraFocus.focusOn(compEntry.object3D, 900);
    }

    // 3. Notify UI
    this.notifyStepChange(this.currentIndex, this.steps.length, step);
    console.log(`[GuidedTour] Step ${index + 1}/${this.steps.length}: ${step.title}`);
  }

  next() {
    if (!this.active) return;
    this.goToStep(this.currentIndex + 1);
  }

  previous() {
    if (!this.active) return;
    this.goToStep(this.currentIndex - 1);
  }

  stop() {
    if (!this.active) return;

    this.active = false;
    appState.isTourActive = false;
    appState.currentTourStep = -1;
    this.currentIndex = -1;

    this.notifyTourEnd('stopped');
    console.log('[GuidedTour] Exited tour.');
  }

  complete() {
    this.active = false;
    appState.isTourActive = false;
    appState.currentTourStep = -1;
    this.currentIndex = -1;

    // Deselect and smoothly return camera to overview
    this.componentManager.deselectComponent();
    if (this.cameraFocus) {
      this.cameraFocus.reset(950);
    }

    this.notifyTourEnd('completed');
    console.log('[GuidedTour] Tour completed. Returned to overview.');
  }

  reset() {
    this.stop();
  }

  /**
   * Central animation loop update for step timing progression
   */
  update(currentTime = performance.now()) {
    if (!this.active || this.currentIndex < 0) return;

    const currentStep = this.steps[this.currentIndex];
    if (!currentStep) return;

    // Automatically advance if step duration elapsed
    if (currentTime - this.stepStartedAt >= currentStep.duration) {
      this.next();
    }
  }

  isActive() {
    return this.active;
  }

  onStepChange(cb) {
    this.onStepChangeCallbacks.push(cb);
  }

  onTourEnd(cb) {
    this.onTourEndCallbacks.push(cb);
  }

  notifyStepChange(current, total, step) {
    this.onStepChangeCallbacks.forEach((cb) => cb(current, total, step));
  }

  notifyTourEnd(reason) {
    this.onTourEndCallbacks.forEach((cb) => cb(reason));
  }
}
