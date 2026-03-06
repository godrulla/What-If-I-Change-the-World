// ===== SPRITE SYSTEM =====
// Animated sprite entities with pixel art rendering

class Sprite {
  constructor(config) {
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.w = config.w || 16;
    this.h = config.h || 16;
    this.speed = config.speed || 80;
    this.color = config.color || '#E8553A';
    this.type = config.type || 'player';
    this.visible = true;
    this.active = true;

    // Animation
    this.direction = 'down'; // up, down, left, right
    this.frame = 0;
    this.frameTimer = 0;
    this.frameSpeed = 0.15; // seconds per frame
    this.totalFrames = 4;
    this.moving = false;

    // Pixel art definition (programmatic)
    this.pixels = config.pixels || null;
    this.colors = config.colors || {};
  }

  update(dt, dx, dy, tileMap) {
    this.moving = dx !== 0 || dy !== 0;

    if (this.moving) {
      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
      }

      // Set direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 'right' : 'left';
      } else {
        this.direction = dy > 0 ? 'down' : 'up';
      }

      const newX = this.x + dx * this.speed * dt;
      const newY = this.y + dy * this.speed * dt;

      // Collision check with tilemap
      if (tileMap) {
        const margin = 2;
        if (!tileMap.isSolidRect(newX + margin, this.y + margin, this.w - margin * 2, this.h - margin * 2)) {
          this.x = newX;
        }
        if (!tileMap.isSolidRect(this.x + margin, newY + margin, this.w - margin * 2, this.h - margin * 2)) {
          this.y = newY;
        }
      } else {
        this.x = newX;
        this.y = newY;
      }

      // Animate
      this.frameTimer += dt;
      if (this.frameTimer >= this.frameSpeed) {
        this.frameTimer = 0;
        this.frame = (this.frame + 1) % this.totalFrames;
      }
    } else {
      this.frame = 0;
      this.frameTimer = 0;
    }
  }

  render(ctx) {
    if (!this.visible) return;

    if (this.pixels) {
      this._renderPixelArt(ctx);
    } else {
      this._renderDefault(ctx);
    }
  }

  _renderDefault(ctx) {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);

    // Body
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 2, y + 4, 12, 10);

    // Head
    ctx.fillStyle = '#FFDAB9';
    ctx.fillRect(x + 4, y, 8, 7);

    // Eyes
    ctx.fillStyle = '#000';
    if (this.direction === 'left') {
      ctx.fillRect(x + 4, y + 3, 2, 2);
    } else if (this.direction === 'right') {
      ctx.fillRect(x + 10, y + 3, 2, 2);
    } else {
      ctx.fillRect(x + 5, y + 3, 2, 2);
      ctx.fillRect(x + 9, y + 3, 2, 2);
    }

    // Legs (animated)
    ctx.fillStyle = '#4a3728';
    if (this.moving) {
      const legOffset = this.frame % 2 === 0 ? 0 : 2;
      ctx.fillRect(x + 4, y + 13, 3, 3 + legOffset);
      ctx.fillRect(x + 9, y + 13, 3, 3 + (2 - legOffset));
    } else {
      ctx.fillRect(x + 4, y + 13, 3, 3);
      ctx.fillRect(x + 9, y + 13, 3, 3);
    }
  }

  _renderPixelArt(ctx) {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const dirFrames = this.pixels[this.direction] || this.pixels['down'];
    const frameData = dirFrames ? dirFrames[this.frame % dirFrames.length] : null;
    if (!frameData) {
      this._renderDefault(ctx);
      return;
    }

    const pixelSize = this.w / frameData[0].length;
    frameData.forEach((row, ry) => {
      row.split('').forEach((char, rx) => {
        if (char !== '.' && this.colors[char]) {
          ctx.fillStyle = this.colors[char];
          ctx.fillRect(x + rx * pixelSize, y + ry * pixelSize, pixelSize, pixelSize);
        }
      });
    });
  }

  // AABB collision with another sprite
  collidesWith(other) {
    return this.x < other.x + other.w &&
           this.x + this.w > other.x &&
           this.y < other.y + other.h &&
           this.y + this.h > other.y;
  }

  // Distance to another sprite
  distanceTo(other) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const ox = other.x + other.w / 2;
    const oy = other.y + other.h / 2;
    return Math.sqrt((cx - ox) ** 2 + (cy - oy) ** 2);
  }
}

window.Sprite = Sprite;
