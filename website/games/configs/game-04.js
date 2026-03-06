// ===== GAME 04: THE SCHOOL THAT CLOSED =====
// Top-down quest: Find 8 kids and lead them back to school

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  function generateMap() {
    const cols=50, rows=40;
    const ground = new Array(cols*rows).fill(0);
    const collision = new Array(cols*rows).fill(0);
    const objects = new Array(cols*rows).fill(0);
    // Borders
    for (let c=0;c<cols;c++) { collision[c]=1; collision[(rows-1)*cols+c]=1; }
    for (let r=0;r<rows;r++) { collision[r*cols]=1; collision[r*cols+cols-1]=1; }
    // Roads
    for (let c=0;c<cols;c++) { ground[20*cols+c]=2; ground[21*cols+c]=2; }
    for (let r=0;r<rows;r++) { ground[r*cols+25]=2; ground[r*cols+26]=2; }
    // School building (top center)
    for (let r=3;r<8;r++) for (let c=22;c<30;c++) { collision[r*cols+c]=1; ground[r*cols+c]=4; }
    // School door
    collision[7*cols+25]=0; collision[7*cols+26]=0;
    objects[8*cols+25]=9; objects[8*cols+26]=9;
    // Houses scattered
    const houses=[[3,10,4,3],[8,28,3,3],[40,5,4,3],[42,30,3,4],[15,32,3,3],[35,15,4,3],[5,3,3,3],[44,22,3,3]];
    houses.forEach(([x,y,w,h])=>{for(let r=y;r<y+h;r++) for(let c=x;c<x+w;c++) if(r<rows&&c<cols){collision[r*cols+c]=1;ground[r*cols+c]=4;}});
    // Trees
    [[10,5],[18,12],[30,10],[38,8],[12,24],[35,28],[45,12],[6,18],[48,35],[15,38],[28,35],[42,18]].forEach(([c,r])=>{if(r<rows&&c<cols){collision[r*cols+c]=1;ground[r*cols+c]=4;}});
    return { cols, rows, ground, collision, objects };
  }

  const KID_POSITIONS = [[6,12],[10,30],[42,7],[44,32],[17,34],[37,17],[7,5],[46,24]];
  const KID_COLORS = ['#E8553A','#3AAFB9','#F4A623','#7B68EE','#22C55E','#FF6347','#FFD700','#9F1239'];

  window.GAME_CONFIGS['game-04'] = {
    bgColor: '#1a3a1a',
    buildTileMap() {
      const map = generateMap();
      return new TileMap({ cols:map.cols,rows:map.rows, layers:{ground:map.ground,collision:map.collision,objects:map.objects},
        tileColors:{0:'#4a8c42',2:'#c4a265',3:'#d4b896',4:'#5a4a3a','wall':'#6B4226','obj_9':'#E8553A'}
      },16);
    },
    onInit(engine) {
      const lang = window.lang||'en';
      engine.gameState = {phase:'title',lang,found:0,total:8,following:[],delivered:0,timeLeft:120,invincible:0};
      engine.player = engine.addEntity(new Sprite({x:25*16,y:10*16,w:16,h:16,speed:100,color:'#E8553A',skinColor:'#8B5E3C',hairColor:'#1a1a1a',isFemale:true}));
      engine.kids = [];
      KID_POSITIONS.forEach(([c,r],i)=>{
        const kid = engine.addEntity(new Sprite({x:c*16,y:r*16,w:12,h:12,speed:0,color:KID_COLORS[i],type:'kid'}));
        kid.kidIndex = i;
        kid.followTarget = null;
        kid.origRender = kid.render;
        kid.render = function(ctx) {
          if (!this.visible) return;
          const x=Math.floor(this.x),y=Math.floor(this.y);
          const bob = this.followTarget ? Math.sin(Date.now()/500+this.kidIndex)*1.5 : 0;
          // Head
          ctx.fillStyle='#FFDAB9';
          ctx.fillRect(x+5,y+1+bob,6,5);
          // Hair
          ctx.fillStyle='#4a2e00';
          ctx.fillRect(x+5,y+bob,6,2);
          // Eyes
          ctx.fillStyle='#000';
          ctx.fillRect(x+6,y+3+bob,1,1);
          ctx.fillRect(x+9,y+3+bob,1,1);
          // Body — shirt color cycles through KID_COLORS palette
          ctx.fillStyle=['#E8553A','#2E86AB','#22C55E','#F4A623','#9F1239','#7C3AED','#0891B2','#B45309'][this.kidIndex % 8];
          ctx.fillRect(x+4,y+6+bob,8,6);
          // Legs
          ctx.fillStyle='#4a3728';
          ctx.fillRect(x+5,y+12+bob,3,3);
          ctx.fillRect(x+9,y+12+bob,3,3);
          // Exclamation if not following
          if (!this.followTarget) {
            const blink = Math.floor(Date.now()/400)%2;
            if (blink) { ctx.fillStyle='#FFD700'; ctx.font='bold 10px monospace'; ctx.textAlign='left'; ctx.fillText('!',x+4,y-4+bob); }
          }
        };
        engine.kids.push(kid);
      });
      // School zone
      engine.schoolZone = {x:22*16,y:7*16,w:6*16,h:2*16};
      engine._dustEmitter = engine.particles.addEmitter({ type: 'dust', rate: 0.12, follow: engine.player }); engine._dustEmitter.active = false;
      engine.particles.addEmitter({ type: 'leaf', rate: 1.5, canvasW: 640, canvasH: 480 });

      // Patrol enemies
      engine.patrols = [];
      const patrolData = [[15,20,1,0,6],[35,10,0,1,5],[25,30,-1,0,5],[45,20,0,-1,4]];
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
    onUpdate(engine,dt) {
      const st=engine.gameState;
      if (st.phase==='title'){if(engine.keys['Space']||engine.keys['Enter']){st.phase='playing';engine.audio.click();engine.audio.startMusic('school');engine.ui.showDialog(st.lang==='en'?'Find 8 kids around town and lead them back to school!':'Encuentra 8 ninos por el pueblo y llevalos de vuelta a la escuela!',4);}return;}
      if (st.phase==='win') return;
      if (st.phase === 'lose') { if (engine.keys['KeyR']) { engine.stop(); document.getElementById('gameOverlay').classList.remove('active'); setTimeout(() => openGame(3), 100); } return; }
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

      // Pick up kids
      engine.kids.forEach(kid=>{
        if (kid.active&&kid.visible&&!kid.followTarget&&CollisionSystem.isNear(engine.player,kid,20)) {
          kid.followTarget = st.following.length>0 ? st.following[st.following.length-1] : engine.player;
          st.following.push(kid);
          st.found++;
          engine.audio.collect(); engine.shake(3, 0.15); engine.particles.sparkle(kid.x-engine.camera.x, kid.y-engine.camera.y, '#FFD700', 20);
          engine.ui.showNotification(st.lang==='en'?`Found kid ${st.found}/${st.total}!`:`Nino encontrado ${st.found}/${st.total}!`,1.5);
        }
      });
      // Kids follow in a chain
      st.following.forEach((kid,i)=>{
        const target = i===0 ? engine.player : st.following[i-1];
        const dx=target.x-kid.x, dy=target.y-kid.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>20) {
          kid.x += (dx/dist)*90*dt;
          kid.y += (dy/dist)*90*dt;
        }
      });
      // Deliver to school
      const sz=engine.schoolZone;
      if (st.following.length>0 && engine.player.x>sz.x&&engine.player.x<sz.x+sz.w&&engine.player.y>sz.y&&engine.player.y<sz.y+sz.h) {
        st.following.forEach(kid=>{kid.visible=false;kid.active=false;st.delivered++;engine.removeEntity(kid);});
        st.following=[];
        if (st.delivered>=st.total) {
          st.phase='win';
          engine.audio.stopMusic();
          engine.ui.showWin(st.lang==='en'?'SCHOOL IS OPEN!':'LA ESCUELA ESTA ABIERTA!',st.lang==='en'?'All kids are learning again!':'Todos los ninos estan aprendiendo de nuevo!', 'applause');
        } else {
          engine.ui.showNotification(st.lang==='en'?`Delivered! ${st.delivered}/${st.total}`:`Entregados! ${st.delivered}/${st.total}`,2);
        }
      }


      engine.ui.setHUD([
        {icon:st.lang==='en'?'Found: ':'Hallados: ',value:`${st.found}/${st.total}`,color:'#FFD700'},
        {icon:st.lang==='en'?'At School: ':'En Escuela: ',value:`${st.delivered}/${st.total}`,color:'#22C55E'},
        {icon:'Time: ',value:Math.ceil(st.timeLeft)+'s',color:st.timeLeft<20?'#dc2626':'#fff'}
      ]);
    },
    onRender(engine){
      const st=engine.gameState;
      if(st.phase==='title'){engine.ui.renderTitle(st.lang==='en'?'THE SCHOOL THAT CLOSED':'LA ESCUELA QUE CERRO',st.lang==='en'?'Find kids and bring them to school':'Encuentra ninos y llevalos a la escuela');return;}
      if(engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD();engine.ui.renderDialog(engine.deltaTime);engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
