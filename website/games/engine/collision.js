// ===== COLLISION DETECTION =====
// AABB collision utilities

class CollisionSystem {
  // Check if two rectangles overlap
  static aabb(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  }

  // Check point inside rect
  static pointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w &&
           py >= rect.y && py <= rect.y + rect.h;
  }

  // Distance between centers of two entities
  static distance(a, b) {
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2, by = b.y + b.h / 2;
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
  }

  // Check player against a list of collectible items
  // Returns array of collected items and removes them
  static checkCollectibles(player, items) {
    const collected = [];
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].active && this.aabb(player, items[i])) {
        items[i].active = false;
        items[i].visible = false;
        collected.push(items[i]);
      }
    }
    return collected;
  }

  // Check if player is near an entity (within radius)
  static isNear(a, b, radius = 24) {
    return this.distance(a, b) < radius;
  }
}

window.CollisionSystem = CollisionSystem;
