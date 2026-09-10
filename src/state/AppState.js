/**
 * Central lightweight application state.
 * No external state-management library required.
 */
export const appState = {
  // V2 — Model selection layer
  selectedModel: null,          // Holds the selected MODEL_CATALOG entry
  currentView: 'selection',     // 'selection' | 'explorer'

  // Explorer interaction state
  selectedComponent: null,
  hoveredComponent: null,
  isExploded: false,
  isTourActive: false,
  currentTourStep: 0,
  isLoading: false,
  isCameraAnimating: false
};

