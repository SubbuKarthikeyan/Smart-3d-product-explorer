/**
 * ModelSelector.js
 * Owns the full-screen model-selection overlay.
 * Renders data-driven cards from MODEL_CATALOG.
 * Handles hover, focus, and click states.
 * Fires onSelect(modelEntry) callback — does not touch Three.js or AppState directly.
 */
export class ModelSelector {
  /**
   * @param {Array<Object>} catalog - MODEL_CATALOG entries
   * @param {Function} onSelect - Callback fired with the chosen catalog entry
   */
  constructor(catalog, onSelect) {
    this.catalog = catalog;
    this.onSelect = onSelect;
    this.overlay = null;
    this._buildDOM();
  }

  // ─── DOM construction ─────────────────────────────────────────────────────

  _buildDOM() {
    const app = document.getElementById('app');
    if (!app) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'selection-overlay';
    this.overlay.setAttribute('aria-label', 'Model Selection Screen');

    this.overlay.innerHTML = `
      <div class="selection-content">
        <header class="selection-header">
          <div class="selection-brand">
            <span class="brand-dot"></span>
            Digital Twin Experience
          </div>
          <h1 class="selection-title">Smart 3D Product Explorer</h1>
          <p class="selection-subtitle">Select a model to begin your interactive inspection</p>
        </header>

        <div class="model-grid" role="list">
          ${this.catalog.map((entry) => this._buildCard(entry)).join('')}
        </div>
      </div>
    `;

    app.appendChild(this.overlay);
    this._bindEvents();
  }

  _buildCard(entry) {
    return `
      <article
        class="model-card"
        data-model-id="${entry.id}"
        role="listitem"
        tabindex="0"
        aria-label="Select ${entry.name}"
      >
        <div class="model-card__preview" aria-hidden="true">
          <span class="model-card__icon">${entry.icon || '⬡'}</span>
          <div class="model-card__preview-ring"></div>
        </div>
        <div class="model-card__body">
          <div class="model-card__tag">${entry.type.toUpperCase()}</div>
          <h2 class="model-card__name">${escapeHTML(entry.name)}</h2>
          <p class="model-card__tagline">${escapeHTML(entry.tagline || '')}</p>
          <p class="model-card__description">${escapeHTML(entry.description)}</p>
        </div>
        <div class="model-card__cta">
          <span>Explore</span>
          <span class="model-card__arrow">→</span>
        </div>
      </article>
    `;
  }

  // ─── Event binding ─────────────────────────────────────────────────────────

  _bindEvents() {
    if (!this.overlay) return;

    const cards = this.overlay.querySelectorAll('.model-card');

    cards.forEach((card) => {
      // Hover states via CSS — no JS needed.
      // Click
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const modelId = card.dataset.modelId;
        this._handleSelect(modelId);
      });

      // Keyboard: Enter or Space activates the card
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const modelId = card.dataset.modelId;
          this._handleSelect(modelId);
        }
      });
    });
  }

  _handleSelect(modelId) {
    const entry = this.catalog.find((m) => m.id === modelId);

    if (!entry) {
      console.warn(`[ModelSelector] Unknown model id: "${modelId}"`);
      return;
    }

    console.log(`[ModelSelector] Model selected: ${entry.name} (${entry.id})`);

    // Visual feedback — mark card as selected before transition
    const card = this.overlay.querySelector(`[data-model-id="${modelId}"]`);
    if (card) card.classList.add('model-card--selected');

    // Slight delay for visual feedback then fire callback
    setTimeout(() => {
      if (this.onSelect) this.onSelect(entry);
    }, 220);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  show() {
    if (this.overlay) {
      this.overlay.style.display = '';
      this.overlay.classList.remove('hidden');
      const cards = this.overlay.querySelectorAll('.model-card--selected');
      cards.forEach((c) => c.classList.remove('model-card--selected'));
    }
  }

  /**
   * Fade out and hide the selection overlay.
   * @param {Function} [onHidden] - Optional callback once hidden
   */
  hide(onHidden = null) {
    if (!this.overlay) return;

    this.overlay.classList.add('hidden');

    // Wait for CSS transition before removing from paint tree
    const duration = 450;
    setTimeout(() => {
      if (this.overlay) {
        this.overlay.style.display = 'none';
      }
      if (onHidden) onHidden();
    }, duration);
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
