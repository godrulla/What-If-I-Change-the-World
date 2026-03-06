// ===== PARTICLE SYSTEM =====
// Confetti, sparkles, fireworks, and environmental effects

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.emitters = [];
  }

  clear() {
    this.particles = [];
    this.emitters = [];
  }

  // === PARTICLE TYPES ===

  // Confetti burst (win celebration)
  confetti(x, y, count = 80) {
    const colors = ['#E8553A', '#F4A623', '#3AAFB9', '#7B68EE', '#22C55E', '#FFD700', '#FF69B4', '#fff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 250;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 150,
        w: 4 + Math.random() * 6,
        h: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 2 + Math.random() * 1.5,
        maxLife: 3.5,
        gravity: 120 + Math.random() * 80,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 600,
        type: 'confetti'
      });
    }
  }

  // Firework burst
  firework(x, y) {
    const color = ['#E8553A', '#F4A623', '#3AAFB9', '#FFD700', '#FF69B4'][Math.floor(Math.random() * 5)];
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 3, h: 3,
        color,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.3,
        gravity: 40,
        type: 'firework'
      });
    }
    // Trail sparkles
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        w: 2, h: 2,
        color: '#fff',
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        gravity: 0,
        type: 'spark'
      });
    }
  }

  // Sparkle at position (item collect)
  sparkle(x, y, color = '#FFD700', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        w: 2 + Math.random() * 3,
        h: 2 + Math.random() * 3,
        color,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        gravity: 30,
        type: 'spark'
      });
    }
  }

  // Dust trail (walking)
  dust(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 2,
      vx: (Math.random() - 0.5) * 10,
      vy: -5 - Math.random() * 10,
      w: 2 + Math.random() * 2,
      h: 2 + Math.random() * 2,
      color: 'rgba(200,180,140,0.5)',
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      gravity: -5,
      type: 'dust'
    });
  }

  // Leaves / nature ambient
  leaf(canvasW, canvasH) {
    const colors = ['#22C55E', '#16a34a', '#4ade80', '#86efac'];
    this.particles.push({
      x: Math.random() * canvasW,
      y: -10,
      vx: 10 + Math.random() * 20,
      vy: 20 + Math.random() * 30,
      w: 4 + Math.random() * 4,
      h: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 6 + Math.random() * 4,
      maxLife: 10,
      gravity: 2,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 200,
      type: 'leaf',
      sway: Math.random() * 3
    });
  }

  // Bubbles (ocean game)
  bubble(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: -15 - Math.random() * 25,
      w: 3 + Math.random() * 5,
      h: 3 + Math.random() * 5,
      color: 'rgba(255,255,255,0.3)',
      life: 1.5 + Math.random() * 1,
      maxLife: 2.5,
      gravity: -2,
      type: 'bubble'
    });
  }

  // Stars (win screen ambient)
  starBurst(canvasW, canvasH) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: Math.random() * canvasW,
        y: Math.random() * canvasH,
        vx: 0, vy: 0,
        w: 2, h: 2,
        color: '#FFD700',
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        gravity: 0,
        type: 'star',
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  // === EMITTERS (continuous effects) ===

  addEmitter(config) {
    const emitter = {
      x: config.x || 0,
      y: config.y || 0,
      type: config.type || 'sparkle',
      rate: config.rate || 0.1,
      timer: 0,
      color: config.color || '#FFD700',
      active: true,
      follow: config.follow || null,
      canvasW: config.canvasW || 640,
      canvasH: config.canvasH || 480
    };
    this.emitters.push(emitter);
    return emitter;
  }

  removeEmitter(emitter) {
    const idx = this.emitters.indexOf(emitter);
    if (idx !== -1) this.emitters.splice(idx, 1);
  }

  // === UPDATE & RENDER ===

  update(dt) {
    // Update emitters
    this.emitters.forEach(em => {
      if (!em.active) return;
      if (em.follow) { em.x = em.follow.x; em.y = em.follow.y; }
      em.timer -= dt;
      if (em.timer <= 0) {
        em.timer = em.rate;
        if (em.type === 'dust') this.dust(em.x + 8, em.y + 14);
        else if (em.type === 'leaf') this.leaf(em.canvasW, em.canvasH);
        else if (em.type === 'bubble') this.bubble(em.x, em.y);
        else if (em.type === 'star') this.starBurst(em.canvasW, em.canvasH);
        else this.sparkle(em.x, em.y, em.color, 2);
      }
    });

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.vy += (p.gravity || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.rotation !== undefined) p.rotation += (p.rotSpeed || 0) * dt;
      if (p.sway) p.x += Math.sin(p.life * 3) * p.sway;
    }
  }

  render(ctx) {
    this.particles.forEach(p => {
      const alpha = Math.min(1, p.life / (p.maxLife * 0.3));
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'confetti' && p.rotation !== undefined) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.type === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.w / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(p.x - 1, p.y - 1, p.w / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'star') {
        const twinkle = Math.sin((p.twinkle || 0) + Date.now() / 100);
        ctx.globalAlpha = alpha * (0.5 + twinkle * 0.5);
        ctx.fillStyle = p.color;
        // 4-point star
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 4);
        ctx.lineTo(p.x + 1, p.y - 1);
        ctx.lineTo(p.x + 4, p.y);
        ctx.lineTo(p.x + 1, p.y + 1);
        ctx.lineTo(p.x, p.y + 4);
        ctx.lineTo(p.x - 1, p.y + 1);
        ctx.lineTo(p.x - 4, p.y);
        ctx.lineTo(p.x - 1, p.y - 1);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'leaf' && p.rotation !== undefined) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
      }

      ctx.restore();
    });
  }
}

window.ParticleSystem = ParticleSystem;
