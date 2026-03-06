// ===== GAME 01: THE BOY WHO CAUGHT THE WIND =====
// Top-down collect-and-build: Gather 5 windmill parts from scrapyard village

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  function generateMap() {
    const cols = 60, rows = 45;
    const ground = new Array(cols * rows).fill(0);
    const collision = new Array(cols * rows).fill(0);
    const objects = new Array(cols * rows).fill(0);

    // Fill edges with walls
    for (let c = 0; c < cols; c++) { collision[c] = 1; collision[(rows - 1) * cols + c] = 1; }
    for (let r = 0; r < rows; r++) { collision[r * cols] = 1; collision[r * cols + cols - 1] = 1; }

    // Dirt paths (cross shape)
    for (let c = 0; c < cols; c++) { ground[22 * cols + c] = 2; ground[23 * cols + c] = 2; }
    for (let r = 0; r < rows; r++) { ground[r * cols + 30] = 2; ground[r * cols + 31] = 2; }

    // Village huts
    const huts = [
      { x: 5, y: 5, w: 5, h: 4 }, { x: 15, y: 8, w: 4, h: 3 },
      { x: 40, y: 5, w: 6, h: 4 }, { x: 8, y: 30, w: 5, h: 4 },
      { x: 45, y: 32, w: 4, h: 4 }, { x: 20, y: 14, w: 3, h: 3 },
      { x: 50, y: 18, w: 4, h: 3 },
    ];
    huts.forEach(h => {
      for (let r = h.y; r < h.y + h.h; r++)
        for (let c = h.x; c < h.x + h.w; c++)
          if (r < rows && c < cols) { collision[r * cols + c] = 1; ground[r * cols + c] = 4; }
    });

    // Scrapyard areas (sand patches)
    const scraps = [
      { x: 3, y: 15, w: 8, h: 6 }, { x: 48, y: 10, w: 8, h: 5 },
      { x: 10, y: 35, w: 7, h: 5 }, { x: 35, y: 25, w: 6, h: 5 },
      { x: 25, y: 38, w: 7, h: 4 },
    ];
    scraps.forEach(s => {
      for (let r = s.y; r < s.y + s.h; r++)
        for (let c = s.x; c < s.x + s.w; c++)
          if (r < rows && c < cols) ground[r * cols + c] = 3;
    });

    // Trees
    [[12,3],[25,4],[38,3],[52,7],[3,25],[55,25],[18,40],[42,40],
     [8,12],[35,10],[48,38],[55,15],[12,28],[38,35],[28,8],[45,15],
     [10,20],[22,32],[50,28],[15,42],[35,42],[55,40],[3,38],[58,10]].forEach(([c, r]) => {
      if (r < rows && c < cols) { collision[r * cols + c] = 1; ground[r * cols + c] = 4; }
    });

    // Windmill parts (objects 1-5)
    objects[17 * cols + 5] = 1;
    objects[12 * cols + 50] = 2;
    objects[37 * cols + 12] = 3;
    objects[27 * cols + 37] = 4;
    objects[39 * cols + 27] = 5;

    // Tower destination
    objects[15 * cols + 30] = 9;

    return { cols, rows, ground, collision, objects };
  }

  const PART_NAMES_EN = ['', 'Bicycle Wheel', 'Fan Blades', 'Pipes', 'Generator', 'Tower Frame'];
  const PART_NAMES_ES = ['', 'Rueda de Bicicleta', 'Aspas del Ventilador', 'Tuberias', 'Generador', 'Estructura de Torre'];
  const PART_COLORS = ['', '#C0C0C0', '#87CEEB', '#8B7355', '#FFD700', '#A0522D'];

  window.GAME_CONFIGS['game-01'] = {
    bgColor: '#1a3a1a',

    buildTileMap() {
      const map = generateMap();
      return new TileMap({
        cols: map.cols, rows: map.rows,
        layers: { ground: map.ground, collision: map.collision, objects: map.objects },
        tileColors: {
          0: '#3d8b37', 2: '#c4a265', 3: '#d4b896', 4: '#2d6b27',
          'wall': '#5a4a3a',
          'obj_1': '#C0C0C0', 'obj_2': '#87CEEB', 'obj_3': '#8B7355',
          'obj_4': '#FFD700', 'obj_5': '#A0522D', 'obj_9': '#E8553A',
        },
        tileChars: { 4: 'T' }
      }, 16);
    },

    onInit(engine) {
      const lang = window.lang || 'en';
      const partNames = lang === 'en' ? PART_NAMES_EN : PART_NAMES_ES;

      engine.gameState = {
        phase: 'title', partsCollected: [], totalParts: 5,
        partNames, lang, delivered: false, timeLeft: 90, invincible: 0
      };

      // Player
      engine.player = engine.addEntity(new Sprite({
        x: 30 * 16, y: 22 * 16, w: 16, h: 16, speed: 100, color: '#E8553A'
      }));

      // Dust emitter for player movement
      engine._dustEmitter = engine.particles.addEmitter({
        type: 'dust', rate: 0.12, follow: engine.player
      });
      engine._dustEmitter.active = false;

      // Ambient leaves
      engine.particles.addEmitter({
        type: 'leaf', rate: 1.5, canvasW: engine.width, canvasH: engine.height
      });

      // Collectible parts
      engine.partSprites = [];
      const map = engine.tileMap;
      for (let r = 0; r < map.rows; r++) {
        for (let c = 0; c < map.cols; c++) {
          const obj = map.getTile('objects', c, r);
          if (obj >= 1 && obj <= 5) {
            const partSprite = engine.addEntity(new Sprite({
              x: c * 16, y: r * 16, w: 16, h: 16,
              color: PART_COLORS[obj], type: 'part'
            }));
            partSprite.partId = obj;
            partSprite.partName = partNames[obj];
            partSprite.render = function(ctx) {
              if (!this.visible) return;
              const x = Math.floor(this.x), y = Math.floor(this.y);
              const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
              ctx.globalAlpha = pulse;
              ctx.fillStyle = this.color;
              ctx.fillRect(x + 1, y + 1, 14, 14);
              // Shine
              ctx.fillStyle = '#fff';
              ctx.fillRect(x + 3, y + 3, 4, 4);
              ctx.globalAlpha = 1;
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1;
              ctx.strokeRect(x + 1, y + 1, 14, 14);
              // Floating indicator
              const floatY = Math.sin(Date.now() / 400) * 3;
              ctx.fillStyle = '#FFD700';
              ctx.fillRect(x + 6, y - 6 + floatY, 4, 4);
            };
            engine.partSprites.push(partSprite);
          }
        }
      }

      // Tower destination
      engine.towerSprite = engine.addEntity(new Sprite({
        x: 30 * 16, y: 15 * 16, w: 16, h: 16, color: '#E8553A', type: 'tower'
      }));
      engine.towerSprite.render = function(ctx) {
        const x = Math.floor(this.x), y = Math.floor(this.y);
        const pulse = Math.sin(Date.now() / 400) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 3, y + 4, 10, 12);
        ctx.fillStyle = '#E8553A';
        ctx.fillRect(x + 1, y, 14, 6);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 6, y - 4, 4, 4);
        ctx.globalAlpha = 1;
      };

      // Patrol enemies
      engine.patrols = [];
      const patrolData = [[10,18,1,0,5],[45,12,0,1,4],[15,35,-1,0,6],[50,25,1,1,3]];
      patrolData.forEach(([x, y, dx, dy, range]) => {
        const p = engine.addEntity(new Sprite({ x: x*16, y: y*16, w: 14, h: 14, color: '#dc2626', type: 'patrol' }));
        p.startX = x*16; p.startY = y*16; p.dx = dx; p.dy = dy; p.range = range * 16;
        p.render = function(ctx) {
          if (!this.visible) return;
          const px = Math.floor(this.x), py = Math.floor(this.y);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(px + 1, py + 2, 12, 10);
          ctx.fillStyle = '#000';
          ctx.fillRect(px + 3, py + 4, 3, 2);
          ctx.fillRect(px + 8, py + 4, 3, 2);
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(px + 4, py + 9, 6, 2);
        };
        engine.patrols.push(p);
      });

      engine.ui = new GameUI(engine);
    },

    onUpdate(engine, dt) {
      const state = engine.gameState;

      if (state.phase === 'title') {
        if (engine.keys['Space'] || engine.keys['Enter']) {
          state.phase = 'playing';
          engine.audio.click();
          engine.audio.startMusic('wind');
          const msg = state.lang === 'en'
            ? 'Find 5 windmill parts in the scrapyard! Use arrow keys to move.'
            : 'Encuentra 5 piezas del molino en el deposito! Usa las flechas para moverte.';
          engine.ui.showDialog(msg, 4);
        }
        return;
      }

      if (state.phase === 'win') return;

      const input = engine.getInput();
      const wasMoving = engine.player.moving;
      engine.player.update(dt, input.dx, input.dy, engine.tileMap);
      engine.followCamera(engine.player);

      // Movement sounds + dust
      if (engine.player.moving) {
        engine._dustEmitter.active = true;
        engine.playStep();
      } else {
        engine._dustEmitter.active = false;
      }

      // Timer
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) { state.phase = 'lose'; engine.audio.stopMusic(); engine.ui.showLose(state.lang === 'en' ? 'TIME UP!' : 'SE ACABO EL TIEMPO!', state.lang === 'en' ? 'Press R to retry' : 'Presiona R'); return; }

      // Invincibility cooldown
      if (state.invincible > 0) state.invincible -= dt;

      // Patrol movement + collision
      engine.patrols.forEach(p => {
        p.x += p.dx * 40 * dt;
        p.y += p.dy * 40 * dt;
        if (Math.abs(p.x - p.startX) > p.range) p.dx *= -1;
        if (Math.abs(p.y - p.startY) > p.range) p.dy *= -1;
        if (state.invincible <= 0 && CollisionSystem.aabb(engine.player, p)) {
          state.timeLeft -= 15;
          state.invincible = 1.5;
          engine.audio.hurt();
          engine.shake(5, 0.2);
          engine.particles.sparkle(engine.player.x - engine.camera.x + 8, engine.player.y - engine.camera.y + 8, '#dc2626', 15);
          engine.ui.showNotification(state.lang === 'en' ? '-15 seconds!' : '-15 segundos!', 1.5);
        }
      });

      // Check part collection
      engine.partSprites.forEach(part => {
        if (part.active && part.visible && CollisionSystem.aabb(engine.player, part)) {
          if (part.partId !== state.partsCollected.length + 1) {
            engine.ui.showNotification(state.lang === 'en' ? `Find part ${state.partsCollected.length + 1} first!` : `Encuentra la pieza ${state.partsCollected.length + 1} primero!`, 1.5);
            return;
          }
          part.active = false;
          part.visible = false;
          state.partsCollected.push(part.partId);
          engine.removeEntity(part);

          // Effects!
          engine.audio.collect();
          engine.shake(3, 0.15);
          const screenX = part.x - engine.camera.x;
          const screenY = part.y - engine.camera.y;
          engine.particles.sparkle(screenX + 8, screenY + 8, part.color, 20);

          const collected = state.partsCollected.length;
          const msg = state.lang === 'en'
            ? `Found: ${part.partName}! (${collected}/${state.totalParts})`
            : `Encontrado: ${part.partName}! (${collected}/${state.totalParts})`;
          engine.ui.showNotification(msg, 2.5);

          if (collected === state.totalParts) {
            const deliverMsg = state.lang === 'en'
              ? 'All parts found! Go to the tower to build the windmill!'
              : 'Todas las piezas encontradas! Ve a la torre para construir el molino!';
            engine.ui.showDialog(deliverMsg, 4);
          }
        }
      });

      // Tower delivery
      if (state.partsCollected.length === state.totalParts && !state.delivered) {
        if (CollisionSystem.aabb(engine.player, engine.towerSprite)) {
          state.delivered = true;
          state.phase = 'win';
          engine.audio.stopMusic();
          const winTitle = state.lang === 'en' ? 'WINDMILL BUILT!' : 'MOLINO CONSTRUIDO!';
          const winSub = state.lang === 'en'
            ? "William's village has light! You did it!"
            : 'El pueblo de William tiene luz! Lo lograste!';
          engine.ui.showWin(winTitle, winSub, 'heroic');
        }
      }

      if (state.phase === 'lose' && engine.keys['KeyR']) { engine.stop(); document.getElementById('gameOverlay').classList.remove('active'); setTimeout(() => openGame(0), 100); }

      const partsLabel = state.lang === 'en' ? 'Parts: ' : 'Piezas: ';
      engine.ui.setHUD([
        { icon: partsLabel, value: `${state.partsCollected.length}/${state.totalParts}`, color: '#FFD700' },
        { icon: 'Time: ', value: Math.ceil(state.timeLeft) + 's', color: state.timeLeft < 20 ? '#dc2626' : '#fff' }
      ]);
    },

    onRender(engine, ctx) {
      const state = engine.gameState;

      if (state.phase === 'title') {
        const title = state.lang === 'en' ? 'THE BOY WHO CAUGHT THE WIND' : 'EL NINO QUE ATRAPO EL VIENTO';
        const sub = state.lang === 'en' ? 'Collect windmill parts from the scrapyard' : 'Recoge las piezas del molino en el deposito';
        engine.ui.renderTitle(title, sub);
        return;
      }

      if (engine.ui.renderEndScreen()) return;

      engine.ui.renderHUD();
      engine.ui.renderDialog(engine.deltaTime);
      engine.ui.renderNotification(engine.deltaTime);

      // Mini-map
      const mm = { x: engine.width - 110, y: 40, w: 100, h: 75 };
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(mm.x - 2, mm.y - 2, mm.w + 4, mm.h + 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.strokeRect(mm.x - 2, mm.y - 2, mm.w + 4, mm.h + 4);

      const scaleX = mm.w / (engine.tileMap.cols * 16);
      const scaleY = mm.h / (engine.tileMap.rows * 16);

      // Player dot
      ctx.fillStyle = '#E8553A';
      ctx.fillRect(mm.x + engine.player.x * scaleX - 1, mm.y + engine.player.y * scaleY - 1, 3, 3);

      // Part dots
      engine.partSprites.forEach(part => {
        if (part.visible) {
          ctx.fillStyle = '#FFD700';
          const blink = Math.floor(Date.now() / 300) % 2;
          if (blink) ctx.fillRect(mm.x + part.x * scaleX - 1, mm.y + part.y * scaleY - 1, 3, 3);
        }
      });

      // Tower dot
      const blink = Math.floor(Date.now() / 250) % 2;
      if (blink) {
        ctx.fillStyle = '#E8553A';
        ctx.fillRect(mm.x + engine.towerSprite.x * scaleX - 2, mm.y + engine.towerSprite.y * scaleY - 2, 4, 4);
      }

      // Inventory
      if (state.partsCollected.length > 0) {
        const invY = engine.height - 32;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, invY - 4, engine.width, 36);
        let ix = 10;
        state.partsCollected.forEach(pid => {
          ctx.fillStyle = PART_COLORS[pid];
          ctx.fillRect(ix, invY, 22, 22);
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(ix + 2, invY + 2, 8, 4);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(ix, invY, 22, 22);
          ix += 28;
        });
      }
    }
  };
})();
