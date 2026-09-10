/**
 * LoadingScreen.js
 * Manages the loading overlay DOM, progress bar animations, status messaging, and error reporting.
 */
export class LoadingScreen {
  constructor() {
    this.container = null;
    this.barFill = null;
    this.statusText = null;
    this.errorBox = null;
    this.createDOM();
  }

  createDOM() {
    const app = document.getElementById('app');
    if (!app) return;

    this.container = document.createElement('div');
    this.container.className = 'loading-overlay';
    this.container.innerHTML = `
      <div class="loading-content">
        <div class="loading-brand">Smart 3D Product Explorer</div>
        <div class="loading-title">Initializing 3D Experience</div>
        <div class="loading-bar-wrapper">
          <div class="loading-bar-fill" id="loading-bar-fill"></div>
        </div>
        <div class="loading-status" id="loading-status">Preparing environment...</div>
        <div class="loading-error" id="loading-error"></div>
      </div>
    `;

    app.appendChild(this.container);
    this.barFill = this.container.querySelector('#loading-bar-fill');
    this.statusText = this.container.querySelector('#loading-status');
    this.errorBox = this.container.querySelector('#loading-error');
  }

  updateProgress(percent, message) {
    if (this.barFill) {
      this.barFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
    if (message && this.statusText) {
      this.statusText.textContent = message;
    }
  }

  hide() {
    this.updateProgress(100, 'Experience Ready');
    setTimeout(() => {
      if (this.container) {
        this.container.classList.add('hidden');
      }
    }, 300);
  }

  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
    }
  }

  clearError() {
    if (this.errorBox) {
      this.errorBox.innerHTML = '';
      this.errorBox.classList.remove('visible');
    }
  }

  showError(message, onRetry = null, onBack = null) {
    if (!this.errorBox) return;

    this.show();
    this.errorBox.innerHTML = `
      <div class="loading-error-message">${escapeHTML(message)}</div>
      <div class="loading-error-actions" style="display: flex; gap: 10px; justify-content: center; margin-top: 12px;">
        ${
          onRetry
            ? `<button class="btn-loading-retry" id="btn-loading-retry">
                 <span>↻</span> Retry
               </button>`
            : ''
        }
        ${
          onBack
            ? `<button class="btn-loading-retry" id="btn-loading-back" style="background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2);">
                 <span>←</span> Back to Models
               </button>`
            : ''
        }
      </div>
    `;
    this.errorBox.classList.add('visible');

    if (onRetry) {
      const retryBtn = this.errorBox.querySelector('#btn-loading-retry');
      if (retryBtn) {
        retryBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.clearError();
          onRetry();
        });
      }
    }

    if (onBack) {
      const backBtn = this.errorBox.querySelector('#btn-loading-back');
      if (backBtn) {
        backBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.clearError();
          this.hide();
          onBack();
        });
      }
    }

    if (this.statusText) {
      this.statusText.textContent = 'Failed to load experience';
    }
  }

  showWebGLError() {
    this.showError(
      'WebGL is not available in this browser. Please use a modern browser with WebGL hardware acceleration enabled.'
    );
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.barFill = null;
    this.statusText = null;
    this.errorBox = null;
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
