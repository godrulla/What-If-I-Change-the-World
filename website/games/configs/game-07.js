// ===== GAME 07: THE TREES THAT CHANGED EVERYTHING =====
// Top-down planting: Plant 10 trees before timer expires

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  function generateMap() {
    const cols=50,rows=38;
    const ground=new Array(cols*rows).fill(3); // dry desert
    const collision=new Array(cols*rows).fill(0);
    const objects=new Array(cols*rows).fill(0);
    for(let c=0;c<cols;c++){collision[c]=1;collision[(rows-1)*cols+c]=1;}
    for(let r=0;r<rows;r++){collision[r*cols]=1;collision[r*cols+cols-1]=1;}
    // A few rocks
    [[5,8],[15,5],[30,10],[42,6],[8,25],[35,30],[48,20],[20,35],[40,35],[12,15]].forEach(([c,r])=>{
      if(r<rows&&c<cols){collision[r*cols+c]=1;}
    });
    // Planting spots marked with object 1
    const spots=[[6,6],[14,10],[22,8],[32,6],[44,10],[8,20],[18,25],[28,18],[38,22],[46,30]];
    spots.forEach(([c,r])=>{ objects[r*cols+c]=1; });
    // Water well (refill seeds)
    objects[19*cols+25]=9;
    return{cols,rows,ground,collision,objects};
  }

  window.GAME_CONFIGS['game-07'] = {
    bgColor:'#2a1a0a',
    buildTileMap(){
      const map=generateMap();
      return new TileMap({cols:map.cols,rows:map.rows,layers:{ground:map.ground,collision:map.collision,objects:map.objects},
        tileColors:{0:'#c4a265',2:'#3d8b37',3:'#d4b070',4:'#2d6b27','wall':'#8B7355',
        'obj_1':'#22C55E','obj_9':'#2E86AB'}
      },16);
    },
    onInit(engine){
      const lang=window.lang||'en';
      engine.gameState={phase:'title',lang,planted:0,total:10,seeds:3,maxSeeds:3,timeLeft:45,invincible:0};
      engine.player=engine.addEntity(new Sprite({x:25*16,y:19*16,w:16,h:16,speed:110,color:'#22C55E'}));
      engine.spots=[];
      engine.plantedTrees=[];
      const map=engine.tileMap;
      for(let r=0;r<map.rows;r++) for(let c=0;c<map.cols;c++){
        const obj=map.getTile('objects',c,r);
        if(obj===1){
          const s=engine.addEntity(new Sprite({x:c*16,y:r*16,w:16,h:16,color:'#22C55E',type:'spot'}));
          s.planted=false;
          s.render=function(ctx){if(!this.visible)return;const x=Math.floor(this.x),y=Math.floor(this.y);
            if(this.planted){
              ctx.fillStyle='#4a2a0a';ctx.fillRect(x+6,y+4,4,12); // trunk
              ctx.fillStyle='#22C55E';ctx.beginPath();ctx.arc(x+8,y+4,7,0,Math.PI*2);ctx.fill(); // leaves
            } else {
              ctx.strokeStyle='#22C55E';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.strokeRect(x+2,y+2,12,12);ctx.setLineDash([]);
              ctx.fillStyle='#22C55E';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('PLANT',x+8,y+10);
            }
          };
          engine.spots.push(s);
        }
      }
      // Well sprite
      engine.well=engine.addEntity(new Sprite({x:25*16,y:19*16,w:16,h:16,color:'#2E86AB',type:'well'}));
      engine.well.render=function(ctx){const x=Math.floor(this.x),y=Math.floor(this.y);ctx.fillStyle='#555';ctx.fillRect(x+2,y+4,12,12);ctx.fillStyle='#2E86AB';ctx.fillRect(x+4,y+6,8,8);ctx.fillStyle='#333';ctx.fillRect(x,y+2,16,3);};
      engine._dustEmitter = engine.particles.addEmitter({ type: 'dust', rate: 0.12, follow: engine.player }); engine._dustEmitter.active = false;

      // Patrol enemies
      engine.patrols = [];
      const patrolData = [[15,15,1,0,5],[35,20,-1,0,4],[25,30,0,1,4]];
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
      if(st.phase==='title'){if(engine.keys['Space']||engine.keys['Enter']){st.phase='playing';engine.audio.click();engine.audio.startMusic('trees');engine.ui.showDialog(st.lang==='en'?'Plant 10 trees before time runs out! Get seeds from the well.':'Planta 10 arboles antes de que se acabe el tiempo! Consigue semillas del pozo.',4);}return;}
      if(st.phase==='win'||st.phase==='lose') return;
      st.timeLeft-=dt;
      if(st.timeLeft<=0){st.phase='lose';engine.audio.stopMusic();engine.ui.showLose(st.lang==='en'?'TIME IS UP!':'SE ACABO EL TIEMPO!',st.lang==='en'?`Planted ${st.planted}/${st.total}. Press R to retry.`:`Plantaste ${st.planted}/${st.total}. Presiona R.`);return;}

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

      const input=engine.getInput();
      engine.player.update(dt,input.dx,input.dy,engine.tileMap);
      engine.followCamera(engine.player);
      if(input.dx!==0||input.dy!==0){engine._dustEmitter.active=true;engine.playStep();}else{engine._dustEmitter.active=false;}
      // Refill seeds at well
      if(CollisionSystem.isNear(engine.player,engine.well,20)&&st.seeds<st.maxSeeds){
        st.seeds=st.maxSeeds;
        engine.ui.showNotification(st.lang==='en'?'Seeds refilled!':'Semillas rellenadas!',1);
      }
      // Plant at spots
      engine.spots.forEach(spot=>{
        if(!spot.planted&&st.seeds>0&&CollisionSystem.isNear(engine.player,spot,18)){
          const screenX=spot.x-engine.camera.x,screenY=spot.y-engine.camera.y;
          spot.planted=true;st.planted++;st.seeds--;
          engine.audio.collect();engine.shake(3,0.15);engine.particles.sparkle(screenX,screenY,'#22C55E',20);
          // Turn ground green around planted tree
          engine.ui.showNotification(st.lang==='en'?`Tree ${st.planted}/${st.total}!`:`Arbol ${st.planted}/${st.total}!`,1);
          if(st.planted>=st.total){st.phase='win';engine.audio.stopMusic();engine.ui.showWin(st.lang==='en'?'FOREST PLANTED!':'BOSQUE PLANTADO!',st.lang==='en'?'The desert is turning green!':'El desierto se esta volviendo verde!', 'choir');}
        }
      });
      if(st.phase==='lose'&&engine.keys['KeyR']){engine.stop();document.getElementById('gameOverlay').classList.remove('active');setTimeout(()=>openGame(6),100);}
      engine.ui.setHUD([
        {icon:'Trees: ',value:`${st.planted}/${st.total}`,color:'#22C55E'},
        {icon:'Seeds: ',value:`${st.seeds}`,color:'#F4A623'},
        {icon:'Time: ',value:`${Math.ceil(st.timeLeft)}s`,color:st.timeLeft<15?'#dc2626':'#fff'}
      ]);
    },
    onRender(engine){
      const st=engine.gameState;
      if(st.phase==='title'){engine.ui.renderTitle(st.lang==='en'?'TREES THAT CHANGED EVERYTHING':'LOS ARBOLES QUE CAMBIARON TODO',st.lang==='en'?'Plant trees before time runs out!':'Planta arboles antes de que se acabe el tiempo!');return;}
      if(engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD();engine.ui.renderDialog(engine.deltaTime);engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
