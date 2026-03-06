// ===== GAME 11: THE NUMBER DREAMER =====
// Puzzle/collect: Solve 5 math puzzles scattered across landscape

(function() {
  if (!window.GAME_CONFIGS) window.GAME_CONFIGS = {};

  function generateMap() {
    const cols=40,rows=30;
    const ground=new Array(cols*rows).fill(0);
    const collision=new Array(cols*rows).fill(0);
    const objects=new Array(cols*rows).fill(0);
    for(let c=0;c<cols;c++){collision[c]=1;collision[(rows-1)*cols+c]=1;}
    for(let r=0;r<rows;r++){collision[r*cols]=1;collision[r*cols+cols-1]=1;}
    // Chalkboard areas
    [[5,5,3,2],[20,4,3,2],[35,5,3,2],[10,20,3,2],[30,22,3,2]].forEach(([x,y,w,h])=>{
      for(let r=y;r<y+h;r++) for(let c=x;c<x+w;c++) if(r<rows&&c<cols){ground[r*cols+c]=4;}
    });
    // Puzzle locations
    objects[7*cols+6]=1; objects[5*cols+21]=2; objects[7*cols+36]=3;
    objects[21*cols+11]=4; objects[23*cols+31]=5;
    // Trees
    [[15,10],[25,12],[8,15],[32,15],[18,25],[38,20]].forEach(([c,r])=>{if(r<rows&&c<cols)collision[r*cols+c]=1;});
    return{cols,rows,ground,collision,objects};
  }

  const PUZZLES_EN = [
    {q:'7 + 8 = ?', a:15, opts:[13,15,16]},
    {q:'12 x 3 = ?', a:36, opts:[34,36,38]},
    {q:'100 - 47 = ?', a:53, opts:[53,57,43]},
    {q:'144 / 12 = ?', a:12, opts:[11,12,14]},
    {q:'2^5 = ?', a:32, opts:[16,32,64]}
  ];
  const PUZZLES_ES = [
    {q:'7 + 8 = ?', a:15, opts:[13,15,16]},
    {q:'12 x 3 = ?', a:36, opts:[34,36,38]},
    {q:'100 - 47 = ?', a:53, opts:[53,57,43]},
    {q:'144 / 12 = ?', a:12, opts:[11,12,14]},
    {q:'2^5 = ?', a:32, opts:[16,32,64]}
  ];

  window.GAME_CONFIGS['game-11'] = {
    bgColor:'#1a1a2e',
    buildTileMap(){
      const map=generateMap();
      return new TileMap({cols:map.cols,rows:map.rows,layers:{ground:map.ground,collision:map.collision,objects:map.objects},
        tileColors:{0:'#4a8c42',2:'#c4a265',3:'#d4b896',4:'#2a2a3e','wall':'#5a5a5a',
        'obj_1':'#B45309','obj_2':'#B45309','obj_3':'#B45309','obj_4':'#B45309','obj_5':'#B45309'}
      },16);
    },
    onInit(engine){
      const lang=window.lang||'en';
      const puzzles=lang==='en'?PUZZLES_EN:PUZZLES_ES;
      engine.gameState={phase:'title',lang,solved:0,total:5,puzzles,activePuzzle:null,selectedOpt:0,timeLeft:60,invincible:0};
      engine.player=engine.addEntity(new Sprite({x:20*16,y:15*16,w:16,h:16,speed:100,color:'#B45309'}));
      engine.puzzleSprites=[];
      const map=engine.tileMap;
      for(let r=0;r<map.rows;r++) for(let c=0;c<map.cols;c++){
        const obj=map.getTile('objects',c,r);
        if(obj>=1&&obj<=5){
          const s=engine.addEntity(new Sprite({x:c*16,y:r*16,w:16,h:16,color:'#B45309',type:'puzzle'}));
          s.puzzleIndex=obj-1;s.solved=false;
          s.render=function(ctx){if(!this.visible)return;const x=Math.floor(this.x),y=Math.floor(this.y);
            ctx.fillStyle=this.solved?'#22C55E':'#B45309';ctx.fillRect(x,y,16,16);
            ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='center';
            ctx.fillText(this.solved?'OK':'?',x+8,y+12);
          };
          engine.puzzleSprites.push(s);
        }
      }
      engine._dustEmitter=engine.particles.addEmitter({type:'dust',rate:0.12,follow:engine.player});engine._dustEmitter.active=false;
      engine.particles.addEmitter({type:'leaf',rate:1.5,canvasW:640,canvasH:480});
      engine.patrols=[];
      [[12,15,1,0,6],[28,20,0,1,5]].forEach(([x,y,dx,dy,range])=>{
        const p=engine.addEntity(new Sprite({x:x*16,y:y*16,w:14,h:14,color:'#dc2626',type:'patrol'}));
        p.startX=x*16;p.startY=y*16;p.dx=dx;p.dy=dy;p.range=range*16;
        p.render=function(ctx){if(!this.visible)return;const px=Math.floor(this.x),py=Math.floor(this.y);ctx.fillStyle='#dc2626';ctx.fillRect(px+1,py+2,12,10);ctx.fillStyle='#000';ctx.fillRect(px+3,py+4,3,2);ctx.fillRect(px+8,py+4,3,2);};
        engine.patrols.push(p);
      });
      engine.ui=new GameUI(engine);
    },
    onUpdate(engine,dt){
      const st=engine.gameState;
      if(st.phase==='title'){if(engine.keys['Space']||engine.keys['Enter']){st.phase='playing';engine.audio.click();engine.audio.startMusic('dreamer');engine.ui.showDialog(st.lang==='en'?'Walk to each chalkboard to solve math puzzles!':'Camina a cada pizarra para resolver problemas de matematicas!',4);}return;}
      if(st.phase==='win') return;
      if(st.phase==='lose'){if(engine.keys['KeyR']){engine.stop();document.getElementById('gameOverlay').classList.remove('active');setTimeout(()=>openGame(10),100);}return;}
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

      if(st.activePuzzle!==null){
        // Puzzle mode - choose answer
        if(engine.keys['ArrowLeft']||engine.keys['KeyA']){st.selectedOpt=Math.max(0,st.selectedOpt-1);engine.keys['ArrowLeft']=false;engine.keys['KeyA']=false;}
        if(engine.keys['ArrowRight']||engine.keys['KeyD']){st.selectedOpt=Math.min(2,st.selectedOpt+1);engine.keys['ArrowRight']=false;engine.keys['KeyD']=false;}
        if(engine.keys['Space']||engine.keys['Enter']){
          engine.keys['Space']=false;engine.keys['Enter']=false;
          const puzzle=st.puzzles[st.activePuzzle];
          if(puzzle.opts[st.selectedOpt]===puzzle.a){
            st.solved++;
            engine.puzzleSprites[st.activePuzzle].solved=true;
            engine.audio.collect();
            engine.ui.showNotification(st.lang==='en'?'Correct!':'Correcto!',1.5);
            if(st.solved>=st.total){st.phase='win';engine.audio.stopMusic();engine.ui.showWin(st.lang==='en'?'ALL PUZZLES SOLVED!':'TODOS LOS PROBLEMAS RESUELTOS!',st.lang==='en'?'Numbers are beautiful!':'Los numeros son hermosos!', 'chimes');}
          } else {
            st.timeLeft-=10;engine.audio.hurt();engine.shake(5,0.2);
            engine.ui.showNotification(st.lang==='en'?'Wrong! -10 seconds!':'Incorrecto! -10 segundos!',1.5);
          }
          st.activePuzzle=null;
        }
        return;
      }

      const input=engine.getInput();
      engine.player.update(dt,input.dx,input.dy,engine.tileMap);
      engine.followCamera(engine.player);
      if(input.dx!==0||input.dy!==0){engine._dustEmitter.active=true;engine.playStep();}else{engine._dustEmitter.active=false;}
      engine.puzzleSprites.forEach(ps=>{
        if(!ps.solved&&CollisionSystem.isNear(engine.player,ps,18)){
          st.activePuzzle=ps.puzzleIndex;st.selectedOpt=0;
        }
      });
      engine.ui.setHUD([
        {icon:st.lang==='en'?'Solved: ':'Resueltos: ',value:`${st.solved}/${st.total}`,color:'#B45309'},
        {icon:st.lang==='en'?'Time: ':'Tiempo: ',value:Math.ceil(st.timeLeft),color:st.timeLeft<20?'#dc2626':'#fff'}
      ]);
    },
    onRender(engine,ctx){
      const st=engine.gameState;
      if(st.phase==='title'){engine.ui.renderTitle(st.lang==='en'?'THE NUMBER DREAMER':'EL SONADOR DE NUMEROS',st.lang==='en'?'Solve math puzzles across the land':'Resuelve problemas de matematicas');return;}
      if(engine.ui.renderEndScreen()) return;
      engine.ui.renderHUD();engine.ui.renderDialog(engine.deltaTime);engine.ui.renderNotification(engine.deltaTime);
      // Puzzle overlay
      if(st.activePuzzle!==null){
        const puzzle=st.puzzles[st.activePuzzle];
        ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,engine.width,engine.height);
        ctx.font='bold 28px monospace';ctx.fillStyle='#FFD700';ctx.textAlign='center';
        ctx.fillText(puzzle.q,engine.width/2,180);
        puzzle.opts.forEach((opt,i)=>{
          const ox=engine.width/2-120+i*120;
          ctx.fillStyle=i===st.selectedOpt?'#E8553A':'#333';
          ctx.fillRect(ox-30,220,60,40);
          ctx.strokeStyle=i===st.selectedOpt?'#FFD700':'#555';ctx.lineWidth=2;ctx.strokeRect(ox-30,220,60,40);
          ctx.fillStyle='#fff';ctx.font='bold 20px monospace';ctx.fillText(String(opt),ox,248);
        });
        ctx.font='14px monospace';ctx.fillStyle='#888';
        ctx.fillText(st.lang==='en'?'Arrow keys to select, SPACE to answer':'Flechas para elegir, ESPACIO para responder',engine.width/2,300);
      }
    }
  };
})();
