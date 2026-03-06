// ===== GAME 12: ACCIDENTAL INVENTIONS =====
// Multi-stage rooms: 5 mini-rooms, each an accidental discovery

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  const INVENTIONS_EN = ['Penicillin', 'Microwave', 'X-Rays', 'Velcro', 'Post-it Notes'];
  const INVENTIONS_ES = ['Penicilina', 'Microondas', 'Rayos X', 'Velcro', 'Post-it'];
  const INV_COLORS = ['#22C55E', '#F4A623', '#7B68EE', '#E8553A', '#eab308'];

  window.GAME_CONFIGS['game-12'] = {
    bgColor: '#1a1a2e',
    buildTileMap() { return null; },
    onInit(engine) {
      const lang = window.lang || 'en';
      const names = lang === 'en' ? INVENTIONS_EN : INVENTIONS_ES;
      engine.gameState = { phase: 'title', lang, room: 0, totalRooms: 5, names, discovered: 0, itemFound: false, roomTimer: 20, invincible: 0 };
      engine.player = engine.addEntity(new Sprite({ x: 100, y: 360, w: 16, h: 16, speed: 110, color: '#059669' }));
      engine.roomObstacles = [];
      for (let i = 0; i < 2; i++) {
        engine.roomObstacles.push({ x: 200 + i * 200, y: 200, vx: 60 + Math.random() * 40, vy: 50 + Math.random() * 40 });
      }
      engine.ui = new GameUI(engine);
    },
    onUpdate(engine, dt) {
      const st = engine.gameState;
      if (st.phase === 'title') { if (engine.keys['Space'] || engine.keys['Enter']) { st.phase = 'playing'; engine.audio.click(); engine.audio.startMusic('inventions'); engine.ui.showDialog(st.lang === 'en' ? 'Explore each room to discover accidental inventions! Find the glowing item.' : 'Explora cada sala para descubrir inventos accidentales! Encuentra el objeto brillante.', 4); } return; }
      if (st.phase === 'win') return;
      if (st.phase === 'lose') { if (engine.keys['KeyR']) { engine.stop(); document.getElementById('gameOverlay').classList.remove('active'); setTimeout(() => openGame(11), 100); } return; }

      st.roomTimer -= dt;
      if (st.roomTimer <= 0) {
        st.room = 0; st.discovered = 0; st.itemFound = false; st.roomTimer = 20;
        engine.player.x = 100; engine.player.y = 360;
        engine.audio.hurt(); engine.shake(5, 0.2);
        engine.ui.showNotification(st.lang === 'en' ? 'Too slow! Back to room 1!' : 'Muy lento! Volver a la sala 1!', 2);
      }
      if (st.invincible > 0) st.invincible -= dt;
      engine.roomObstacles.forEach(o => {
        o.x += o.vx * dt; o.y += o.vy * dt;
        if (o.x < 20 || o.x > 600) o.vx *= -1;
        if (o.y < 60 || o.y > 440) o.vy *= -1;
        if (st.invincible <= 0 && Math.abs(engine.player.x - o.x) < 18 && Math.abs(engine.player.y - o.y) < 18) {
          st.roomTimer -= 5; st.invincible = 1.5;
          engine.audio.hurt(); engine.shake(5, 0.2);
          engine.particles.sparkle(o.x, o.y, '#dc2626', 15);
          engine.ui.showNotification(st.lang === 'en' ? '-5 room seconds!' : '-5 segundos!', 1.5);
        }
      });

      const input = engine.getInput();
      // Simple room movement (bounded)
      engine.player.x = Math.max(20, Math.min(600, engine.player.x + input.dx * engine.player.speed * dt));
      engine.player.y = Math.max(60, Math.min(440, engine.player.y + input.dy * engine.player.speed * dt));

      // Item position per room
      const itemPositions = [[500, 200], [150, 300], [400, 150], [300, 350], [480, 280]];
      const [ix, iy] = itemPositions[st.room];

      if (!st.itemFound && Math.abs(engine.player.x - ix) < 20 && Math.abs(engine.player.y - iy) < 20) {
        st.itemFound = true;
        st.discovered++;
        engine.audio.collect();
        engine.shake(3, 0.15);
        engine.particles.sparkle(ix, iy, INV_COLORS[st.room], 20);
        st.roomTimer = 20;
        engine.ui.showNotification(`${st.names[st.room]}!`, 2);
        if (st.discovered >= st.totalRooms) {
          st.phase = 'win';
          engine.audio.stopMusic();
          engine.ui.showWin(st.lang === 'en' ? 'ALL DISCOVERIES MADE!' : 'TODOS LOS DESCUBRIMIENTOS!', st.lang === 'en' ? 'Accidents can change the world!' : 'Los accidentes pueden cambiar el mundo!', 'sparkle');
        } else {
          setTimeout(() => {
            st.room++;
            st.itemFound = false;
            engine.player.x = 100;
            engine.player.y = 360;
            engine.ui.showDialog(`${st.lang === 'en' ? 'Room' : 'Sala'} ${st.room + 1}: ${st.lang === 'en' ? 'Find the discovery!' : 'Encuentra el descubrimiento!'}`, 2);
          }, 1000);
        }
      }
      engine.ui.setHUD([
        { icon: st.lang === 'en' ? 'Room: ' : 'Sala: ', value: `${st.room + 1}/${st.totalRooms}`, color: '#059669' },
        { icon: st.lang === 'en' ? 'Found: ' : 'Hallados: ', value: `${st.discovered}/${st.totalRooms}`, color: '#FFD700' },
        { icon: st.lang === 'en' ? 'Room Time: ' : 'Tiempo Sala: ', value: Math.ceil(st.roomTimer), color: st.roomTimer < 8 ? '#dc2626' : '#fff' }
      ]);
    },
    onRender(engine, ctx) {
      const st = engine.gameState;
      if (st.phase === 'title') { engine.ui.renderTitle(st.lang === 'en' ? 'ACCIDENTAL INVENTIONS' : 'INVENTOS ACCIDENTALES', st.lang === 'en' ? 'Discover 5 accidental inventions' : 'Descubre 5 inventos accidentales'); return; }

      // Room background
      const roomColors = ['#1a3a2a', '#2a1a3a', '#1a2a3a', '#3a2a1a', '#2a3a1a'];
      ctx.fillStyle = roomColors[st.room] || '#1a1a2e';
      ctx.fillRect(0, 0, engine.width, engine.height);

      // Room walls
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, engine.width, 50);
      ctx.fillRect(0, 450, engine.width, 30);
      ctx.fillRect(0, 0, 15, engine.height);
      ctx.fillRect(625, 0, 15, engine.height);

      // Room label
      ctx.font = 'bold 16px monospace'; ctx.fillStyle = '#666'; ctx.textAlign = 'center';
      ctx.fillText(`${st.lang === 'en' ? 'Room' : 'Sala'} ${st.room + 1}: ${st.names[st.room]}`, engine.width / 2, 35);

      // Lab furniture (random per room)
      ctx.fillStyle = '#444';
      ctx.fillRect(50, 100, 60, 30);
      ctx.fillRect(400, 80, 80, 25);
      ctx.fillRect(250, 400, 70, 20);

      // Item to find (if not found)
      if (!st.itemFound) {
        const itemPositions = [[500, 200], [150, 300], [400, 150], [300, 350], [480, 280]];
        const [ix, iy] = itemPositions[st.room];
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = INV_COLORS[st.room];
        ctx.beginPath(); ctx.arc(ix, iy, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ix, iy, 4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Room obstacles
      engine.roomObstacles.forEach(o => {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(Math.floor(o.x) - 8, Math.floor(o.y) - 8, 16, 16);
        ctx.fillStyle = '#000';
        ctx.fillRect(Math.floor(o.x) - 4, Math.floor(o.y) - 3, 3, 2);
        ctx.fillRect(Math.floor(o.x) + 1, Math.floor(o.y) - 3, 3, 2);
      });

      // Player
      const px = Math.floor(engine.player.x), py = Math.floor(engine.player.y);
      ctx.fillStyle = '#059669';
      ctx.fillRect(px + 2, py + 4, 12, 10);
      ctx.fillStyle = '#FFDAB9';
      ctx.fillRect(px + 4, py, 8, 6);

      if (engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD(); engine.ui.renderDialog(engine.deltaTime); engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
