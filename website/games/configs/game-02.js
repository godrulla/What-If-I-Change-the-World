// ===== GAME 02: THE BOY AND THE WELL =====
// Side-scroll collect: Gather donations from villagers, dig a well

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  function generateMap() {
    const cols = 80, rows = 30;
    const ground = new Array(cols * rows).fill(0);
    const collision = new Array(cols * rows).fill(0);
    const objects = new Array(cols * rows).fill(0);

    // Ground is mostly dry savanna
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r >= 24) { ground[r * cols + c] = 2; collision[r * cols + c] = 1; } // ground floor
        else if (r >= 22) ground[r * cols + c] = 3; // dirt
        else ground[r * cols + c] = 0;
      }
    }

    // Walls
    for (let c = 0; c < cols; c++) { collision[c] = 1; collision[(rows-1)*cols+c] = 1; }
    for (let r = 0; r < rows; r++) { collision[r*cols] = 1; collision[r*cols+cols-1] = 1; }

    // Houses along the path
    const houses = [[8,18,5,4],[22,17,4,5],[38,16,5,6],[52,18,4,4],[65,17,5,5]];
    houses.forEach(([x,y,w,h]) => {
      for (let r = y; r < y+h && r < rows; r++)
        for (let c = x; c < x+w && c < cols; c++) {
          collision[r*cols+c] = 1;
          ground[r*cols+c] = 4;
        }
    });

    // Donation items near houses (objects 1-8 = coins/donations)
    const donations = [[12,21],[15,20],[26,21],[30,20],[42,21],[45,20],[55,21],[58,20]];
    donations.forEach(([c,r], i) => { objects[r*cols+c] = i+1; });

    // Well location at far right
    objects[21*cols+74] = 9;

    return { cols, rows, ground, collision, objects };
  }

  window.GAME_CONFIGS['game-02'] = {
    bgColor: '#87CEEB',
    buildTileMap() {
      const map = generateMap();
      return new TileMap({
        cols: map.cols, rows: map.rows,
        layers: { ground: map.ground, collision: map.collision, objects: map.objects },
        tileColors: {
          0: '#87CEEB', 2: '#8B7355', 3: '#c4a265', 4: '#5a4a3a',
          'wall': '#6B4226',
          'obj_1':'#FFD700','obj_2':'#FFD700','obj_3':'#FFD700','obj_4':'#FFD700',
          'obj_5':'#FFD700','obj_6':'#FFD700','obj_7':'#FFD700','obj_8':'#FFD700',
          'obj_9':'#2E86AB'
        }
      }, 16);
    },
    onInit(engine) {
      const lang = window.lang || 'en';
      engine.gameState = { phase:'title', coins:0, totalCoins:8, lang, dug:false, timeLeft:90, invincible:0 };
      engine.player = engine.addEntity(new Sprite({ x:32, y:20*16, w:16, h:16, speed:120, color:'#2E86AB', skinColor:'#FFDAB9', hairColor:'#C4A265' }));
      engine.coinSprites = [];
      const map = engine.tileMap;
      for (let r=0;r<map.rows;r++) for (let c=0;c<map.cols;c++) {
        const obj = map.getTile('objects',c,r);
        if (obj>=1 && obj<=8) {
          const s = engine.addEntity(new Sprite({x:c*16,y:r*16,w:16,h:16,color:'#FFD700',type:'coin'}));
          s.render = function(ctx) {
            if (!this.visible) return;
            const px=Math.floor(this.x), py=Math.floor(this.y);
            const bob = Math.sin(Date.now()/350 + px) * 2;
            // Coin body
            ctx.fillStyle='#FFD700';
            ctx.beginPath();
            ctx.arc(px+8,py+8+bob,6,0,Math.PI*2);
            ctx.fill();
            // Coin rim
            ctx.strokeStyle='#B8860B';
            ctx.lineWidth=1;
            ctx.beginPath();
            ctx.arc(px+8,py+8+bob,5,0,Math.PI*2);
            ctx.stroke();
            // Dollar sign
            ctx.fillStyle='#B8860B';
            ctx.font='bold 9px monospace';
            ctx.textAlign='center';
            ctx.textBaseline='middle';
            ctx.fillText('$',px+8,py+8+bob);
          };
          engine.coinSprites.push(s);
        }
      }
      engine.wellSprite = engine.addEntity(new Sprite({x:74*16,y:21*16,w:16,h:16,color:'#2E86AB',type:'well'}));
      engine.wellSprite.render = function(ctx) {
        const x=Math.floor(this.x), y=Math.floor(this.y);
        ctx.fillStyle='#555';
        ctx.fillRect(x+2,y+6,12,10);
        ctx.fillStyle='#2E86AB';
        ctx.fillRect(x+4,y+8,8,6);
        ctx.fillStyle='#333';
        ctx.fillRect(x,y+4,16,3);
      };
      engine._dustEmitter = engine.particles.addEmitter({ type: 'dust', rate: 0.12, follow: engine.player }); engine._dustEmitter.active = false;
      engine.particles.addEmitter({ type: 'leaf', rate: 1.5, canvasW: 640, canvasH: 480 });

      // Patrol enemies
      engine.patrols = [];
      const patrolData = [[18,20,1,0,4],[35,20,-1,0,5],[55,20,1,0,3]];
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
      const st = engine.gameState;
      if (st.phase==='title') { if (engine.keys['Space']||engine.keys['Enter']) { st.phase='playing'; engine.audio.click(); engine.audio.startMusic('well'); engine.ui.showDialog(st.lang==='en'?'Collect donations from the village, then dig the well!':'Recoge donaciones del pueblo y luego cava el pozo!',4); } return; }
      if (st.phase==='win') return;
      if (st.phase === 'lose') { if (engine.keys['KeyR']) { engine.stop(); document.getElementById('gameOverlay').classList.remove('active'); setTimeout(() => openGame(1), 100); } return; }
      const input=engine.getInput();
      engine.player.update(dt,input.dx,input.dy,engine.tileMap);
      engine.followCamera(engine.player);
      if (input.dx!==0||input.dy!==0) { engine._dustEmitter.active=true; engine.playStep(); } else { engine._dustEmitter.active=false; }

      // Timer
      st.timeLeft -= dt;
      if (st.timeLeft <= 0) { st.phase = 'lose'; engine.audio.stopMusic(); engine.ui.showLose(st.lang === 'en' ? 'TIME UP!' : 'SE ACABO EL TIEMPO!', st.lang === 'en' ? 'Press R to retry' : 'Presiona R'); return; }

      // Invincibility cooldown
      if (st.invincible > 0) st.invincible -= dt;

      // Patrol movement + collision
      engine.patrols.forEach(p => {
        p.x += p.dx * 40 * dt;
        p.y += p.dy * 40 * dt;
        if (Math.abs(p.x - p.startX) > p.range) p.dx *= -1;
        if (Math.abs(p.y - p.startY) > p.range) p.dy *= -1;
        if (st.invincible <= 0 && CollisionSystem.aabb(engine.player, p)) {
          st.timeLeft -= 15;
          st.invincible = 1.5;
          engine.audio.hurt();
          engine.shake(5, 0.2);
          engine.particles.sparkle(engine.player.x - engine.camera.x + 8, engine.player.y - engine.camera.y + 8, '#dc2626', 15);
          engine.ui.showNotification(st.lang === 'en' ? '-15 seconds!' : '-15 segundos!', 1.5);
        }
      });

      engine.coinSprites.forEach(coin => {
        if (coin.active&&coin.visible&&CollisionSystem.aabb(engine.player,coin)) {
          const screenX=coin.x-engine.camera.x, screenY=coin.y-engine.camera.y;
          coin.active=false; coin.visible=false; st.coins++;
          engine.removeEntity(coin);
          engine.audio.collect(); engine.shake(3, 0.15); engine.particles.sparkle(screenX, screenY, '#FFD700', 20);
          engine.ui.showNotification(st.lang==='en'?`Donation ${st.coins}/${st.totalCoins}!`:`Donacion ${st.coins}/${st.totalCoins}!`,1.5);
          if (st.coins===st.totalCoins) engine.ui.showDialog(st.lang==='en'?'All donations collected! Go to the well site!':'Todas las donaciones recolectadas! Ve al sitio del pozo!',3);
        }
      });
      if (st.coins===st.totalCoins&&!st.dug&&CollisionSystem.aabb(engine.player,engine.wellSprite)) {
        st.dug=true; st.phase='win';
        engine.audio.stopMusic();
        engine.ui.showWin(st.lang==='en'?'WELL COMPLETE!':'POZO COMPLETO!', st.lang==='en'?'Clean water for everyone!':'Agua limpia para todos!', 'applause');
      }
      engine.ui.setHUD([
        {icon:st.lang==='en'?'Donations: ':'Donaciones: ',value:`${st.coins}/${st.totalCoins}`,color:'#FFD700'},
        {icon:'Time: ',value:Math.ceil(st.timeLeft)+'s',color:st.timeLeft<20?'#dc2626':'#fff'}
      ]);
    },
    onRender(engine) {
      const st=engine.gameState;
      if (st.phase==='title') { engine.ui.renderTitle(st.lang==='en'?'THE BOY AND THE WELL':'EL NINO Y EL POZO',st.lang==='en'?'Collect donations to dig a well':'Recoge donaciones para cavar un pozo'); return; }
      if (engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD(); engine.ui.renderDialog(engine.deltaTime); engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
