// ===== GAME 09: THE PRINTER MADE OF LEGOS =====
// Top-down puzzle: Collect lego bricks, complete blueprint

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  function generateMap() {
    const cols=40,rows=30;
    const ground=new Array(cols*rows).fill(0);
    const collision=new Array(cols*rows).fill(0);
    const objects=new Array(cols*rows).fill(0);
    for(let c=0;c<cols;c++){collision[c]=1;collision[(rows-1)*cols+c]=1;}
    for(let r=0;r<rows;r++){collision[r*cols]=1;collision[r*cols+cols-1]=1;}
    // Room is a workshop/bedroom
    // Desk area
    for(let r=3;r<6;r++) for(let c=16;c<24;c++){ground[r*cols+c]=3;}
    // Bed
    for(let r=22;r<26;r++) for(let c=3;c<8;c++){collision[r*cols+c]=1;ground[r*cols+c]=4;}
    // Shelves
    for(let r=3;r<5;r++) for(let c=3;c<8;c++){collision[r*cols+c]=1;ground[r*cols+c]=4;}
    for(let r=3;r<5;r++) for(let c=32;c<37;c++){collision[r*cols+c]=1;ground[r*cols+c]=4;}
    // Blueprint station
    objects[4*cols+20]=9;
    // Lego bricks scattered (8 pieces)
    const bricks=[[5,10],[12,7],[30,8],[35,15],[8,18],[25,22],[34,25],[15,26]];
    bricks.forEach(([c,r],i)=>{objects[r*cols+c]=i+1;});
    return{cols,rows,ground,collision,objects};
  }

  const BRICK_COLORS=['','#dc2626','#2563eb','#16a34a','#eab308','#dc2626','#2563eb','#16a34a','#eab308'];

  window.GAME_CONFIGS['game-09'] = {
    bgColor:'#1a1a2e',
    buildTileMap(){
      const map=generateMap();
      return new TileMap({cols:map.cols,rows:map.rows,layers:{ground:map.ground,collision:map.collision,objects:map.objects},
        tileColors:{0:'#e8dcc8',2:'#c4a265',3:'#d4d4d4',4:'#6B4226','wall':'#8B7355',
        'obj_1':'#dc2626','obj_2':'#2563eb','obj_3':'#16a34a','obj_4':'#eab308',
        'obj_5':'#dc2626','obj_6':'#2563eb','obj_7':'#16a34a','obj_8':'#eab308','obj_9':'#7B68EE'}
      },16);
    },
    onInit(engine){
      const lang=window.lang||'en';
      engine.gameState={phase:'title',lang,bricks:0,total:8,built:false,timeLeft:75,invincible:0};
      engine.player=engine.addEntity(new Sprite({x:20*16,y:15*16,w:16,h:16,speed:100,color:'#0891B2',skinColor:'#FFDAB9',hairColor:'#8B4513'}));
      engine.brickSprites=[];
      const map=engine.tileMap;
      for(let r=0;r<map.rows;r++) for(let c=0;c<map.cols;c++){
        const obj=map.getTile('objects',c,r);
        if(obj>=1&&obj<=8){
          const s=engine.addEntity(new Sprite({x:c*16,y:r*16,w:16,h:16,color:BRICK_COLORS[obj],type:'brick'}));
          s.brickId=obj;
          s.render=function(ctx){
            if(!this.visible)return;
            const x=Math.floor(this.x),y=Math.floor(this.y);
            const bob=Math.sin(Date.now()/400+this.brickId)*2;
            const colors=['#dc2626','#2E86AB','#22C55E','#FFD700','#E8553A','#7C3AED','#0891B2','#F4A623'];
            ctx.fillStyle=colors[this.brickId%8];
            ctx.fillRect(x+1,y+4+bob,14,10);
            // Studs on top
            ctx.fillRect(x+2,y+1+bob,4,4);
            ctx.fillRect(x+9,y+1+bob,4,4);
            // Highlight
            ctx.fillStyle='rgba(255,255,255,0.3)';
            ctx.fillRect(x+2,y+5+bob,12,3);
          };
          engine.brickSprites.push(s);
        }
      }
      engine.blueprint=engine.addEntity(new Sprite({x:20*16,y:4*16,w:16,h:16,color:'#7B68EE',type:'blueprint'}));
      engine.blueprint.render=function(ctx){const x=Math.floor(this.x),y=Math.floor(this.y);ctx.fillStyle='#333';ctx.fillRect(x,y,16,16);ctx.fillStyle='#7B68EE';ctx.font='bold 7px monospace';ctx.textAlign='center';ctx.fillText('PRINT',x+8,y+10);};
      engine._dustEmitter=engine.particles.addEmitter({type:'dust',rate:0.12,follow:engine.player});engine._dustEmitter.active=false;
      engine.patrols=[];
      [[10,15,1,0,4],[30,20,0,1,3],[20,10,-1,0,5]].forEach(([x,y,dx,dy,range])=>{
        const p=engine.addEntity(new Sprite({x:x*16,y:y*16,w:14,h:14,color:'#dc2626',type:'patrol'}));
        p.startX=x*16;p.startY=y*16;p.dx=dx;p.dy=dy;p.range=range*16;
        p.render=function(ctx){if(!this.visible)return;const px=Math.floor(this.x),py=Math.floor(this.y);ctx.fillStyle='#dc2626';ctx.fillRect(px+1,py+2,12,10);ctx.fillStyle='#000';ctx.fillRect(px+3,py+4,3,2);ctx.fillRect(px+8,py+4,3,2);};
        engine.patrols.push(p);
      });
      engine.ui=new GameUI(engine);

      // Hint system: sequential LEGO brick objectives + blueprint desk
      const hintText=lang==='en'?'Find LEGO brick':'Busca pieza LEGO';
      const finalText=lang==='en'?'Go to the blueprint desk!':'Ve al escritorio!';
      const objectives=[];
      engine.brickSprites.forEach(b => {
        objectives.push({x:b.x,y:b.y,label:String(b.brickId),text:`${hintText} #${b.brickId}`});
      });
      objectives.sort((a,b)=>parseInt(a.label)-parseInt(b.label));
      objectives.push({x:engine.blueprint.x,y:engine.blueprint.y,label:'P',text:finalText});
      engine.ui.setObjectives(objectives);
    },
    onUpdate(engine,dt){
      const st=engine.gameState;
      if(st.phase==='title'){if(engine.keys['Space']||engine.keys['Enter']){st.phase='playing';engine.audio.click();engine.audio.startMusic('lego');engine.ui.showDialog(st.lang==='en'?'Find 8 LEGO bricks to build the printer! Bring them to the blueprint desk.':'Encuentra 8 piezas LEGO para construir la impresora! Llevalas al escritorio.',4);}return;}
      if(st.phase==='win') return;
      if(st.phase==='lose'){if(engine.keys['KeyR']){engine.stop();document.getElementById('gameOverlay').classList.remove('active');setTimeout(()=>openGame(8),100);}return;}
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
      engine.brickSprites.forEach(brick=>{
        if(brick.active&&brick.visible&&CollisionSystem.aabb(engine.player,brick)){
          if(brick.brickId!==st.bricks+1){
            engine.ui.showNotification(st.lang==='en'?`Find brick ${st.bricks+1} first!`:`Busca la pieza ${st.bricks+1} primero!`,1.5);
            return;
          }
          brick.active=false;brick.visible=false;st.bricks++;engine.removeEntity(brick);
          engine.audio.collect();engine.shake(3,0.15);
          engine.particles.sparkle(brick.x-engine.camera.x+8,brick.y-engine.camera.y+8,BRICK_COLORS[brick.brickId],20);
          engine.ui.showNotification(st.lang==='en'?`Brick ${st.bricks}/${st.total}!`:`Pieza ${st.bricks}/${st.total}!`,1.5);
          engine.ui.advanceObjective();
          if(st.bricks===st.total) engine.ui.showDialog(st.lang==='en'?'All bricks! Go to the blueprint desk!':'Todas las piezas! Ve al escritorio!',3);
        }
      });
      if(st.bricks===st.total&&!st.built&&CollisionSystem.aabb(engine.player,engine.blueprint)){
        st.built=true;st.phase='win';
        engine.audio.stopMusic();
        engine.ui.showWin(st.lang==='en'?'PRINTER BUILT!':'IMPRESORA CONSTRUIDA!',st.lang==='en'?'Made from LEGO bricks!':'Hecha con piezas LEGO!', 'sparkle');
      }
      engine.ui.setHUD([
        {icon:'LEGO: ',value:`${st.bricks}/${st.total}`,color:'#eab308'},
        {icon:st.lang==='en'?'Next: ':'Sig: ',value:`#${st.bricks+1<=st.total?st.bricks+1:'--'}`,color:'#2563eb'},
        {icon:st.lang==='en'?'Time: ':'Tiempo: ',value:Math.ceil(st.timeLeft),color:st.timeLeft<20?'#dc2626':'#fff'}
      ]);
    },
    onRender(engine){
      const st=engine.gameState;
      if(st.phase==='title'){engine.ui.renderTitle(st.lang==='en'?'PRINTER MADE OF LEGOS':'IMPRESORA DE LEGOS',st.lang==='en'?'Collect bricks to build the printer':'Recoge piezas para construir la impresora');return;}
      if(engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD();engine.ui.renderHints(engine.camera);engine.ui.renderDialog(engine.deltaTime);engine.ui.renderNotification(engine.deltaTime);
    }
  };
})();
