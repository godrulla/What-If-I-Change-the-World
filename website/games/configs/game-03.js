// ===== GAME 03: PLASTIC BAGS AND FISH =====
// Side-scroll ocean: Boat scoops plastic, avoid harming fish

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  window.GAME_CONFIGS['game-03'] = {
    bgColor: '#0a4a7a',
    buildTileMap() { return null; }, // No tilemap - open ocean

    onInit(engine) {
      const lang = window.lang || 'en';
      engine.gameState = {
        phase: 'title', lang, score: 0, goal: 20, lives: 3,
        spawnTimer: 0, items: [], speed: 80, timeLeft: 90
      };
      engine.player = engine.addEntity(new Sprite({ x: 60, y: 240, w: 32, h: 16, speed: 150, color: '#8B4513' }));
      engine.player.render = function(ctx) {
        const x=Math.floor(this.x), y=Math.floor(this.y);
        ctx.fillStyle='#8B4513'; ctx.fillRect(x,y+4,32,10); // hull
        ctx.fillStyle='#A0522D'; ctx.fillRect(x+8,y,4,6); // mast
        ctx.fillStyle='#fff'; ctx.fillRect(x+12,y+1,10,5); // sail
        ctx.fillStyle='#FFD700'; ctx.fillRect(x+28,y+6,6,3); // net
      };
      engine._dustEmitter = engine.particles.addEmitter({ type: 'dust', rate: 0.12, follow: engine.player }); engine._dustEmitter.active = false;
      engine.particles.addEmitter({ type: 'bubble', rate: 0.3, x: 320, y: 460, canvasW: 640, canvasH: 480 });
      engine.ui = new GameUI(engine);
    },

    onUpdate(engine, dt) {
      const st = engine.gameState;
      if (st.phase==='title') { if (engine.keys['Space']||engine.keys['Enter']) { st.phase='playing'; engine.audio.click(); engine.audio.startMusic('fish'); engine.ui.showDialog(st.lang==='en'?'Scoop plastic from the ocean! Avoid the fish!':'Recoge el plastico del oceano! Evita los peces!',3); } return; }
      if (st.phase==='win'||st.phase==='lose') return;

      const input = engine.getInput();
      engine.player.y = Math.max(30, Math.min(engine.height - 40, engine.player.y + input.dy * engine.player.speed * dt));
      engine.player.x = Math.max(10, Math.min(200, engine.player.x + input.dx * engine.player.speed * dt));
      if (input.dx!==0||input.dy!==0) { engine._dustEmitter.active=true; engine.playStep(); } else { engine._dustEmitter.active=false; }

      // Spawn items
      st.spawnTimer -= dt;
      if (st.spawnTimer <= 0) {
        st.spawnTimer = 0.6 + Math.random() * 0.4;
        const isFish = Math.random() < 0.40;
        const item = engine.addEntity(new Sprite({
          x: engine.width + 10,
          y: 40 + Math.random() * (engine.height - 100),
          w: isFish ? 16 : 12, h: isFish ? 10 : 12,
          color: isFish ? '#FF6347' : '#888',
          type: isFish ? 'fish' : 'plastic'
        }));
        item.vx = -(st.speed + Math.random() * 30);
        item.isFish = isFish;
        const origRender = item.render.bind(item);
        item.render = function(ctx) {
          if (!this.visible) return;
          const x=Math.floor(this.x), y=Math.floor(this.y);
          if (this.isFish) {
            ctx.fillStyle='#FF6347'; ctx.fillRect(x+4,y,10,8); // body
            ctx.fillStyle='#FF4500'; ctx.fillRect(x,y+2,5,4); // tail
            ctx.fillStyle='#000'; ctx.fillRect(x+12,y+2,2,2); // eye
          } else {
            ctx.fillStyle = Math.random()>0.5?'#aaa':'#bbb';
            ctx.fillRect(x,y,10,10);
            ctx.fillStyle='rgba(0,0,0,0.2)';
            ctx.fillRect(x+2,y+2,6,6);
          }
        };
        st.items.push(item);
      }

      // Move items
      for (let i = st.items.length-1; i >= 0; i--) {
        const item = st.items[i];
        item.x += item.vx * dt;
        if (item.x < -20) { engine.removeEntity(item); st.items.splice(i,1); continue; }
        if (item.active && CollisionSystem.aabb(engine.player, item)) {
          if (item.isFish) {
            st.lives--;
            engine.audio.hurt(); engine.shake(5, 0.2);
            engine.ui.showNotification(st.lang==='en'?'Careful! That was a fish!':'Cuidado! Eso era un pez!',1.5);
            if (st.lives<=0) { st.phase='lose'; engine.audio.stopMusic(); engine.ui.showLose(st.lang==='en'?'TOO MANY FISH CAUGHT':'DEMASIADOS PECES ATRAPADOS',st.lang==='en'?'Press R to retry':'Presiona R para reintentar'); }
          } else {
            st.score++;
            engine.audio.collect(); engine.shake(3, 0.15); engine.particles.sparkle(item.x, item.y, '#87CEEB', 20);
            engine.ui.showNotification(`+1`,0.5);
            if (st.score>=st.goal) { st.phase='win'; engine.audio.stopMusic(); engine.ui.showWin(st.lang==='en'?'OCEAN CLEANED!':'OCEANO LIMPIO!',st.lang==='en'?'The fish are safe!':'Los peces estan a salvo!', 'wave'); }
          }
          item.active=false; item.visible=false; engine.removeEntity(item); st.items.splice(i,1);
        }
      }

      // Timer
      st.timeLeft -= dt;
      if (st.timeLeft <= 0) { st.phase = 'lose'; engine.audio.stopMusic(); engine.ui.showLose(st.lang === 'en' ? 'TIME UP!' : 'SE ACABO EL TIEMPO!', st.lang === 'en' ? 'Press R to retry' : 'Presiona R'); return; }

      // Speed up over time
      st.speed = 80 + engine.gameTime * 3;

      // Retry
      if (st.phase==='lose' && engine.keys['KeyR']) {
        engine.stop();
        const overlay = document.getElementById('gameOverlay');
        overlay.classList.remove('active');
        setTimeout(() => openGame(2), 100);
      }

      engine.ui.setHUD([
        {icon:'Plastic: ',value:`${st.score}/${st.goal}`,color:'#87CEEB'},
        {icon:'Lives: ',value:`${'<3 '.repeat(st.lives)}`,color:'#FF6347'},
        {icon:'Time: ',value:Math.ceil(st.timeLeft)+'s',color:st.timeLeft<20?'#dc2626':'#fff'}
      ]);
    },

    onRender(engine, ctx) {
      const st=engine.gameState;
      if (st.phase==='title') { engine.ui.renderTitle(st.lang==='en'?'PLASTIC BAGS AND FISH':'BOLSAS DE PLASTICO Y PECES',st.lang==='en'?'Clean the ocean without catching fish':'Limpia el oceano sin atrapar peces'); return; }

      // Ocean waves background
      for (let y=0;y<engine.height;y+=20) {
        const wave = Math.sin(engine.gameTime*2+y*0.1)*5;
        ctx.fillStyle = y%40===0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
        ctx.fillRect(wave, y, engine.width, 10);
      }

      if (engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD(); engine.ui.renderDialog(engine.deltaTime); engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
