// ===== GAME LOADER =====
// Manages the game popup overlay and loads the correct game config

class GameLoader {
  constructor() {
    this.currentEngine = null;
    this.overlay = document.getElementById('gameOverlay');
    this.canvas = document.getElementById('gameCanvas');
    this.gameFrame = document.getElementById('gameFrame');
    this.closeBtn = document.getElementById('gameCloseBtn');

    this.closeBtn.addEventListener('click', () => this.closeGame());

    // Click outside game frame to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.closeGame();
      }
    });

    // Touch D-pad setup
    this._setupTouchControls();

    // ESC to close + M to toggle sound
    this._onKey = (e) => {
      if (!this.overlay.classList.contains('active')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.closeGame();
      }
      if (e.code === 'KeyM') {
        toggleGameSound();
      }
    };
    window.addEventListener('keydown', this._onKey);

    // Handle tap-to-start and tap-to-retry on mobile
    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.currentEngine || !this.currentEngine.gameState) return;
      const phase = this.currentEngine.gameState.phase;
      if (phase === 'title') {
        this.currentEngine.keys['Space'] = true;
        setTimeout(() => { if (this.currentEngine) this.currentEngine.keys['Space'] = false; }, 100);
      } else if (phase === 'lose') {
        this.currentEngine.keys['KeyR'] = true;
        setTimeout(() => { if (this.currentEngine) this.currentEngine.keys['KeyR'] = false; }, 100);
      }
    }, { passive: true });
  }

  async openGame(storyIndex) {
    const gameNum = String(storyIndex + 1).padStart(2, '0');
    const configId = `game-${gameNum}`;

    if (!window.GAME_CONFIGS || !window.GAME_CONFIGS[configId]) {
      try {
        await this._loadScript(`games/configs/game-${gameNum}.js`);
      } catch (err) {
        console.warn(`Game ${gameNum} not yet available`);
        alert(this._getComingSoonMsg(storyIndex));
        return;
      }
    }

    if (!window.GAME_CONFIGS || !window.GAME_CONFIGS[configId]) {
      alert(this._getComingSoonMsg(storyIndex));
      return;
    }

    const config = window.GAME_CONFIGS[configId];

    // Show overlay
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Update sound button label
    this._updateSoundBtn();

    // Play click sound
    if (window.retroAudio) window.retroAudio.click();

    // Create engine
    this.currentEngine = new GameEngine(this.canvas, config);
    this.currentEngine.tileMap = config.buildTileMap ? config.buildTileMap() : null;
    this.currentEngine.start();
  }

  closeGame() {
    if (this.currentEngine) {
      this.currentEngine.stop();
      this.currentEngine = null;
    }
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  _getComingSoonMsg(idx) {
    const lang = window.lang || 'en';
    return lang === 'en'
      ? 'This game is coming soon! Stay tuned.'
      : 'Este juego estara disponible pronto!';
  }

  _loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  _updateSoundBtn() {
    const btn = document.getElementById('gameSoundBtn');
    const mobileBtn = document.getElementById('dpadMute');
    const on = window.retroAudio && window.retroAudio.enabled;
    if (btn) btn.textContent = on ? 'SND ON' : 'SND OFF';
    if (mobileBtn) mobileBtn.textContent = on ? 'SND' : 'MUTE';
  }

  _setupTouchControls() {
    const buttons = {
      'dpadUp': { x: 0, y: -1 },
      'dpadDown': { x: 0, y: 1 },
      'dpadLeft': { x: -1, y: 0 },
      'dpadRight': { x: 1, y: 0 },
      'dpadAction': { x: 0, y: 0, action: true }
    };

    Object.entries(buttons).forEach(([id, dir]) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const startTouch = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        if (this.currentEngine) {
          if (dir.action) {
            this.currentEngine.keys['Space'] = true;
          } else {
            this.currentEngine.setTouchDir(dir.x, dir.y);
          }
        }
      };
      const endTouch = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        if (this.currentEngine) {
          if (dir.action) {
            this.currentEngine.keys['Space'] = false;
          } else {
            this.currentEngine.setTouchDir(0, 0);
          }
        }
      };

      btn.addEventListener('touchstart', startTouch, { passive: false });
      btn.addEventListener('touchend', endTouch, { passive: false });
      btn.addEventListener('touchcancel', endTouch, { passive: false });
      btn.addEventListener('mousedown', startTouch);
      btn.addEventListener('mouseup', endTouch);
      btn.addEventListener('mouseleave', endTouch);
    });
  }
}

// Sound toggle function
function toggleGameSound() {
  if (window.retroAudio) {
    const on = window.retroAudio.toggle();
    const btn = document.getElementById('gameSoundBtn');
    const mobileBtn = document.getElementById('dpadMute');
    if (btn) btn.textContent = on ? 'SND ON' : 'SND OFF';
    if (mobileBtn) mobileBtn.textContent = on ? 'SND' : 'MUTE';
  }
}

// Global instance
window.gameLoader = null;

function openGame(storyIndex) {
  if (!window.gameLoader) {
    window.gameLoader = new GameLoader();
  }
  window.gameLoader.openGame(storyIndex);
}

window.openGame = openGame;
window.toggleGameSound = toggleGameSound;
