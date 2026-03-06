// ===== UI SYSTEM =====
// HUD, dialogs, win/lose screens with celebrations for retro games

class GameUI {
  constructor(engine) {
    this.engine = engine;
    this.ctx = engine.ctx;
    this.dialog = null;
    this.dialogTimer = 0;
    this.notification = null;
    this.notificationTimer = 0;
    this.winScreen = false;
    this.loseScreen = false;
    this.hudItems = [];
    this._winTimer = 0;
    this._fireworkTimer = 0;
    this._confettiDone = false;
  }

  // === HUD ===
  setHUD(items) {
    this.hudItems = items;
  }

  renderHUD() {
    const ctx = this.ctx;
    // Top bar background with gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 32);
    grad.addColorStop(0, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.engine.width, 32);
    // Bottom border glow
    ctx.fillStyle = 'rgba(232,85,58,0.4)';
    ctx.fillRect(0, 31, this.engine.width, 1);

    let x = 10;
    this.hudItems.forEach(item => {
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = item.color || '#FFD700';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon || item.label, x, 16);
      x += ctx.measureText(item.icon || item.label).width + 3;
      ctx.fillStyle = '#fff';
      ctx.fillText(String(item.value), x, 16);
      x += ctx.measureText(String(item.value)).width + 18;
    });

