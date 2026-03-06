// ===== TILE MAP SYSTEM =====
// Renders 16x16 tile-based maps with procedural "Donkey Kong style" textures

class TileMap {
  constructor(mapData, tileSize = 16) {
    this.tileSize = tileSize;
    this.cols = mapData.cols;
    this.rows = mapData.rows;
    this.layers = mapData.layers;
    this.tileColors = mapData.tileColors || {};
    this.tileChars = mapData.tileChars || {};
    this._tileCache = {};
    this._waterPhase = 0;
    this._buildTextureCache();
  }

  // Seeded PRNG for deterministic per-tile variation
  _seededRandom(col, row, seed) {
    let h = (col * 374761393 + row * 668265263 + seed * 1274126177) | 0;
    h = ((h ^ (h >> 13)) * 1274126177) | 0;
    return ((h ^ (h >> 16)) >>> 0) / 4294967296;
  }

  // Build cached texture variants for each tile type
  _buildTextureCache() {
    const ts = this.tileSize;
    const variants = 4;

    // Grass variants (tile type 0)
    this._tileCache['grass'] = this._buildVariants(variants, (ctx, v) => {
      const base = this.tileColors[0] || '#3d8b37';
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, ts, ts);
      // Darker speckles
      for (let i = 0; i < 6; i++) {
        const sx = this._seededRandom(i, v, 1) * (ts - 2);
        const sy = this._seededRandom(i, v, 2) * (ts - 2);
        ctx.fillStyle = 'rgba(0,60,0,0.25)';
        ctx.fillRect(sx, sy, 2, 2);
      }
      // Short grass blades
      ctx.fillStyle = 'rgba(80,180,60,0.4)';
      for (let i = 0; i < 4; i++) {
        const gx = this._seededRandom(i, v, 3) * (ts - 1);
        const gy = this._seededRandom(i, v, 4) * (ts - 4) + 2;
        ctx.fillRect(gx, gy, 1, 3);
      }
      // Occasional flower
      if (this._seededRandom(v, 0, 5) > 0.6) {
        const fx = this._seededRandom(v, 0, 6) * (ts - 4) + 2;
        const fy = this._seededRandom(v, 0, 7) * (ts - 4) + 2;
        const colors = ['#FFD700', '#ff6b9d', '#ff4444', '#ffffff'];
        ctx.fillStyle = colors[v % colors.length];
        ctx.fillRect(fx, fy, 2, 2);
        ctx.fillStyle = 'rgba(0,100,0,0.5)';
        ctx.fillRect(fx, fy + 2, 1, 2);
      }
    });

