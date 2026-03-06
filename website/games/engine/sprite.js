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

    // Character appearance
    this.skinColor = config.skinColor || '#FFDAB9';
    this.hairColor = config.hairColor || '#1a1a2e';
    this.isFemale = config.isFemale || false;

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

    // Hair (behind head for female characters)
    if (this.isFemale) {
      ctx.fillStyle = this.hairColor;
      ctx.fillRect(x + 3, y - 1, 10, 9);
      // Side hair strands
      ctx.fillRect(x + 2, y + 2, 2, 8);
      ctx.fillRect(x + 12, y + 2, 2, 8);
    } else {
      // Male hair (on top)
      ctx.fillStyle = this.hairColor;
      ctx.fillRect(x + 4, y - 1, 8, 3);
    }

    // Head (skin color)
    ctx.fillStyle = this.skinColor;
    ctx.fillRect(x + 4, y + 1, 8, 7);

    // Body
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 2, y + 8, 12, 6);

    // Eyes
    ctx.fillStyle = '#000';
    if (this.direction === 'left') {
      ctx.fillRect(x + 5, y + 4, 2, 2);
    } else if (this.direction === 'right') {
      ctx.fillRect(x + 9, y + 4, 2, 2);
    } else {
      ctx.fillRect(x + 5, y + 4, 2, 2);
      ctx.fillRect(x + 9, y + 4, 2, 2);
    }

    // Mouth
    ctx.fillStyle = this.skinColor === '#8B6914' || this.skinColor === '#6B4226' || this.skinColor === '#8B5E3C'
      ? '#C4956A' : '#E8A090';
    ctx.fillRect(x + 6, y + 6, 4, 1);

    // Legs (animated)
    ctx.fillStyle = this.skinColor;
    if (this.moving) {
      const legOffset = this.frame % 2 === 0 ? 0 : 2;
      ctx.fillRect(x + 4, y + 14, 3, 2 + legOffset);
      ctx.fillRect(x + 9, y + 14, 3, 2 + (2 - legOffset));
    } else {
      ctx.fillRect(x + 4, y + 14, 3, 2);
      ctx.fillRect(x + 9, y + 14, 3, 2);
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
