(() => {
  const segments = [
    { start: 0.0, text: 'Every story has a moment that makes you stop and listen.' },
    { start: 5.0, text: 'It might be a whisper in the dark.' },
    { start: 9.2, text: 'It might be the excitement in someone’s voice when they finally say, “We did it.”' },
    { start: 16.2, text: 'It might be the pause before the words that change everything.' },
    { start: 21.6, text: 'And sometimes... it’s just a few simple words, spoken exactly the way they should be.' },
    { start: 29.2, text: 'That’s when voice becomes more than sound. It becomes a feeling.' },
    { start: 34.2, text: 'Welcome to SvaraONE.' },
    { start: 36.7, text: 'Intelligent performance orchestration for natural, expressive voice.' },
    { start: 40.3, text: 'I am. Svara. ONE.' }
  ];
  const referenceDuration = 44.5;

  const style = document.createElement('style');
  style.textContent = `
    .hero-card{position:relative;overflow:hidden;isolation:isolate}
    .hero-card > *:not(.hero-cosmos){position:relative;z-index:3}
    .hero-cosmos{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.7;transition:opacity 1s ease}
    .hero-cosmos canvas{display:block;width:100%;height:100%}
    .hero-card.is-hero-playing .hero-cosmos{opacity:1}

    .hero-script-wrap{margin:20px 0 12px;position:relative;z-index:4}
    .hero-script{min-height:76px;display:flex;align-items:center;max-width:92%;overflow:hidden}
    .hero-script-line{font-size:25px;line-height:1.34;letter-spacing:-.015em;color:#e5f0fb;transition:opacity .35s ease,transform .45s ease;opacity:0;transform:translateY(7px);text-shadow:0 2px 24px rgba(0,0,0,.5)}
    .hero-script-line.is-active{opacity:1;transform:translateY(0)}
    .hero-script-line .brand-one{font-weight:inherit}

    .hero-timeline{display:flex;flex-direction:column;gap:5px;margin:0 0 8px;max-height:116px;overflow:hidden;position:relative;z-index:4}
    .hero-timeline-item{display:grid;grid-template-columns:6px 42px minmax(0,1fr);align-items:center;column-gap:9px;min-height:16px;opacity:.42;transition:opacity .3s ease,transform .3s ease}
    .hero-timeline-item::before{content:'';width:5px;height:5px;border:1px solid rgba(190,218,238,.55);border-radius:50%;justify-self:center;transition:all .3s ease}
    .hero-timeline-item.is-active{opacity:1;transform:translateX(2px)}
    .hero-timeline-item.is-active::before{width:7px;height:7px;border-color:#21dbc4;background:#21dbc4;box-shadow:0 0 10px rgba(33,219,196,.65)}
    .hero-timeline-time{font-size:10px;letter-spacing:.08em;font-variant-numeric:tabular-nums;color:#9eb2c7}
    .hero-timeline-item.is-active .hero-timeline-time{color:#25dfc7}
    .hero-timeline-text{font-size:11px;line-height:1.3;color:#c2d0df;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .hero-timeline-item.is-active .hero-timeline-text{color:#edf8ff}

    .hero-card .card-top,.hero-card .voice-row,.hero-card .player{position:relative;z-index:4}
    .hero-card .wave{position:relative;z-index:4;opacity:.9}
    .hero-card .wave i{transition:height .12s ease}
    .hero-cinematic-dim{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(circle at 75% 48%,transparent 0,transparent 28%,rgba(2,10,20,.1) 55%,rgba(2,8,17,.34) 100%)}

    @media(max-width:700px){
      .hero-script{min-height:88px;max-width:100%}.hero-script-line{font-size:21px}
      .hero-timeline{max-height:108px}.hero-timeline-text{font-size:10px}
    }
    @media(max-width:650px){.hero-timeline-item{grid-template-columns:6px 38px minmax(0,1fr);column-gap:7px}}
    @media(prefers-reduced-motion:reduce){
      .hero-cosmos{opacity:.42}.hero-script-line,.hero-timeline-item{transition:none}
    }
  `;
  document.head.appendChild(style);

  function createCosmos(card) {
    const layer = document.createElement('div');
    layer.className = 'hero-cosmos';
    const canvas = document.createElement('canvas');
    layer.appendChild(canvas);
    card.prepend(layer);
    const dim = document.createElement('div');
    dim.className = 'hero-cinematic-dim';
    card.prepend(dim);

    const ctx = canvas.getContext('2d');
    const stars = [];
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let width = 1, height = 1, dpr = 1, raf = 0, playing = false, last = performance.now(), elapsed = 0;

    function resize(){
      const rect = card.getBoundingClientRect();
      width=Math.max(1,rect.width); height=Math.max(1,rect.height);
      dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count=Math.max(55,Math.min(105,Math.round(width*height/5800)));
      while(stars.length<count)stars.push(makeStar());
      while(stars.length>count)stars.pop();
    }
    function makeStar(){
      const depth=Math.random();
      return {x:Math.random()*width,y:Math.random()*height,r:.25+depth*.75,a:.12+depth*.42,speed:.025+depth*.085,drift:(Math.random()-.5)*.035,phase:Math.random()*Math.PI*2,twinkle:.25+Math.random()*.65};
    }
    function draw(now){
      const dt=Math.min(40,now-last)/16.67; last=now; elapsed+=dt;
      ctx.clearRect(0,0,width,height);
      const motion=reduced?.08:(playing?1:.55);
      const t=elapsed*.001;

      // Deep-space stars: slow drift, sparse twinkle, and slightly stronger depth while playing.
      for(const s of stars){
        if(!reduced){
          s.y+=s.speed*motion*dt;
          s.x+=s.drift*motion*dt;
          if(s.y>height+2)s.y=-2;
          if(s.x<-2)s.x=width+2;
          if(s.x>width+2)s.x=-2;
        }
        const tw=.72+.28*Math.sin(t*s.twinkle*2+s.phase);
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(211,235,255,${s.a*tw*(playing?1:.72)})`; ctx.fill();
      }

      // Logo-inspired eclipse: a distant light source sits behind a dark body.
      const cx=width*.79, cy=height*.47;
      const radius=Math.min(width,height)*.145;
      const orbitX=Math.sin(t*.16)*width*.012;
      const orbitY=Math.cos(t*.13)*height*.008;
      const ex=cx+orbitX, ey=cy+orbitY;
      const breath=1+.035*Math.sin(t*.9);
      const lightX=ex-radius*.72, lightY=ey-radius*.18;

      const outer=ctx.createRadialGradient(lightX,lightY,0,lightX,lightY,radius*3.0);
      outer.addColorStop(0,`rgba(255,222,168,${.12*(playing?1:.72)*breath})`);
      outer.addColorStop(.18,`rgba(255,194,126,${.075*(playing?1:.72)})`);
      outer.addColorStop(.5,'rgba(72,180,255,.018)');
      outer.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=outer; ctx.fillRect(0,0,width,height);

      // Thin luminous rim behind the silhouette.
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      ctx.beginPath(); ctx.arc(ex,ey,radius*1.03,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,222,172,${.12*(playing?1:.7)})`; ctx.lineWidth=1.4; ctx.stroke();
      ctx.restore();

      // Dark celestial body.
      ctx.beginPath(); ctx.arc(ex,ey,radius,0,Math.PI*2);
      ctx.fillStyle='rgba(1,7,16,.94)'; ctx.fill();

      // Reveal only a crescent of the hidden light source.
      ctx.save();
      ctx.beginPath();
      ctx.arc(ex,ey,radius*1.018,0,Math.PI*2);
      ctx.clip();
      const cres=ctx.createRadialGradient(lightX,lightY,0,lightX,lightY,radius*1.2);
      cres.addColorStop(0,`rgba(255,239,202,${.95*(playing?1:.7)})`);
      cres.addColorStop(.32,`rgba(255,205,142,${.34*(playing?1:.7)})`);
      cres.addColorStop(.65,'rgba(255,170,100,.04)');
      cres.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=cres; ctx.fillRect(ex-radius*1.2,ey-radius*1.2,radius*2.4,radius*2.4);
      ctx.restore();

      if(!reduced || playing) raf=requestAnimationFrame(draw);
    }
    function start(){playing=true;if(!raf){last=performance.now();raf=requestAnimationFrame(draw);}}
    function stop(){playing=false;if(!raf)raf=requestAnimationFrame(draw);}
    resize();
    if(reduced)draw(performance.now());else raf=requestAnimationFrame(draw);
    window.addEventListener('resize',resize,{passive:true});
    return {start,stop};
  }

  function setup(){
    const card=document.querySelector('.hero-card');
    const player=card?.querySelector('.player');
    const oldQuote=card?.querySelector('.quote');
    if(!card||!player||!oldQuote||card.querySelector('.hero-cosmos'))return;

    const wrap=document.createElement('div'); wrap.className='hero-script-wrap';
    const script=document.createElement('div'); script.className='hero-script';
    const line=document.createElement('div'); line.className='hero-script-line';
    script.appendChild(line); wrap.appendChild(script);

    const timeline=document.createElement('div'); timeline.className='hero-timeline';
    segments.forEach((seg,i)=>{
      const item=document.createElement('div'); item.className='hero-timeline-item'; item.dataset.index=String(i);
      const time=document.createElement('span'); time.className='hero-timeline-time'; time.textContent=`00:${String(Math.floor(seg.start)).padStart(2,'0')}`;
      const text=document.createElement('span'); text.className='hero-timeline-text'; text.textContent=seg.text;
      item.append(document.createElement('span'),time,text); timeline.appendChild(item);
    });
    wrap.appendChild(timeline);
    oldQuote.replaceWith(wrap);

    const cosmos=createCosmos(card);
    const timelineItems=[...timeline.children];
    let activeIndex=-1,scale=1;

    function brandify(text){
      return text.replace(/SvaraONE/g,'<span class="brand-svara">Svara</span><span class="brand-one">ONE</span>');
    }
    function render(index){
      if(index<0||index>=segments.length||index===activeIndex)return;
      activeIndex=index;
      line.classList.remove('is-active');
      requestAnimationFrame(()=>{
        line.innerHTML=brandify(segments[index].text);
        line.classList.add('is-active');
      });
      timelineItems.forEach((item,i)=>item.classList.toggle('is-active',i===index));
    }
    function reset(){
      activeIndex=-1; line.classList.remove('is-active'); line.textContent=segments[0].text;
      timelineItems.forEach((item,i)=>item.classList.toggle('is-active',i===0));
      card.classList.remove('is-hero-playing'); cosmos.stop();
    }
    function sync(audio){
      if(!audio||!Number.isFinite(audio.currentTime))return;
      if(audio.duration>0&&Number.isFinite(audio.duration))scale=audio.duration/referenceDuration;
      const t=audio.currentTime/Math.max(scale,.01);
      let index=0;
      for(let i=0;i<segments.length;i++){if(t>=segments[i].start)index=i;else break;}
      render(index);
      if(audio.ended)reset();
    }

    document.addEventListener('play',event=>{
      const audio=event.target;
      if(!(audio instanceof HTMLMediaElement)||!String(audio.src).includes('/api/sample-hero'))return;
      card.classList.add('is-hero-playing'); cosmos.start(); sync(audio);
    },true);
    document.addEventListener('pause',event=>{
      const audio=event.target;
      if(!(audio instanceof HTMLMediaElement)||!String(audio.src).includes('/api/sample-hero'))return;
      card.classList.remove('is-hero-playing'); cosmos.stop();
    },true);
    document.addEventListener('timeupdate',event=>{
      const audio=event.target;
      if(!(audio instanceof HTMLMediaElement)||!String(audio.src).includes('/api/sample-hero'))return;
      sync(audio);
    },true);
    document.addEventListener('ended',event=>{
      const audio=event.target;
      if(!(audio instanceof HTMLMediaElement)||!String(audio.src).includes('/api/sample-hero'))return;
      reset();
    },true);
    reset();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();