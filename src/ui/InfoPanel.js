/**
 * InfoPanel.js
 * Owns the floating right-hand information panel and app branding header.
 * Generated purely from component metadata.
 */
export class InfoPanel {
  constructor(onDeselect = null, onFocus = null, modelTitle = 'Demo Product Model') {
    this.onDeselect = onDeselect;
    this.onFocus = onFocus;
    this.modelTitle = modelTitle;
    this.container = null;
    this.panelElement = null;

    this.createDOM();
  }

  createDOM() {
    const app = document.getElementById('app');
    if (!app) return;

    // 1. Branding Header
    this.headerElement = document.createElement('header');
    this.headerElement.className = 'app-header';
    this.headerElement.innerHTML = `
      <div class="brand-tag">
        <span class="brand-dot"></span>
        Digital Twin Experience
      </div>
      <h1 class="app-title">Smart 3D Product Explorer</h1>
      <div class="app-subtitle">Interactive 3D Subsystem Diagnostics</div>
    `;
    app.appendChild(this.headerElement);

    // 2. Info Panel Container
    this.panelElement = document.createElement('aside');
    this.panelElement.className = 'info-panel';
    app.appendChild(this.panelElement);

    // Initial render
    this.renderDefault();
  }

  setModelTitle(modelTitle) {
    this.modelTitle = modelTitle || 'Product';
    if (!this.panelElement || !this.panelElement.classList.contains('has-selection')) {
      this.renderDefault();
    }
  }

  renderDefault() {
    if (!this.panelElement) return;
    this.panelElement.classList.remove('has-selection');
    const title = this.modelTitle ? this.modelTitle.toUpperCase() : 'PRODUCT';
    this.panelElement.innerHTML = `
      <div class="info-empty-state">
        <div class="info-empty-icon">⎔</div>
        <div class="info-title" style="font-size: 1.05rem; margin-bottom: 6px;">EXPLORE ${escapeHTML(title)}</div>
        <div class="info-description" style="margin-bottom: 0;">
          Hover or click interactive 3D components and beacon markers to inspect technical specifications and diagnostics.
        </div>
      </div>
    `;
  }

  update(component) {
    if (!component) {
      this.renderDefault();
      return;
    }

    this.panelElement.classList.add('has-selection');
    this.panelElement.innerHTML = `
      <div class="info-header">
        <span class="info-category">${escapeHTML(component.category || 'Subsystem')}</span>
        <button class="info-close-btn" id="info-close-btn" title="Deselect Component" aria-label="Close">✕</button>
      </div>
      <h2 class="info-title">${escapeHTML(component.name)}</h2>
      <p class="info-description">${escapeHTML(component.description)}</p>
      <div class="info-status-row">
        <span class="status-label">Telemetry Status</span>
        <span class="status-badge">
          <span class="status-indicator-dot"></span>
          Operational
        </span>
      </div>
      <div class="info-actions">
        <button class="btn-focus" id="btn-focus-component">
          <span>Focus Component</span>
          <span style="font-size: 0.9em;">→</span>
        </button>
      </div>
    `;

    // Bind event listeners
    const closeBtn = this.panelElement.querySelector('#info-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onDeselect) this.onDeselect();
      });
    }

    const focusBtn = this.panelElement.querySelector('#btn-focus-component');
    if (focusBtn) {
      focusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onFocus) this.onFocus(component);
      });
    }
  }

  reset() {
    this.renderDefault();
  }

  destroy() {
    if (this.headerElement && this.headerElement.parentNode) {
      this.headerElement.parentNode.removeChild(this.headerElement);
    }
    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement);
    }
    this.headerElement = null;
    this.panelElement = null;
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