    // Dirt/path variants (tile type 2)
    this._tileCache['dirt'] = this._buildVariants(variants, (ctx, v) => {
      const base = this.tileColors[2] || '#c4a265';
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, ts, ts);
      // Grain variation
      for (let i = 0; i < 8; i++) {
        const gx = this._seededRandom(i, v, 10) * ts;
        const gy = this._seededRandom(i, v, 11) * ts;
        const dark = this._seededRandom(i, v, 12) > 0.5;
        ctx.fillStyle = dark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)';
        ctx.fillRect(gx, gy, 1, 1);
      }
      // Pebble dots
      for (let i = 0; i < 2; i++) {
        const px = this._seededRandom(i, v, 13) * (ts - 3) + 1;
        const py = this._seededRandom(i, v, 14) * (ts - 3) + 1;
        ctx.fillStyle = 'rgba(80,60,30,0.3)';
        ctx.fillRect(px, py, 2, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(px, py, 1, 1);
      }
    });

    // Sand variants (tile type 3)
    this._tileCache['sand'] = this._buildVariants(variants, (ctx, v) => {
      const base = this.tileColors[3] || '#d4b896';
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, ts, ts);
      // Grain variation
      for (let i = 0; i < 10; i++) {
        const sx = this._seededRandom(i, v, 20) * ts;
        const sy = this._seededRandom(i, v, 21) * ts;
        ctx.fillStyle = this._seededRandom(i, v, 22) > 0.5 ? 'rgba(255,240,200,0.15)' : 'rgba(160,120,60,0.1)';
        ctx.fillRect(sx, sy, 1, 1);
      }
    });

    // Tree/building variants (tile type 4)
    this._tileCache['tree'] = this._buildVariants(variants, (ctx, v) => {
      const base = this.tileColors[4] || '#2d6b27';
      // Shadow under tree
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(1, ts - 4, ts - 2, 4);
      // Brown trunk
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(6, ts - 6, 4, 6);
      ctx.fillStyle = '#4a2a10';
      ctx.fillRect(7, ts - 6, 1, 6);
      // Leaf canopy (layered circles via rects)
      ctx.fillStyle = base;
      ctx.fillRect(2, 1, 12, 10);
      ctx.fillRect(1, 3, 14, 6);
      ctx.fillRect(3, 0, 10, 12);
      // Leaf highlight clusters
      ctx.fillStyle = 'rgba(100,200,80,0.35)';
      const hx = 3 + (v % 3) * 3;
      ctx.fillRect(hx, 2, 3, 3);
      ctx.fillRect(hx + 2, 5, 2, 2);
      // Dark leaf depth
      ctx.fillStyle = 'rgba(0,40,0,0.25)';
      ctx.fillRect(4, 6, 4, 3);
    });

    // Wall variants (collision tile = 1)
    this._tileCache['wall'] = this._buildVariants(variants, (ctx, v) => {
      const base = this.tileColors['wall'] || '#5a4a3a';
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, ts, ts);
      // Staggered brick mortar lines
      const brickH = Math.floor(ts / 3);
      const offset = v % 2 === 0 ? 0 : Math.floor(ts / 2);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let by = 0; by < ts; by += brickH) {
        ctx.fillRect(0, by, ts, 1); // horizontal mortar
        const rowOffset = (Math.floor(by / brickH) % 2 === 0) ? offset : 0;
        for (let bx = rowOffset; bx < ts; bx += Math.floor(ts / 2)) {
          ctx.fillRect(bx, by, 1, brickH); // vertical mortar
        }
      }
      // Brick highlight (top-left of each brick)
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let by = 1; by < ts; by += brickH) {
        ctx.fillRect(1, by, ts - 2, 1);
      }
      // Brick shadow (bottom of each brick)
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let by = brickH - 1; by < ts; by += brickH) {
        ctx.fillRect(0, by, ts, 1);
      }
      // Random stone variation
      if (this._seededRandom(v, 0, 30) > 0.5) {
        const dx = this._seededRandom(v, 1, 31) * (ts - 4) + 2;
        const dy = this._seededRandom(v, 1, 32) * (ts - 4) + 2;
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(dx, dy, 3, 2);
      }
    });
  }

  _buildVariants(count, drawFn) {
    const ts = this.tileSize;
    const canvases = [];
    for (let v = 0; v < count; v++) {
      const c = document.createElement('canvas');
      c.width = ts;
      c.height = ts;
      const ctx = c.getContext('2d');
      drawFn(ctx, v);
      canvases.push(c);
    }
    return canvases;
  }

  getTile(layer, col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 1;
    return this.layers[layer][row * this.cols + col];
  }

  isSolid(worldX, worldY) {
    const col = Math.floor(worldX / this.tileSize);
    const row = Math.floor(worldY / this.tileSize);
    return this.getTile('collision', col, row) === 1;
  }

  isSolidRect(x, y, w, h) {
    const points = [
      [x, y], [x + w - 1, y],
      [x, y + h - 1], [x + w - 1, y + h - 1],
      [x + w / 2, y], [x + w / 2, y + h - 1],
      [x, y + h / 2], [x + w - 1, y + h / 2]
    ];
    return points.some(([px, py]) => this.isSolid(px, py));
  }

  _getVariant(col, row) {
    return ((col * 7 + row * 13) & 0x7FFFFFFF) % 4;
  }

  render(ctx, camera, viewW, viewH) {
    const ts = this.tileSize;
    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endCol = Math.min(this.cols, Math.ceil((camera.x + viewW) / ts) + 1);
    const endRow = Math.min(this.rows, Math.ceil((camera.y + viewH) / ts) + 1);

    // Update water animation phase
    this._waterPhase = Date.now() / 600;

    // Render ground layer with cached textures
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tile = this.getTile('ground', c, r);
        const v = this._getVariant(c, r);
        const x = c * ts;
        const y = r * ts;

        if (tile === 5) {
          // Water — animated, not cached
          this._renderWater(ctx, x, y, c, r);
        } else {
          let cache = null;
          if (tile === 0) cache = this._tileCache['grass'];
          else if (tile === 2) cache = this._tileCache['dirt'];
          else if (tile === 3) cache = this._tileCache['sand'];
          else if (tile === 4) cache = this._tileCache['tree'];

          if (cache) {
            ctx.drawImage(cache[v], x, y);
          } else {
            // Fallback for unknown tile types
            ctx.fillStyle = this.tileColors[tile] || '#2d5a27';
            ctx.fillRect(x, y, ts, ts);
          }
        }
      }
    }

    // Render collision layer (walls)
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tile = this.getTile('collision', c, r);
        if (tile === 1) {
          // Check if ground tile is a tree/building — don't draw wall bricks over it
          const groundTile = this.getTile('ground', c, r);
          if (groundTile === 4) {
            const v = this._getVariant(c, r);
            ctx.drawImage(this._tileCache['tree'][v], c * ts, r * ts);
          } else {
            const v = this._getVariant(c, r);
            ctx.drawImage(this._tileCache['wall'][v], c * ts, r * ts);
          }
        }
      }
    }

    // Render objects layer
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tile = this.getTile('objects', c, r);
        if (tile > 0) {
          const objColor = this.tileColors['obj_' + tile] || '#FFD700';
          const x = c * ts;
          const y = r * ts;
          const pad = 2;
          // Glowing base shadow
          ctx.fillStyle = 'rgba(255,215,0,0.15)';
          ctx.fillRect(x, y, ts, ts);
          // Object body
          ctx.fillStyle = objColor;
          ctx.fillRect(x + pad, y + pad, ts - pad * 2, ts - pad * 2);
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + pad + 1, y + pad + 1, 3, 2);
          // Shadow edge
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(x + pad, y + ts - pad - 1, ts - pad * 2, 1);
          ctx.fillRect(x + ts - pad - 1, y + pad, 1, ts - pad * 2);
        }
      }
    }
  }

  _renderWater(ctx, x, y, col, row) {
    const ts = this.tileSize;
    // Base water color
    ctx.fillStyle = this.tileColors[5] || '#2a6fbd';
    ctx.fillRect(x, y, ts, ts);
    // Animated sine-wave highlight ripple
    const phase = this._waterPhase;
    for (let py = 0; py < ts; py += 3) {
      const wave = Math.sin(phase + col * 0.7 + py * 0.3) * 2;
      const alpha = 0.15 + Math.sin(phase * 0.8 + row * 0.5 + py * 0.2) * 0.08;
      ctx.fillStyle = `rgba(150,220,255,${alpha})`;
      ctx.fillRect(x + wave + 2, y + py, ts - 4, 2);
    }
    // Edge foam
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y, ts, 1);
  }
}

window.TileMap = TileMap;
