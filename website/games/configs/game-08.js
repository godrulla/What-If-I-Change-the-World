// ===== GAME 08: THE SMALLEST ACTIVIST =====
// Side-scroll platformer: Free 5 workers, avoid obstacles

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  window.GAME_CONFIGS['game-08'] = {
    bgColor: '#1a0a2e',
    buildTileMap() { return null; },
    onInit(engine) {
      const lang = window.lang || 'en';
      engine.gameState = {
        phase: 'title', lang, freed: 0, total: 5, lives: 3, timeLeft: 90,
        scrollX: 0, scrollSpeed: 100, platforms: [], workers: [], obstacles: [],
        groundY: 400, jumpVel: 0, onGround: true, gravity: 600
      };
      engine.player = engine.addEntity(new Sprite({ x: 80, y: 384, w: 16, h: 16, speed: 0, color: '#9F1239' }));
      // Generate level
      const st = engine.gameState;
      // Platforms
      for (let i = 0; i < 20; i++) {
        st.platforms.push({ x: 300 + i * 250 + Math.random() * 100, y: 300 + Math.random() * 80, w: 80 + Math.random() * 60, h: 12 });
      }
      // Workers to free
      for (let i = 0; i < 5; i++) {
        const w = engine.addEntity(new Sprite({ x: 500 + i * 600, y: 384, w: 14, h: 14, color: '#FFD700', type: 'worker' }));
        w.freed = false;
        w.origY = 384;
        w.render = function(ctx) {
          if (!this.visible) return;
          const x = Math.floor(this.x - st.scrollX), y = Math.floor(this.y);
          if (x < -20 || x > 660) return;
          ctx.fillStyle = this.freed ? '#22C55E' : '#FFD700';
          ctx.fillRect(x + 2, y + 4, 10, 8);
          ctx.fillStyle = '#FFDAB9';
          ctx.fillRect(x + 3, y, 8, 6);
          if (!this.freed) {
            // Chain
            ctx.fillStyle = '#666';
            ctx.fillRect(x - 4, y + 6, 6, 2);
            ctx.fillRect(x + 10, y + 6, 6, 2);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
            ctx.fillText('HELP', x + 7, y - 4);
          }
        };
        st.workers.push(w);
      }
      // Obstacles
      for (let i = 0; i < 22; i++) {
        st.obstacles.push({ x: 300 + i * 250 + Math.random() * 150, y: 388, w: 16, h: 12, type: 'guard' });
      }
      engine.ui = new GameUI(engine);
    },
    onUpdate(engine, dt) {
      const st = engine.gameState;
      if (st.phase === 'title') { if (engine.keys['Space'] || engine.keys['Enter']) { st.phase = 'playing'; engine.audio.click(); engine.audio.startMusic('activist'); engine.ui.showDialog(st.lang === 'en' ? 'Run right! Free the workers! Jump over guards!' : 'Corre a la derecha! Libera a los trabajadores! Salta sobre los guardias!', 3); } return; }
      if (st.phase === 'win' || st.phase === 'lose') {
        if (engine.keys['KeyR']) { engine.stop(); document.getElementById('gameOverlay').classList.remove('active'); setTimeout(() => openGame(7), 100); }
        return;
      }
      st.timeLeft -= dt;
      if (st.timeLeft <= 0) {
        st.phase = 'lose'; engine.audio.stopMusic();
        engine.ui.showLose(st.lang === 'en' ? 'TIME UP!' : 'SE ACABO EL TIEMPO!', st.lang === 'en' ? 'Press R to retry' : 'Presiona R');
        return;
      }
      const input = engine.getInput();
      // Scroll
      st.scrollX += st.scrollSpeed * dt;
      if (input.dx > 0) st.scrollX += 60 * dt;
      // Jump
      if ((input.dy < 0 || engine.keys['Space']) && st.onGround) {
        st.jumpVel = -280;
        st.onGround = false;
      }
      st.jumpVel += st.gravity * dt;
      engine.player.y += st.jumpVel * dt;
      // Ground check
      if (engine.player.y >= st.groundY - 16) {
        engine.player.y = st.groundY - 16;
        st.jumpVel = 0;
        st.onGround = true;
      }
      // Platform check
      st.platforms.forEach(p => {
        const px = p.x - st.scrollX;
        if (engine.player.x + 16 > px && engine.player.x < px + p.w &&
            engine.player.y + 16 >= p.y && engine.player.y + 16 <= p.y + 8 && st.jumpVel >= 0) {
          engine.player.y = p.y - 16;
          st.jumpVel = 0;
          st.onGround = true;
        }
      });
      // Worker collision
      st.workers.forEach(w => {
        if (!w.freed) {
          const wx = w.x - st.scrollX;
          if (Math.abs(engine.player.x - wx) < 20 && Math.abs(engine.player.y - w.y) < 20) {
            w.freed = true;
            st.freed++;
            engine.audio.collect();
            engine.shake(3, 0.15);
            engine.particles.sparkle(w.x - st.scrollX + 7, w.y + 7, '#FFD700', 20);
            engine.ui.showNotification(st.lang === 'en' ? `Worker freed! ${st.freed}/${st.total}` : `Trabajador liberado! ${st.freed}/${st.total}`, 2);
            if (st.freed >= st.total) {
              st.phase = 'win';
              engine.audio.stopMusic();
              engine.ui.showWin(st.lang === 'en' ? 'ALL WORKERS FREE!' : 'TODOS LIBRES!', st.lang === 'en' ? 'Justice wins!' : 'La justicia gana!', 'march');
            }
          }
        }
      });
      // Obstacle collision
      st.obstacles.forEach(o => {
        const ox = o.x - st.scrollX;
        if (Math.abs(engine.player.x - ox) < 14 && Math.abs(engine.player.y - (o.y - 12)) < 14) {
          st.lives--;
          o.x = -999; // remove
          engine.audio.hurt();
          engine.shake(5, 0.2);
          engine.ui.showNotification(st.lang === 'en' ? 'Caught by guard!' : 'Atrapado por el guardia!', 1.5);
          if (st.lives <= 0) {
            st.phase = 'lose';
            engine.audio.stopMusic();
            engine.ui.showLose(st.lang === 'en' ? 'CAUGHT!' : 'ATRAPADO!', st.lang === 'en' ? 'Press R to retry' : 'Presiona R para reintentar');
          }
        }
      });
      engine.ui.setHUD([
        { icon: st.lang === 'en' ? 'Freed: ' : 'Libres: ', value: `${st.freed}/${st.total}`, color: '#FFD700' },
        { icon: 'Lives: ', value: st.lives, color: '#dc2626' },
        { icon: st.lang === 'en' ? 'Time: ' : 'Tiempo: ', value: Math.ceil(st.timeLeft), color: st.timeLeft < 20 ? '#dc2626' : '#fff' }
      ]);
    },
    onRender(engine, ctx) {
      const st = engine.gameState;
      if (st.phase === 'title') { engine.ui.renderTitle(st.lang === 'en' ? 'THE SMALLEST ACTIVIST' : 'EL ACTIVISTA MAS PEQUENO', st.lang === 'en' ? 'Free workers and dodge guards' : 'Libera trabajadores y esquiva guardias'); return; }
      // Ground
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(0, st.groundY, engine.width, engine.height - st.groundY);
      // Platforms
      st.platforms.forEach(p => {
        const px = p.x - st.scrollX;
        if (px > -100 && px < engine.width + 100) {
          ctx.fillStyle = '#5a4a3a';
          ctx.fillRect(px, p.y, p.w, p.h);
        }
      });
      // Obstacles
      st.obstacles.forEach(o => {
        const ox = o.x - st.scrollX;
        if (ox > -20 && ox < engine.width + 20) {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(ox, o.y - 14, 14, 14);
          ctx.fillStyle = '#000';
          ctx.fillRect(ox + 4, o.y - 10, 2, 2);
          ctx.fillRect(ox + 8, o.y - 10, 2, 2);
        }
      });
      // Player
      const py = Math.floor(engine.player.y);
      ctx.fillStyle = '#9F1239';
      ctx.fillRect(82, py + 4, 12, 10);
      ctx.fillStyle = '#FFDAB9';
      ctx.fillRect(84, py, 8, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(86, py + 2, 2, 2);
      ctx.fillRect(90, py + 2, 2, 2);

      if (engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD(); engine.ui.renderDialog(engine.deltaTime); engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
