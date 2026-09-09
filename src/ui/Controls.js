/**
 * Controls.js
 * Owns the bottom floating action toolbar for experience controls
 * (Exploded View / Reassemble, Guided Tour navigation, and Global Experience Reset).
 */
export class Controls {
  constructor({
    onExplodeToggle = null,
    onTourStart = null,
    onTourNext = null,
    onTourPrev = null,
    onTourExit = null,
    onReset = null
  } = {}) {
    this.onExplodeToggle = onExplodeToggle;
    this.onTourStart = onTourStart;
    this.onTourNext = onTourNext;
    this.onTourPrev = onTourPrev;
    this.onTourExit = onTourExit;
    this.onReset = onReset;

    this.container = null;
    this.isExploded = false;
    this.isTourActive = false;

    this.createDOM();
  }

  createDOM() {
    const app = document.getElementById('app');
    if (!app) return;

    this.container = document.createElement('nav');
    this.container.className = 'controls-toolbar';
    this.container.setAttribute('aria-label', 'Experience Controls');
    app.appendChild(this.container);

    this.renderDefault();
  }

  renderDefault() {
    if (!this.container) return;

    this.container.innerHTML = `
      <button class="btn-control ${this.isExploded ? 'active' : ''}" id="btn-toggle-explode">
        <span class="control-icon">${this.isExploded ? '⧊' : '⧉'}</span>
        <span class="control-label">${this.isExploded ? 'Reassemble' : 'Explode View'}</span>
      </button>

      <button class="btn-control" id="btn-start-tour">
        <span class="control-icon">▷</span>
        <span class="control-label">Start Tour</span>
      </button>

      <button class="btn-control btn-reset" id="btn-reset-app" title="Reset Experience to Overview">
        <span class="control-icon">↺</span>
        <span class="control-label">Reset</span>
      </button>
    `;

    // Bind listeners
    const explodeBtn = this.container.querySelector('#btn-toggle-explode');
    if (explodeBtn) {
      explodeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onExplodeToggle) this.onExplodeToggle();
      });
    }

    const tourBtn = this.container.querySelector('#btn-start-tour');
    if (tourBtn) {
      tourBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onTourStart) this.onTourStart();
      });
    }

    const resetBtn = this.container.querySelector('#btn-reset-app');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onReset) this.onReset();
      });
    }
  }

  renderTour(currentStep, totalSteps, stepData) {
    if (!this.container) return;

    const stepNum = currentStep + 1;

    this.container.innerHTML = `
      <div class="tour-nav-group">
        <button class="btn-control btn-tour-nav" id="btn-exit-tour" title="Exit Tour">
          <span class="control-icon">✕</span>
          <span class="control-label">Exit</span>
        </button>

        <button class="btn-control btn-tour-nav" id="btn-prev-tour" ${currentStep === 0 ? 'disabled style="opacity:0.4"' : ''}>
          <span>‹ Prev</span>
        </button>

        <div class="tour-step-badge">
          Step ${stepNum} of ${totalSteps}
        </div>

        <button class="btn-control btn-tour-nav" id="btn-next-tour">
          <span>${stepNum === totalSteps ? 'Finish ›' : 'Next ›'}</span>
        </button>
      </div>

      <button class="btn-control btn-reset" id="btn-reset-app" title="Reset Experience">
        <span class="control-icon">↺</span>
      </button>
    `;

    const exitBtn = this.container.querySelector('#btn-exit-tour');
    if (exitBtn) {
      exitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onTourExit) this.onTourExit();
      });
    }

    const prevBtn = this.container.querySelector('#btn-prev-tour');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onTourPrev) this.onTourPrev();
      });
    }

    const nextBtn = this.container.querySelector('#btn-next-tour');
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onTourNext) this.onTourNext();
      });
    }

    const resetBtn = this.container.querySelector('#btn-reset-app');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onReset) this.onReset();
      });
    }
  }

  setExplodedState(isExploded) {
    this.isExploded = isExploded;
    if (!this.isTourActive) {
      this.renderDefault();
    }
  }

  setTourActive(isActive, currentStep = 0, totalSteps = 4, stepData = null) {
    this.isTourActive = isActive;
    if (isActive) {
      this.renderTour(currentStep, totalSteps, stepData);
    } else {
      this.renderDefault();
    }
  }
}
