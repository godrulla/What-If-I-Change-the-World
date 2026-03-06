// roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    const r = typeof radii === 'number' ? [radii,radii,radii,radii] : Array.isArray(radii) ? radii : [0,0,0,0];
    while (r.length < 4) r.push(0);
    this.moveTo(x + r[0], y);
    this.lineTo(x + w - r[1], y);
    this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    this.lineTo(x + w, y + h - r[2]);
    this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    this.lineTo(x + r[3], y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    this.lineTo(x, y + r[0]);
    this.quadraticCurveTo(x, y, x + r[0], y);
    this.closePath();
    return this;
  };
}

// ===== RETRO GAME ENGINE =====
// Lightweight HTML5 Canvas game engine for 2D retro-style mini-games
// 640x480 resolution, 16x16 tiles, NES aesthetic

class GameEngine {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 640;
    this.height = 480;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;

    this.config = config;
    this.tileSize = 16;
    this.scale = 1;

    // Game state
    this.running = false;
    this.paused = false;
    this.gameTime = 0;
    this.deltaTime = 0;
    this.lastFrame = 0;
    this.fps = 60;

    // Input
    this.keys = {};
    this.touchDir = { x: 0, y: 0 };

    // Camera
    this.camera = { x: 0, y: 0 };

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;

    // Entity list
    this.entities = [];

    // Particles
    this.particles = new ParticleSystem();

    // Audio ref
    this.audio = window.retroAudio;

    // Step sound throttle
    this._stepTimer = 0;

    // Callbacks
    this.onUpdate = config.onUpdate || (() => {});
    this.onRender = config.onRender || (() => {});
    this.onInit = config.onInit || (() => {});

    this._bindInput();
  }

  _bindInput() {
    this._onKeyDown = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyZ','KeyX','Enter'].includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.keys[e.code] = true;
    };
    this._onKeyUp = (e) => {
      this.keys[e.code] = false;
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  unbindInput() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  setTouchDir(x, y) {
    this.touchDir.x = x;
    this.touchDir.y = y;
  }

  // Get directional input (keyboard + touch combined)
  getInput() {
    let dx = 0, dy = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) dx += 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) dy -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) dy += 1;
    // Touch overrides if active
    if (this.touchDir.x !== 0 || this.touchDir.y !== 0) {
      dx = this.touchDir.x;
      dy = this.touchDir.y;
    }
    return { dx, dy, action: this.keys['Space'] || this.keys['KeyZ'] };
  }

  // Camera follows target entity
  followCamera(entity) {
    this.camera.x = Math.max(0, entity.x - this.width / 2 + entity.w / 2);
    this.camera.y = Math.max(0, entity.y - this.height / 2 + entity.h / 2);
    if (this.tileMap) {
      const mapW = this.tileMap.cols * this.tileSize;
      const mapH = this.tileMap.rows * this.tileSize;
      this.camera.x = Math.min(this.camera.x, Math.max(0, mapW - this.width));
      this.camera.y = Math.min(this.camera.y, Math.max(0, mapH - this.height));
    }
  }

  // Screen shake effect
  shake(intensity = 4, duration = 0.2) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  // Play step sound with throttle
  playStep() {
    this._stepTimer -= this.deltaTime;
    if (this._stepTimer <= 0) {
      this.audio.step();
      this._stepTimer = 0.25;
    }
  }

  start() {
    this.running = true;
    this.lastFrame = performance.now();
    this.onInit(this);
    this._loop();
  }

  stop() {
    this.running = false;
    this.unbindInput();
    this.audio.stopMusic();
    this.particles.clear();
  }

  _loop() {
    if (!this.running) return;
    const now = performance.now();
    this.deltaTime = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.gameTime += this.deltaTime;

    if (!this.paused) {
      this.onUpdate(this, this.deltaTime);
      this.particles.update(this.deltaTime);
    }

    // Screen shake offset
    let shakeX = 0, shakeY = 0;
    if (this.shakeDuration > 0) {
      this.shakeDuration -= this.deltaTime;
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }

    // Clear
    this.ctx.fillStyle = this.config.bgColor || '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Save and translate for camera + shake
    this.ctx.save();
    this.ctx.translate(-Math.floor(this.camera.x) + shakeX, -Math.floor(this.camera.y) + shakeY);

    // Render tilemap
    if (this.tileMap) {
      this.tileMap.render(this.ctx, this.camera, this.width, this.height);
    }

    // Render entities
    this.entities.forEach(e => {
      if (e.visible !== false) e.render(this.ctx);
    });

    this.ctx.restore();

    // Render particles (screen space)
    this.particles.render(this.ctx);

    // Render HUD (not affected by camera)
    this.onRender(this, this.ctx);

    requestAnimationFrame(() => this._loop());
  }

  addEntity(entity) {
    this.entities.push(entity);
    return entity;
  }

  removeEntity(entity) {
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) this.entities.splice(idx, 1);
  }

  // Draw text with retro pixel font style
  drawText(text, x, y, size = 16, color = '#fff', align = 'left') {
    this.ctx.save();
    this.ctx.font = `bold ${size}px monospace`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = 'top';
    // Shadow for readability
    this.ctx.fillStyle = '#000';
    this.ctx.fillText(text, x + 1, y + 1);
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  // Draw a filled rect (useful for HUD bars, etc.)
  drawRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  drawRectOutline(x, y, w, h, color, lineWidth = 1) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(x, y, w, h);
  }
}

// Export for use
window.GameEngine = GameEngine;
