// ===== TILE MAP SYSTEM =====
// Renders 16x16 tile-based maps with multiple layers

class TileMap {
  constructor(mapData, tileSize = 16) {
    this.tileSize = tileSize;
    this.cols = mapData.cols;
    this.rows = mapData.rows;
    this.layers = mapData.layers; // { ground: [], collision: [], objects: [] }
    this.tileColors = mapData.tileColors || {};
    this.tileChars = mapData.tileChars || {};
  }

  getTile(layer, col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 1; // Treat OOB as solid
    return this.layers[layer][row * this.cols + col];
  }

  isSolid(worldX, worldY) {
    const col = Math.floor(worldX / this.tileSize);
    const row = Math.floor(worldY / this.tileSize);
    return this.getTile('collision', col, row) === 1;
  }

  isSolidRect(x, y, w, h) {
    // Check all four corners + midpoints
    const points = [
      [x, y], [x + w - 1, y],
      [x, y + h - 1], [x + w - 1, y + h - 1],
      [x + w / 2, y], [x + w / 2, y + h - 1],
      [x, y + h / 2], [x + w - 1, y + h / 2]
    ];
    return points.some(([px, py]) => this.isSolid(px, py));
  }

  render(ctx, camera, viewW, viewH) {
    const ts = this.tileSize;
    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endCol = Math.min(this.cols, Math.ceil((camera.x + viewW) / ts) + 1);
    const endRow = Math.min(this.rows, Math.ceil((camera.y + viewH) / ts) + 1);

    // Render ground layer
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tile = this.getTile('ground', c, r);
        const color = this.tileColors[tile] || '#2d5a27';
        ctx.fillStyle = color;
        ctx.fillRect(c * ts, r * ts, ts, ts);

        // Add subtle grid lines for retro feel
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(c * ts, r * ts, ts, 1);
        ctx.fillRect(c * ts, r * ts, 1, ts);

        // Draw tile decoration character
        if (this.tileChars[tile]) {
          ctx.font = `${ts - 4}px monospace`;
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.tileChars[tile], c * ts + ts / 2, r * ts + ts / 2);
        }
      }
    }

    // Render collision layer visual hints (walls, obstacles)
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tile = this.getTile('collision', c, r);
        if (tile === 1) {
          const color = this.tileColors['wall'] || '#4a3728';
          ctx.fillStyle = color;
          ctx.fillRect(c * ts, r * ts, ts, ts);
          // Brick pattern
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(c * ts, r * ts + ts / 2, ts, 1);
          ctx.fillRect(c * ts + ts / 2, r * ts, 1, ts / 2);
          ctx.fillRect(c * ts, r * ts + ts / 2 + 1, 1, ts / 2);
        }
      }
    }

    // Render objects layer
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tile = this.getTile('objects', c, r);
        if (tile > 0) {
          const objColor = this.tileColors['obj_' + tile] || '#FFD700';
          ctx.fillStyle = objColor;
          const pad = 2;
          ctx.fillRect(c * ts + pad, r * ts + pad, ts - pad * 2, ts - pad * 2);
          // Sparkle effect
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(c * ts + pad + 2, r * ts + pad + 2, 3, 3);
        }
      }
    }
  }
}

window.TileMap = TileMap;
