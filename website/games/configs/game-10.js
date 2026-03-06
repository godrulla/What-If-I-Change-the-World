// ===== GAME 10: THE WATER PROTECTOR =====
// Top-down defense: Reach podiums to protect water sources

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  function generateMap() {
    const cols=50,rows=38;
    const ground=new Array(cols*rows).fill(0);
    const collision=new Array(cols*rows).fill(0);
    const objects=new Array(cols*rows).fill(0);
    for(let c=0;c<cols;c++){collision[c]=1;collision[(rows-1)*cols+c]=1;}
    for(let r=0;r<rows;r++){collision[r*cols]=1;collision[r*cols+cols-1]=1;}
    // River
    for(let r=0;r<rows;r++){ground[r*cols+24]=2;ground[r*cols+25]=2;ground[r*cols+26]=2;}
    // Lake
    for(let r=14;r<20;r++) for(let c=20;c<30;c++){ground[r*cols+c]=2;collision[r*cols+c]=1;}
    // Open edges of lake
    collision[14*cols+25]=0;collision[19*cols+25]=0;
    // Podiums (5 locations)
    const podiums=[[5,5],[45,5],[5,33],[45,33],[25,28]];
    podiums.forEach(([c,r],i)=>{objects[r*cols+c]=i+1;});
    // Trees/rocks as obstacles
    [[10,10],[15,15],[35,10],[40,20],[12,25],[38,30],[20,8],[30,32],[8,18],[42,15]].forEach(([c,r])=>{
      if(r<rows&&c<cols){collision[r*cols+c]=1;}
    });
    return{cols,rows,ground,collision,objects};
  }

  window.GAME_CONFIGS['game-10'] = {
    bgColor:'#0a2a4a',
    buildTileMap(){
      const map=generateMap();
      return new TileMap({cols:map.cols,rows:map.rows,layers:{ground:map.ground,collision:map.collision,objects:map.objects},
        tileColors:{0:'#3d7a37',2:'#2E86AB',3:'#d4b896',4:'#2d6b27','wall':'#5a5a5a',
        'obj_1':'#4338CA','obj_2':'#4338CA','obj_3':'#4338CA','obj_4':'#4338CA','obj_5':'#4338CA'}
      },16);
    },
    onInit(engine){
      const lang=window.lang||'en';
      engine.gameState={phase:'title',lang,protected:0,total:5,timeLeft:90,invincible:0};
      engine.player=engine.addEntity(new Sprite({x:25*16,y:22*16,w:16,h:16,speed:100,color:'#4338CA'}));
      engine.podiums=[];
      const map=engine.tileMap;
      for(let r=0;r<map.rows;r++) for(let c=0;c<map.cols;c++){
        const obj=map.getTile('objects',c,r);
        if(obj>=1&&obj<=5){
          const s=engine.addEntity(new Sprite({x:c*16,y:r*16,w:16,h:16,color:'#4338CA',type:'podium'}));
          s.reached=false;
          s.render=function(ctx){if(!this.visible)return;const x=Math.floor(this.x),y=Math.floor(this.y);
            if(this.reached){
              ctx.fillStyle='#22C55E';ctx.fillRect(x,y+8,16,8);ctx.fillStyle='#16a34a';ctx.fillRect(x+4,y,8,10);
              ctx.fillStyle='#fff';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('OK',x+8,y+6);
            } else {
              const pulse=Math.sin(Date.now()/300)*0.2+0.8;ctx.globalAlpha=pulse;
              ctx.fillStyle='#4338CA';ctx.fillRect(x,y+8,16,8);ctx.fillStyle='#6366f1';ctx.fillRect(x+4,y,8,10);
              ctx.fillStyle='#FFD700';ctx.font='bold 6px monospace';ctx.textAlign='center';ctx.fillText('SPEAK',x+8,y+6);
              ctx.globalAlpha=1;
            }
          };
          engine.podiums.push(s);
        }
      }
      engine._dustEmitter=engine.particles.addEmitter({type:'dust',rate:0.12,follow:engine.player});engine._dustEmitter.active=false;
      engine.particles.addEmitter({type:'leaf',rate:1.5,canvasW:640,canvasH:480});
      engine.patrols=[];
      [[10,10,1,0,5],[40,10,0,1,4],[10,28,0,-1,5],[40,28,-1,0,4]].forEach(([x,y,dx,dy,range])=>{
        const p=engine.addEntity(new Sprite({x:x*16,y:y*16,w:14,h:14,color:'#dc2626',type:'patrol'}));
        p.startX=x*16;p.startY=y*16;p.dx=dx;p.dy=dy;p.range=range*16;
        p.render=function(ctx){if(!this.visible)return;const px=Math.floor(this.x),py=Math.floor(this.y);ctx.fillStyle='#dc2626';ctx.fillRect(px+1,py+2,12,10);ctx.fillStyle='#000';ctx.fillRect(px+3,py+4,3,2);ctx.fillRect(px+8,py+4,3,2);};
        engine.patrols.push(p);
      });
      engine.ui=new GameUI(engine);
    },
    onUpdate(engine,dt){
      const st=engine.gameState;
      if(st.phase==='title'){if(engine.keys['Space']||engine.keys['Enter']){st.phase='playing';engine.audio.click();engine.audio.startMusic('protector');engine.ui.showDialog(st.lang==='en'?'Reach all 5 podiums to speak up and protect the water!':'Llega a los 5 podios para hablar y proteger el agua!',4);}return;}
      if(st.phase==='win') return;
      if(st.phase==='lose'){if(engine.keys['KeyR']){engine.stop();document.getElementById('gameOverlay').classList.remove('active');setTimeout(()=>openGame(9),100);}return;}
      st.timeLeft-=dt;
      if(st.timeLeft<=0){st.phase='lose';engine.audio.stopMusic();engine.ui.showLose(st.lang==='en'?'TIME UP!':'SE ACABO EL TIEMPO!',st.lang==='en'?'Press R to retry':'Presiona R');return;}
      if(st.invincible>0) st.invincible-=dt;
      engine.patrols.forEach(p=>{
        p.x+=p.dx*40*dt;p.y+=p.dy*40*dt;
        if(Math.abs(p.x-p.startX)>p.range) p.dx*=-1;
        if(Math.abs(p.y-p.startY)>p.range) p.dy*=-1;
        if(st.invincible<=0&&CollisionSystem.aabb(engine.player,p)){
          st.timeLeft-=15;st.invincible=1.5;
          engine.audio.hurt();engine.shake(5,0.2);
          engine.particles.sparkle(engine.player.x-engine.camera.x+8,engine.player.y-engine.camera.y+8,'#dc2626',15);
          engine.ui.showNotification(st.lang==='en'?'-15 seconds!':'-15 segundos!',1.5);
        }
      });
      const input=engine.getInput();
      engine.player.update(dt,input.dx,input.dy,engine.tileMap);
      engine.followCamera(engine.player);
      if(input.dx!==0||input.dy!==0){engine._dustEmitter.active=true;engine.playStep();}else{engine._dustEmitter.active=false;}
      engine.podiums.forEach(pod=>{
        if(!pod.reached&&CollisionSystem.isNear(engine.player,pod,18)){
          pod.reached=true;st.protected++;
          engine.audio.collect();engine.shake(3,0.15);
          engine.particles.sparkle(pod.x-engine.camera.x+8,pod.y-engine.camera.y+8,'#4338CA',20);
          engine.ui.showNotification(st.lang==='en'?`Podium ${st.protected}/${st.total}!`:`Podio ${st.protected}/${st.total}!`,1.5);
          if(st.protected>=st.total){st.phase='win';engine.audio.stopMusic();engine.ui.showWin(st.lang==='en'?'WATER PROTECTED!':'AGUA PROTEGIDA!',st.lang==='en'?'Your voice made a difference!':'Tu voz hizo la diferencia!', 'heroic');}
        }
      });
      engine.ui.setHUD([
        {icon:st.lang==='en'?'Podiums: ':'Podios: ',value:`${st.protected}/${st.total}`,color:'#4338CA'},
        {icon:st.lang==='en'?'Time: ':'Tiempo: ',value:Math.ceil(st.timeLeft),color:st.timeLeft<20?'#dc2626':'#fff'}
      ]);
    },
    onRender(engine){
      const st=engine.gameState;
      if(st.phase==='title'){engine.ui.renderTitle(st.lang==='en'?'THE WATER PROTECTOR':'EL PROTECTOR DEL AGUA',st.lang==='en'?'Reach podiums to protect water sources':'Llega a los podios para proteger el agua');return;}
      if(engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD();engine.ui.renderDialog(engine.deltaTime);engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
