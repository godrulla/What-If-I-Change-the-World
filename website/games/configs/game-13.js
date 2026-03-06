// ===== GAME 13: SI DIOS QUIERE =====
// Top-down narrative: Peaceful walk to grandmother's house

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  function generateMap() {
    const cols=60,rows=45;
    const ground=new Array(cols*rows).fill(0);
    const collision=new Array(cols*rows).fill(0);
    const objects=new Array(cols*rows).fill(0);
    for(let c=0;c<cols;c++){collision[c]=1;collision[(rows-1)*cols+c]=1;}
    for(let r=0;r<rows;r++){collision[r*cols]=1;collision[r*cols+cols-1]=1;}
    // Winding path
    const path=[[5,40],[8,38],[12,35],[15,32],[18,30],[20,27],[22,24],[25,22],[28,20],[30,18],[32,16],[35,14],[38,12],[40,10],[42,8],[45,6],[48,5],[52,4],[55,3]];
    path.forEach(([c,r])=>{
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const rr=r+dr,cc=c+dc;
        if(rr>=0&&rr<rows&&cc>=0&&cc<cols) ground[rr*cols+cc]=2;
      }
    });
    // Trees along the path
    [[3,35],[10,30],[17,25],[24,20],[31,15],[37,10],[44,7],[50,3],
     [7,42],[14,37],[20,32],[27,26],[33,20],[39,15],[46,9],[53,5],
     [2,28],[9,22],[16,18],[23,13],[30,8],[36,5],[43,3]].forEach(([c,r])=>{
      if(r>=0&&r<rows&&c>=0&&c<cols){collision[r*cols+c]=1;ground[r*cols+c]=4;}
    });
    // Flowers/memories to collect along the way
    objects[38*cols+6]=1; objects[33*cols+14]=2; objects[27*cols+20]=3;
    objects[20*cols+28]=4; objects[14*cols+36]=5; objects[8*cols+45]=6;
    // Grandmother's house
    for(let r=2;r<6;r++) for(let c=54;c<59;c++){collision[r*cols+c]=1;ground[r*cols+c]=4;}
    collision[5*cols+56]=0; // door
    objects[6*cols+56]=9; // arrival point
    return{cols,rows,ground,collision,objects};
  }

  const MEMORIES_EN=['A warm breeze','The smell of coffee','Church bells','Mango trees','A neighbor waving','Grandmother\'s voice'];
  const MEMORIES_ES=['Una brisa calida','El olor del cafe','Las campanas','Los arboles de mango','Un vecino saludando','La voz de abuela'];

  window.GAME_CONFIGS['game-13'] = {
    bgColor:'#1a3a2a',
    buildTileMap(){
      const map=generateMap();
      return new TileMap({cols:map.cols,rows:map.rows,layers:{ground:map.ground,collision:map.collision,objects:map.objects},
        tileColors:{0:'#3d8b37',2:'#c4a265',3:'#d4b896',4:'#2d6b27','wall':'#5a4a3a',
        'obj_1':'#FF69B4','obj_2':'#FF69B4','obj_3':'#FF69B4','obj_4':'#FF69B4','obj_5':'#FF69B4','obj_6':'#FF69B4','obj_9':'#E8553A'}
      },16);
    },
    onInit(engine){
      const lang=window.lang||'en';
      const memories=lang==='en'?MEMORIES_EN:MEMORIES_ES;
      engine.gameState={phase:'title',lang,memories,collected:0,total:6,arrived:false,timeLeft:120,invincible:0};
      engine.player=engine.addEntity(new Sprite({x:5*16,y:40*16,w:16,h:16,speed:90,color:'#7C3AED'}));
      engine.memorySprites=[];
      const map=engine.tileMap;
      for(let r=0;r<map.rows;r++) for(let c=0;c<map.cols;c++){
        const obj=map.getTile('objects',c,r);
        if(obj>=1&&obj<=6){
          const s=engine.addEntity(new Sprite({x:c*16,y:r*16,w:16,h:16,color:'#FF69B4',type:'memory'}));
          s.memoryIndex=obj-1;
          s.render=function(ctx){if(!this.visible)return;const x=Math.floor(this.x),y=Math.floor(this.y);
            const glow=Math.sin(Date.now()/400+this.memoryIndex)*3;
            ctx.globalAlpha=0.7+Math.sin(Date.now()/300)*0.3;
            ctx.fillStyle='#FF69B4';ctx.beginPath();ctx.arc(x+8,y+8+glow,6,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+8,y+8+glow,2,0,Math.PI*2);ctx.fill();
            ctx.globalAlpha=1;
          };
          engine.memorySprites.push(s);
        }
      }
      engine.arrival=engine.addEntity(new Sprite({x:56*16,y:6*16,w:16,h:16,color:'#E8553A',type:'arrival'}));
      engine.arrival.render=function(ctx){const x=Math.floor(this.x),y=Math.floor(this.y);
        ctx.fillStyle='#E8553A';const p=Math.sin(Date.now()/500)*0.2+0.8;ctx.globalAlpha=p;
        ctx.fillRect(x,y,16,16);ctx.fillStyle='#FFD700';ctx.font='bold 7px monospace';ctx.textAlign='center';
        ctx.fillText('HOME',x+8,y+10);ctx.globalAlpha=1;
      };
      engine._dustEmitter=engine.particles.addEmitter({type:'dust',rate:0.12,follow:engine.player});engine._dustEmitter.active=false;
      engine.particles.addEmitter({type:'leaf',rate:0.8,canvasW:640,canvasH:480});
      engine.patrols=[];
      [[20,25,0,1,6],[40,15,1,0,5]].forEach(([x,y,dx,dy,range])=>{
        const p=engine.addEntity(new Sprite({x:x*16,y:y*16,w:14,h:14,color:'#dc2626',type:'patrol'}));
        p.startX=x*16;p.startY=y*16;p.dx=dx;p.dy=dy;p.range=range*16;
        p.render=function(ctx){if(!this.visible)return;const px=Math.floor(this.x),py=Math.floor(this.y);ctx.fillStyle='#dc2626';ctx.fillRect(px+1,py+2,12,10);ctx.fillStyle='#000';ctx.fillRect(px+3,py+4,3,2);ctx.fillRect(px+8,py+4,3,2);};
        engine.patrols.push(p);
      });
      engine.ui=new GameUI(engine);
    },
    onUpdate(engine,dt){
      const st=engine.gameState;
      if(st.phase==='title'){if(engine.keys['Space']||engine.keys['Enter']){st.phase='playing';engine.audio.click();engine.audio.startMusic('abuela');engine.ui.showDialog(st.lang==='en'?'Walk the path to grandmother\'s house. Collect memories along the way.':'Camina por el sendero a la casa de abuela. Recoge memorias en el camino.',4);}return;}
      if(st.phase==='win') return;
      if(st.phase==='lose'){if(engine.keys['KeyR']){engine.stop();document.getElementById('gameOverlay').classList.remove('active');setTimeout(()=>openGame(12),100);}return;}
      st.timeLeft-=dt;
      if(st.timeLeft<=0){st.phase='lose';engine.audio.stopMusic();engine.ui.showLose(st.lang==='en'?'TIME UP!':'SE ACABO EL TIEMPO!',st.lang==='en'?'Press R to retry':'Presiona R');return;}
      if(st.invincible>0) st.invincible-=dt;
      engine.patrols.forEach(p=>{
        p.x+=p.dx*20*dt;p.y+=p.dy*20*dt;
        if(Math.abs(p.x-p.startX)>p.range) p.dx*=-1;
        if(Math.abs(p.y-p.startY)>p.range) p.dy*=-1;
        if(st.invincible<=0&&CollisionSystem.aabb(engine.player,p)){
          st.timeLeft-=10;st.invincible=1.5;
          engine.audio.hurt();engine.shake(3,0.15);
          engine.particles.sparkle(engine.player.x-engine.camera.x+8,engine.player.y-engine.camera.y+8,'#dc2626',10);
          engine.ui.showNotification(st.lang==='en'?'-10 seconds!':'-10 segundos!',1.5);
        }
      });
      const input=engine.getInput();
      engine.player.update(dt,input.dx,input.dy,engine.tileMap);
      engine.followCamera(engine.player);
      if(input.dx!==0||input.dy!==0){engine._dustEmitter.active=true;engine.playStep();}else{engine._dustEmitter.active=false;}
      engine.memorySprites.forEach(mem=>{
        if(mem.active&&mem.visible&&CollisionSystem.isNear(engine.player,mem,18)){
          mem.active=false;mem.visible=false;st.collected++;engine.removeEntity(mem);
          const screenX=mem.x-engine.camera.x+8,screenY=mem.y-engine.camera.y+8;
          engine.particles.sparkle(screenX,screenY,'#FF69B4',25);
          engine.ui.showDialog(st.memories[mem.memoryIndex],3);
        }
      });
      if(!st.arrived&&CollisionSystem.isNear(engine.player,engine.arrival,20)){
        st.arrived=true;st.phase='win';
        engine.audio.stopMusic();
        engine.ui.showWin(st.lang==='en'?'YOU ARRIVED!':'LLEGASTE!',st.lang==='en'?'Si Dios quiere. Grandmother is waiting.':'Si Dios quiere. Abuela te espera.', 'choir');
      }
      engine.ui.setHUD([
        {icon:st.lang==='en'?'Memories: ':'Memorias: ',value:`${st.collected}/${st.total}`,color:'#FF69B4'},
        {icon:st.lang==='en'?'Time: ':'Tiempo: ',value:Math.ceil(st.timeLeft),color:st.timeLeft<30?'#dc2626':'#fff'}
      ]);
    },
    onRender(engine){
      const st=engine.gameState;
      if(st.phase==='title'){engine.ui.renderTitle('SI DIOS QUIERE',st.lang==='en'?'A peaceful walk to grandmother\'s house':'Un camino tranquilo a la casa de abuela');return;}
      if(engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD();engine.ui.renderDialog(engine.deltaTime);engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
