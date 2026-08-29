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
  const HERO_BG = '/api/branding/hero-bg.png';

  const style = document.createElement('style');
  style.textContent = `
    .hero-card{
      position:relative;
      overflow:hidden;
      isolation:isolate;
      background-color:#030a14;
      background-image:linear-gradient(90deg,rgba(3,10,20,.58) 0%,rgba(3,10,20,.24) 48%,rgba(3,10,20,.05) 100%),url('${HERO_BG}');
      background-size:cover;
      background-position:center;
      background-repeat:no-repeat;
    }
    .hero-card > *{position:relative;z-index:3}
    .hero-card::after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(2,8,16,.18),rgba(2,8,16,.04) 45%,rgba(2,8,16,.3));}
    .hero-script-wrap{margin:20px 0 12px;position:relative;z-index:4}
    .hero-script{min-height:76px;display:flex;align-items:center;max-width:92%;overflow:hidden}
    .hero-script-line{font-size:25px;line-height:1.34;letter-spacing:-.015em;color:#e5f0fb;transition:opacity .35s ease,transform .45s ease;opacity:0;transform:translateY(7px);text-shadow:0 2px 24px rgba(0,0,0,.65)}
    .hero-script-line.is-active{opacity:1;transform:translateY(0)}
    .hero-script-line .brand-one{font-weight:inherit}
    .hero-timeline{display:flex;flex-direction:column;gap:5px;margin:0 0 8px;max-height:116px;overflow:hidden;position:relative;z-index:4}
    .hero-timeline-item{display:grid;grid-template-columns:6px 42px minmax(0,1fr);align-items:center;column-gap:9px;min-height:16px;opacity:.5;transition:opacity .3s ease,transform .3s ease}
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
    @media(max-width:700px){
      .hero-script{min-height:88px;max-width:100%}.hero-script-line{font-size:21px}
      .hero-timeline{max-height:108px}.hero-timeline-text{font-size:10px}
    }
    @media(max-width:650px){.hero-timeline-item{grid-template-columns:6px 38px minmax(0,1fr);column-gap:7px}}
    @media(prefers-reduced-motion:reduce){.hero-script-line,.hero-timeline-item{transition:none}}
  `;
  document.head.appendChild(style);

  function setup(){
    const card=document.querySelector('.hero-card');
    const player=card?.querySelector('.player');
    const oldQuote=card?.querySelector('.quote');
    if(!card||!player||!oldQuote)return;

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
      activeIndex=-1; line.classList.remove('is-active'); line.innerHTML=brandify(segments[0].text);
      timelineItems.forEach((item,i)=>item.classList.toggle('is-active',i===0));
    }
    function sync(audio){
      if(!audio||!Number.isFinite(audio.currentTime))return;
      if(audio.duration>0&&Number.isFinite(audio.duration))scale=audio.duration/referenceDuration;
      const t=audio.currentTime/Math.max(scale,.01);
      let index=0;
      for(let i=0;i<segments.length;i++){if(t>=segments[i].start)index=i;else break;}
      render(index);
    }

    document.addEventListener('play',event=>{
      const audio=event.target;
      if(!(audio instanceof HTMLMediaElement)||!String(audio.src).includes('/api/sample-hero'))return;
      sync(audio);
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