    // Sound toggle indicator (right side)
    const audio = window.retroAudio;
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = audio && audio.enabled ? '#22C55E' : '#dc2626';
    ctx.textAlign = 'right';
    ctx.fillText(audio && audio.enabled ? 'SND ON' : 'SND OFF', this.engine.width - 10, 16);
  }

  // === DIALOG BOX ===
  showDialog(text, duration = 3) {
    this.dialog = text;
    this.dialogTimer = duration;
    if (this.engine.audio) this.engine.audio.dialog();
  }

  renderDialog(dt) {
    if (!this.dialog) return;
    this.dialogTimer -= dt;
    if (this.dialogTimer <= 0) { this.dialog = null; return; }

    const ctx = this.ctx;
    const w = this.engine.width;
    const boxH = 80;
    const boxY = this.engine.height - boxH - 12;
    const boxX = 16;
    const boxW = w - 32;

    // Slide in animation
    const slideIn = Math.min(1, (3.5 - this.dialogTimer + 0.5) * 4);
    const offsetY = (1 - slideIn) * boxH;
    const drawY = boxY + offsetY;

    // Box background with gradient
    const grad = ctx.createLinearGradient(boxX, drawY, boxX, drawY + boxH);
    grad.addColorStop(0, 'rgba(10,10,30,0.92)');
    grad.addColorStop(1, 'rgba(20,20,50,0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(boxX, drawY, boxW, boxH);
    // Borders
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, drawY, boxW, boxH);
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 4, drawY + 4, boxW - 8, boxH - 8);
    // Corner decorations
    ctx.fillStyle = '#FFD700';
    [[boxX+1,drawY+1],[boxX+boxW-5,drawY+1],[boxX+1,drawY+boxH-5],[boxX+boxW-5,drawY+boxH-5]].forEach(([cx,cy])=>{
      ctx.fillRect(cx,cy,4,4);
    });

    // Typewriter text effect
    const elapsed = 3.5 - this.dialogTimer;
    const charsShown = Math.floor(elapsed * 40);
    const visibleText = this.dialog.substring(0, charsShown);

    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    this._wrapText(visibleText, boxX + 14, drawY + 14, boxW - 28, 18);
  }

  // === NOTIFICATION (top center, animated) ===
  showNotification(text, duration = 2) {
    this.notification = text;
    this.notificationTimer = duration;
  }

  renderNotification(dt) {
    if (!this.notification) return;
    this.notificationTimer -= dt;
    if (this.notificationTimer <= 0) { this.notification = null; return; }

    const ctx = this.ctx;
    ctx.font = 'bold 16px monospace';
    const tw = ctx.measureText(this.notification).width;
    const px = 18, py = 8;
    const bx = this.engine.width / 2 - tw / 2 - px;
    const totalH = 32 + py * 2;

    // Bounce in
    const age = 2 - this.notificationTimer + (this.notificationTimer > 1.8 ? 0 : 0.2);
    const bounce = age < 0.15 ? Math.sin(age / 0.15 * Math.PI) * 8 : 0;

    const alpha = Math.min(1, this.notificationTimer * 2);
    ctx.globalAlpha = alpha;

    // Background pill
    ctx.fillStyle = '#E8553A';
    const pillY = 38 + bounce;
    ctx.beginPath();
    ctx.roundRect(bx, pillY, tw + px * 2, totalH, 8);
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(bx + 2, pillY + 2, tw + px * 2 - 4, totalH / 2, [6,6,0,0]);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.notification, this.engine.width / 2, pillY + totalH / 2);
    ctx.globalAlpha = 1;
  }

  // === WIN SCREEN (with fireworks + confetti) ===
  showWin(title, subtitle, celebration) {
    this.winScreen = { title: title || 'YOU WIN!', subtitle: subtitle || '' };
    this._winTimer = 0;
    this._confettiDone = false;
    this._fireworkTimer = 0;
    if (this.engine.audio) {
      if (celebration) this.engine.audio.win(celebration);
      else this.engine.audio.win();
    }
  }

  showLose(title, subtitle) {
    this.loseScreen = { title: title || 'GAME OVER', subtitle: subtitle || 'Press R to retry' };
    if (this.engine.audio) this.engine.audio.lose();
  }

  renderEndScreen() {
    const screen = this.winScreen || this.loseScreen;
    if (!screen) return false;

    const ctx = this.ctx;
    const w = this.engine.width;
    const h = this.engine.height;
    const dt = this.engine.deltaTime;

    this._winTimer += dt;

    if (this.winScreen) {
      // Animated gradient overlay
      const alpha = Math.min(0.88, this._winTimer * 2);
      ctx.fillStyle = `rgba(15,25,15,${alpha})`;
      ctx.fillRect(0, 0, w, h);

      // Fireworks!
      this._fireworkTimer -= dt;
      if (this._fireworkTimer <= 0 && this._winTimer < 6) {
        this._fireworkTimer = 0.4 + Math.random() * 0.5;
        this.engine.particles.firework(
          100 + Math.random() * (w - 200),
          80 + Math.random() * (h / 2)
        );
      }

      // Initial confetti burst
      if (!this._confettiDone && this._winTimer > 0.3) {
        this._confettiDone = true;
        this.engine.particles.confetti(w / 2, h / 3, 120);
        this.engine.particles.confetti(w / 4, h / 4, 40);
        this.engine.particles.confetti(w * 3 / 4, h / 4, 40);
      }

      // Continuous stars
      if (Math.random() < 0.15) {
        this.engine.particles.starBurst(w, h);
      }

      // Title with glow
      const titleScale = Math.min(1, this._winTimer * 3);
      ctx.save();
      ctx.translate(w / 2, h / 2 - 30);
      ctx.scale(titleScale, titleScale);
      // Glow
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20 + Math.sin(this._winTimer * 3) * 10;
      ctx.font = 'bold 42px monospace';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(screen.title, 2, 2);
      ctx.fillStyle = '#FFD700';
      ctx.fillText(screen.title, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();

      // Subtitle
      if (screen.subtitle && this._winTimer > 0.8) {
        const subAlpha = Math.min(1, (this._winTimer - 0.8) * 2);
        ctx.globalAlpha = subAlpha;
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(screen.subtitle, w / 2, h / 2 + 25);

        // Close hint
        if (this._winTimer > 2) {
          ctx.font = '13px monospace';
          ctx.fillStyle = '#aaa';
          ctx.fillText('Click outside to close', w / 2, h / 2 + 60);
        }
        ctx.globalAlpha = 1;
      }
    } else {
      // Lose screen
      ctx.fillStyle = 'rgba(30,5,5,0.88)';
      ctx.fillRect(0, 0, w, h);

      // Shake effect on title
      const shakeX = this._winTimer < 0.5 ? (Math.random() - 0.5) * 6 : 0;
      ctx.font = 'bold 44px monospace';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(screen.title, w / 2 + 2 + shakeX, h / 2 - 20 + 2);
      ctx.fillStyle = '#dc2626';
      ctx.fillText(screen.title, w / 2 + shakeX, h / 2 - 20);

      if (screen.subtitle) {
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(screen.subtitle, w / 2, h / 2 + 30);
      }

      // Retry prompt (blinking, works on mobile too)
      if (this._winTimer > 0.8) {
        const blink = Math.sin(Date.now() / 400) > 0;
        if (blink) {
          ctx.font = 'bold 14px monospace';
          ctx.fillStyle = '#FFD700';
          ctx.fillText(this.engine.isMobile ? 'TAP TO RETRY' : 'PRESS R TO RETRY', w / 2, h / 2 + 65);
        }
      }
    }

    return true;
  }

  // === TITLE SCREEN ===
  renderTitle(title, subtitle, prompt) {
    const ctx = this.ctx;
    const w = this.engine.width;
    const h = this.engine.height;
    const mobile = this.engine.isMobile;
    // Scale text sizes relative to canvas height (480 = baseline)
    const s = Math.min(h / 480, w / 480);
    const titleSize = Math.round(28 * s);
    const subSize = Math.round(14 * s);
    const promptSize = Math.round(15 * s);
    const hintSize = Math.round(11 * s);
    const titleLineH = Math.round(34 * s);
    const subLineH = Math.round(20 * s);

    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, w, h);

    // Animated background stars
    for (let i = 0; i < 50; i++) {
      const sx = (i * 137 + Math.sin(Date.now() / 2000 + i) * 20) % w;
      const sy = (i * 97 + Math.cos(Date.now() / 3000 + i) * 15) % h;
      const twinkle = Math.sin(Date.now() / 500 + i * 0.7) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.6})`;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Scanline effect
    for (let i = 0; i < h; i += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, i, w, 1);
    }

    // Title with glow
    ctx.save();
    ctx.shadowColor = '#E8553A';
    ctx.shadowBlur = 15 + Math.sin(Date.now() / 600) * 5;
    ctx.font = `bold ${titleSize}px monospace`;
    ctx.fillStyle = '#E8553A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const words = title.split(' ');
    let lines = [''];
    words.forEach(word => {
      const test = lines[lines.length-1] + (lines[lines.length-1]?' ':'') + word;
      if (ctx.measureText(test).width > w - 60) lines.push(word);
      else lines[lines.length-1] = test;
    });
    lines.forEach((line, i) => {
      const ly = h / 2 - 50 * s + (i - (lines.length-1)/2) * titleLineH;
      ctx.fillText(line, w / 2, ly);
    });
    ctx.shadowBlur = 0;
    ctx.restore();

    // Subtitle with word wrap
    ctx.font = `bold ${subSize}px monospace`;
    ctx.fillStyle = '#F4A623';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const subWords = (subtitle || '').split(' ');
    let subLines = [''];
    subWords.forEach(word => {
      const test = subLines[subLines.length-1] + (subLines[subLines.length-1]?' ':'') + word;
      if (ctx.measureText(test).width > w - 80) subLines.push(word);
      else subLines[subLines.length-1] = test;
    });
    subLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, h / 2 + 15 * s + i * subLineH);
    });

    // Blinking prompt
    const promptY = h / 2 + 15 * s + subLines.length * subLineH + 30 * s;
    const blink = Math.sin(Date.now() / 400) > 0;
    if (blink) {
      ctx.font = `bold ${promptSize}px monospace`;
      ctx.fillStyle = '#888';
      const defaultPrompt = mobile ? 'TOUCH TO START' : 'PRESS SPACE TO START';
      ctx.fillText(prompt || defaultPrompt, w / 2, promptY);
    }

    // Controls hint
    const hintY = promptY + 28 * s;
    ctx.font = `${hintSize}px monospace`;
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.fillText(mobile ? 'Use on-screen controls to move' : 'Arrow keys to move, SPACE to interact', w / 2, hintY);
    if (!mobile) ctx.fillText('M = toggle sound', w / 2, hintY + 15 * s);
  }

  // === HINTS SYSTEM ===
  setObjectives(list) {
    // list: [{ x, y, label, text }] — world-space positions
    this._objectives = list;
    this._currentObjective = 0;
    this._objectiveText = list.length > 0 ? list[0].text : '';
  }

  advanceObjective() {
    this._currentObjective = (this._currentObjective || 0) + 1;
    if (this._objectives && this._currentObjective < this._objectives.length) {
      this._objectiveText = this._objectives[this._currentObjective].text;
    } else {
      this._objectiveText = '';
    }
  }

  renderHints(camera) {
    if (!this._objectives || this._objectives.length === 0) return;
    const ctx = this.ctx;
    const w = this.engine.width;
    const h = this.engine.height;
    const current = this._currentObjective || 0;

    // Draw numbered badges on all remaining objectives
    for (let i = current; i < this._objectives.length; i++) {
      const obj = this._objectives[i];
      const screenX = obj.x - camera.x + 8;
      const screenY = obj.y - camera.y - 6;
      const isCurrent = (i === current);

      // Only draw badge if on screen
      if (screenX > -20 && screenX < w + 20 && screenY > -20 && screenY < h + 20) {
        const pulse = isCurrent ? Math.sin(Date.now() / 300) * 2 : 0;
        const radius = 8;
        // Gold circle
        ctx.beginPath();
        ctx.arc(screenX, screenY + pulse, radius, 0, Math.PI * 2);
        ctx.fillStyle = isCurrent ? '#FFD700' : 'rgba(255,215,0,0.5)';
        ctx.fill();
        ctx.strokeStyle = isCurrent ? '#fff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Number
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), screenX, screenY + pulse);
      }
    }

    // Directional arrow when current objective is off-screen
    if (current < this._objectives.length) {
      const obj = this._objectives[current];
      const targetX = obj.x - camera.x + 8;
      const targetY = obj.y - camera.y + 8;
      const margin = 30;

      if (targetX < -10 || targetX > w + 10 || targetY < -10 || targetY > h + 10) {
        // Clamp to screen edge
        const cx = w / 2;
        const cy = h / 2;
        const angle = Math.atan2(targetY - cy, targetX - cx);
        const edgeX = Math.max(margin, Math.min(w - margin, cx + Math.cos(angle) * (w / 2 - margin)));
        const edgeY = Math.max(margin + 32, Math.min(h - margin, cy + Math.sin(angle) * (h / 2 - margin)));

        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(angle);
        ctx.globalAlpha = pulse;
        // Arrow shape
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-4, -6);
        ctx.lineTo(-4, 6);
        ctx.closePath();
        ctx.fill();
        // Arrow outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    // Objective text bar at top (below HUD)
    if (this._objectiveText) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 32, w, 22);
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this._objectiveText, w / 2, 43);
    }
  }

  _wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (const word of words) {
      const testLine = line + word + ' ';
      if (this.ctx.measureText(testLine).width > maxWidth && line) {
        this.ctx.fillText(line.trim(), x, cy);
        line = word + ' ';
        cy += lineHeight;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line.trim(), x, cy);
  }
}

window.GameUI = GameUI;
