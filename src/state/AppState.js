/**
 * Central lightweight application state.
 * No external state-management library required.
 */
export const appState = {
  selectedComponent: null,
  hoveredComponent: null,
  isExploded: false,
  isTourActive: false,
  currentTourStep: 0,
  isLoading: false,
  isCameraAnimating: false
};
