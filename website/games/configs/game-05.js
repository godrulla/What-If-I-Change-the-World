// ===== GAME 05: THE WASHING MACHINE OF WHEELS =====
// Top-down collect: Gather parts, assemble a pedal-powered washing machine

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  function generateMap() {
    const cols=50,rows=38;
    const ground=new Array(cols*rows).fill(0);
    const collision=new Array(cols*rows).fill(0);
    const objects=new Array(cols*rows).fill(0);
    for(let c=0;c<cols;c++){collision[c]=1;collision[(rows-1)*cols+c]=1;}
    for(let r=0;r<rows;r++){collision[r*cols]=1;collision[r*cols+cols-1]=1;}
    // Workshop area center
    for(let r=16;r<22;r++) for(let c=22;c<28;c++){ground[r*cols+c]=3;} // workshop floor
    // Build station
    objects[19*cols+25]=9;
    // Junk piles (sand)
    [[3,5,6,4],[40,3,5,4],[5,28,5,5],[38,28,6,4],[20,30,5,4],[15,5,4,5]].forEach(([x,y,w,h])=>{
      for(let r=y;r<y+h;r++) for(let c=x;c<x+w;c++) if(r<rows&&c<cols) ground[r*cols+c]=3;
    });
    // Walls (buildings)
    [[10,12,4,3],[35,12,4,3],[8,22,3,3],[38,22,3,4],[25,5,3,3],[15,25,3,2]].forEach(([x,y,w,h])=>{
      for(let r=y;r<y+h;r++) for(let c=x;c<x+w;c++) if(r<rows&&c<cols){collision[r*cols+c]=1;ground[r*cols+c]=4;}
    });
    // Parts: 1=bicycle wheel, 2=drum, 3=pedals, 4=frame, 5=belt, 6=handle
    objects[7*cols+5]=1; objects[5*cols+42]=2; objects[30*cols+7]=3;
    objects[30*cols+40]=4; objects[32*cols+22]=5; objects[7*cols+17]=6;
    return{cols,rows,ground,collision,objects};
  }

  const PARTS_EN=['','Bicycle Wheel','Drum','Pedals','Frame','Belt','Handle'];
  const PARTS_ES=['','Rueda','Tambor','Pedales','Estructura','Correa','Manija'];
  const PART_COLORS=['','#C0C0C0','#4169E1','#FFD700','#8B4513','#333','#A0522D'];

  window.GAME_CONFIGS['game-05'] = {
    bgColor:'#1a3a1a',
    buildTileMap(){
      const map=generateMap();
      return new TileMap({cols:map.cols,rows:map.rows,layers:{ground:map.ground,collision:map.collision,objects:map.objects},
        tileColors:{0:'#4a8c42',2:'#c4a265',3:'#d4b896',4:'#5a4a3a','wall':'#6B4226',
        'obj_1':'#C0C0C0','obj_2':'#4169E1','obj_3':'#FFD700','obj_4':'#8B4513','obj_5':'#333','obj_6':'#A0522D','obj_9':'#E8553A'}
      },16);
    },
    onInit(engine){
      const lang=window.lang||'en';
      const names=lang==='en'?PARTS_EN:PARTS_ES;
      engine.gameState={phase:'title',lang,parts:[],total:6,names,built:false,timeLeft:90,invincible:0};
      engine.player=engine.addEntity(new Sprite({x:25*16,y:19*16,w:16,h:16,speed:100,color:'#F4A623'}));
      engine.partSprites=[];
      const map=engine.tileMap;
      for(let r=0;r<map.rows;r++) for(let c=0;c<map.cols;c++){
        const obj=map.getTile('objects',c,r);
        if(obj>=1&&obj<=6){
          const s=engine.addEntity(new Sprite({x:c*16,y:r*16,w:16,h:16,color:PART_COLORS[obj],type:'part'}));
          s.partId=obj; s.partName=names[obj];
          s.render=function(ctx){if(!this.visible)return;const x=Math.floor(this.x),y=Math.floor(this.y);const p=Math.sin(Date.now()/300)*0.3+0.7;ctx.globalAlpha=p;ctx.fillStyle=this.color;ctx.fillRect(x+1,y+1,14,14);ctx.fillStyle='#fff';ctx.fillRect(x+3,y+3,4,4);ctx.globalAlpha=1;ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(x+1,y+1,14,14);};
          engine.partSprites.push(s);
        }
      }
      engine.buildSprite=engine.addEntity(new Sprite({x:25*16,y:19*16,w:16,h:16,color:'#E8553A',type:'build'}));
      engine.buildSprite.render=function(ctx){const x=Math.floor(this.x),y=Math.floor(this.y);const p=Math.sin(Date.now()/400)*0.2+0.8;ctx.globalAlpha=p;ctx.fillStyle='#E8553A';ctx.fillRect(x,y,16,16);ctx.fillStyle='#FFD700';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText('BUILD',x+8,y+10);ctx.globalAlpha=1;};
      engine._dustEmitter = engine.particles.addEmitter({ type: 'dust', rate: 0.12, follow: engine.player }); engine._dustEmitter.active = false;

      // Patrol enemies
      engine.patrols = [];
      const patrolData = [[15,10,0,1,5],[35,20,-1,0,4],[10,30,1,0,5]];
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
    },
    onUpdate(engine,dt){
      const st=engine.gameState;
      if(st.phase==='title'){if(engine.keys['Space']||engine.keys['Enter']){st.phase='playing';engine.audio.click();engine.audio.startMusic('machine');engine.ui.showDialog(st.lang==='en'?'Find 6 parts to build a pedal-powered washing machine!':'Encuentra 6 piezas para construir una lavadora a pedales!',4);}return;}
      if(st.phase==='win') return;
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

      engine.partSprites.forEach(part=>{
        if(part.active&&part.visible&&CollisionSystem.aabb(engine.player,part)){
          if (part.partId !== st.parts.length + 1) {
            engine.ui.showNotification(st.lang === 'en' ? `Find part ${st.parts.length + 1} first!` : `Encuentra la pieza ${st.parts.length + 1} primero!`, 1.5);
            return;
          }
          const screenX=part.x-engine.camera.x,screenY=part.y-engine.camera.y;
          part.active=false;part.visible=false;st.parts.push(part.partId);engine.removeEntity(part);
          engine.audio.collect();engine.shake(3,0.15);engine.particles.sparkle(screenX,screenY,part.color,20);
          engine.ui.showNotification(`${part.partName}! (${st.parts.length}/${st.total})`,2);
          if(st.parts.length===st.total) engine.ui.showDialog(st.lang==='en'?'All parts found! Go to the workshop to build!':'Todas las piezas! Ve al taller a construir!',3);
        }
      });
      if(st.parts.length===st.total&&!st.built&&CollisionSystem.aabb(engine.player,engine.buildSprite)){
        st.built=true;st.phase='win';
        engine.audio.stopMusic();
        engine.ui.showWin(st.lang==='en'?'MACHINE BUILT!':'MAQUINA CONSTRUIDA!',st.lang==='en'?'Clean clothes for the village!':'Ropa limpia para el pueblo!', 'march');
      }
      if (st.phase === 'lose' && engine.keys['KeyR']) { engine.stop(); document.getElementById('gameOverlay').classList.remove('active'); setTimeout(() => openGame(4), 100); }

      engine.ui.setHUD([
        {icon:st.lang==='en'?'Parts: ':'Piezas: ',value:`${st.parts.length}/${st.total}`,color:'#F4A623'},
        {icon:'Time: ',value:Math.ceil(st.timeLeft)+'s',color:st.timeLeft<20?'#dc2626':'#fff'}
      ]);
    },
    onRender(engine){
      const st=engine.gameState;
      if(st.phase==='title'){engine.ui.renderTitle(st.lang==='en'?'WASHING MACHINE OF WHEELS':'LAVADORA DE RUEDAS',st.lang==='en'?'Collect parts to build the machine':'Recoge piezas para construir la maquina');return;}
      if(engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD();engine.ui.renderDialog(engine.deltaTime);engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
