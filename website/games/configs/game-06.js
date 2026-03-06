// ===== GAME 06: THE GIRL AND THE POISONED WATER =====
// Top-down science: Test water sources, find contamination

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  function generateMap() {
    const cols=50,rows=38;
    const ground=new Array(cols*rows).fill(0);
    const collision=new Array(cols*rows).fill(0);
    const objects=new Array(cols*rows).fill(0);
    for(let c=0;c<cols;c++){collision[c]=1;collision[(rows-1)*cols+c]=1;}
    for(let r=0;r<rows;r++){collision[r*cols]=1;collision[r*cols+cols-1]=1;}
    // River running horizontally
    for(let c=0;c<cols;c++){ground[18*cols+c]=2;ground[19*cols+c]=2;ground[20*cols+c]=2;}
    // Buildings
    [[5,5,4,3],[20,5,3,3],[38,5,4,3],[10,28,3,3],[30,28,4,3],[45,25,3,3]].forEach(([x,y,w,h])=>{
      for(let r=y;r<y+h;r++) for(let c=x;c<x+w;c++) if(r<rows&&c<cols){collision[r*cols+c]=1;ground[r*cols+c]=4;}
    });
    // Water sources to test (objects 1-6), one is contaminated (obj 7 = factory)
    objects[17*cols+8]=1; objects[17*cols+18]=2; objects[17*cols+28]=3;
    objects[17*cols+38]=4; objects[17*cols+45]=5; objects[21*cols+25]=6;
    // Factory (pollution source)
    for(let r=10;r<14;r++) for(let c=33;c<38;c++){collision[r*cols+c]=1;ground[r*cols+c]=4;}
    objects[14*cols+35]=7;
    return{cols,rows,ground,collision,objects};
  }

  // Water source 4 (near factory) is contaminated
  const CONTAMINATED = 4;

  window.GAME_CONFIGS['game-06'] = {
    bgColor:'#1a2a3a',
    buildTileMap(){
      const map=generateMap();
      return new TileMap({cols:map.cols,rows:map.rows,layers:{ground:map.ground,collision:map.collision,objects:map.objects},
        tileColors:{0:'#3d7a37',2:'#2E86AB',3:'#d4b896',4:'#5a4a3a','wall':'#6B4226',
        'obj_1':'#2E86AB','obj_2':'#2E86AB','obj_3':'#2E86AB','obj_4':'#2E86AB','obj_5':'#2E86AB','obj_6':'#2E86AB','obj_7':'#555'}
      },16);
    },
    onInit(engine){
      const lang=window.lang||'en';
      engine.gameState={phase:'title',lang,tested:[],total:6,foundContam:false,timeLeft:75,invincible:0};
      engine.player=engine.addEntity(new Sprite({x:25*16,y:25*16,w:16,h:16,speed:100,color:'#9F1239',skinColor:'#8B5E3C',hairColor:'#1a1a1a',isFemale:true}));
      engine.sources=[];
      const map=engine.tileMap;
      for(let r=0;r<map.rows;r++) for(let c=0;c<map.cols;c++){
        const obj=map.getTile('objects',c,r);
        if(obj>=1&&obj<=6){
          const s=engine.addEntity(new Sprite({x:c*16,y:r*16,w:16,h:16,color:'#2E86AB',type:'source'}));
          s.sourceId=obj; s.tested=false;
          s.render=function(ctx){if(!this.visible)return;const x=Math.floor(this.x),y=Math.floor(this.y);
            ctx.fillStyle=this.tested?(this.sourceId===CONTAMINATED?'#dc2626':'#22C55E'):'#2E86AB';
            const wave=Math.sin(Date.now()/300+this.sourceId)*2;
            ctx.fillRect(x,y+wave,16,16);
            ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(x+2,y+2+wave,6,4);
            if(!this.tested){ctx.fillStyle='#FFD700';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('?',x+8,y-2);}
          };
          engine.sources.push(s);
        }
      }
      engine._dustEmitter = engine.particles.addEmitter({ type: 'dust', rate: 0.12, follow: engine.player }); engine._dustEmitter.active = false;
      engine.particles.addEmitter({ type: 'bubble', rate: 0.5, x: 320, y: 300, canvasW: engine.width, canvasH: engine.height });

      // Patrol enemies
      engine.patrols = [];
      const patrolData = [[15,18,1,0,5],[35,18,-1,0,4],[25,28,0,1,3]];
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

      engine.ui=new GameUI(engine);
      engine.ui.setObjectives([{x:25*16,y:18*16,label:'?',text:lang==='en'?'Test water sources to find contamination':'Prueba fuentes de agua'}]);
    },
    onUpdate(engine,dt){
      const st=engine.gameState;
      if(st.phase==='title'){if(engine.keys['Space']||engine.keys['Enter']){st.phase='playing';engine.audio.click();engine.audio.startMusic('poison');engine.ui.showDialog(st.lang==='en'?'Test all 6 water sources to find the contaminated one! Walk up to each source.':'Prueba las 6 fuentes de agua para encontrar la contaminada! Camina hacia cada fuente.',4);}return;}
      if(st.phase==='win') return;
      if(st.phase==='lose'){if(engine.keys['KeyR']){engine.stop();document.getElementById('gameOverlay').classList.remove('active');setTimeout(()=>openGame(5),100);}return;}
      const input=engine.getInput();
      engine.player.update(dt,input.dx,input.dy,engine.tileMap);
      engine.followCamera(engine.player);
      if(input.dx!==0||input.dy!==0){engine._dustEmitter.active=true;engine.playStep();}else{engine._dustEmitter.active=false;}

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

      engine.sources.forEach(src=>{
        if(!src.tested&&CollisionSystem.isNear(engine.player,src,20)){
          src.tested=true; st.tested.push(src.sourceId);
          const screenX=src.x-engine.camera.x,screenY=src.y-engine.camera.y;
          if(src.sourceId===CONTAMINATED){
            st.foundContam=true;
            engine.audio.hurt(); engine.shake(5,0.2); engine.particles.sparkle(screenX,screenY,'#dc2626',20);
            engine.ui.showNotification(st.lang==='en'?'CONTAMINATED! Factory runoff found!':'CONTAMINADA! Desechos de fabrica!',3);
          } else {
            engine.audio.collect(); engine.particles.sparkle(screenX,screenY,'#22C55E',20);
            engine.ui.showNotification(st.lang==='en'?'Clean! This water is safe.':'Limpia! Esta agua es segura.',1.5);
          }
          if(st.tested.length===st.total){
            st.phase='win';
            engine.audio.stopMusic();
            engine.ui.showWin(st.lang==='en'?'CONTAMINATION FOUND!':'CONTAMINACION ENCONTRADA!',st.lang==='en'?'The town can now fix the problem!':'El pueblo ahora puede resolver el problema!', 'heroic');
          }
        }
      });


      engine.ui.setHUD([
        {icon:st.lang==='en'?'Tested: ':'Probadas: ',value:`${st.tested.length}/${st.total}`,color:'#2E86AB'},
        {icon:st.lang==='en'?'Contaminated: ':'Contaminadas: ',value:st.foundContam?'YES':'...',color:st.foundContam?'#dc2626':'#888'},
        {icon:'Time: ',value:Math.ceil(st.timeLeft)+'s',color:st.timeLeft<20?'#dc2626':'#fff'}
      ]);
    },
    onRender(engine){
      const st=engine.gameState;
      if(st.phase==='title'){engine.ui.renderTitle(st.lang==='en'?'THE GIRL AND THE POISONED WATER':'LA NINA Y EL AGUA ENVENENADA',st.lang==='en'?'Test water sources to find contamination':'Prueba fuentes de agua para encontrar contaminacion');return;}
      if(engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD();engine.ui.renderHints(engine.camera);engine.ui.renderDialog(engine.deltaTime);engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
