(() => {
  const segments = [
    { start: 0.0, text: 'Every story has a moment that makes you, stop and listen.' },
    { start: 5.0, text: 'Sometimes, it’s a whisper in the dark.' },
    { start: 9.2, text: 'It’s the excitement in someone’s voice, when they finally say — “We did it.”' },
    { start: 16.2, text: 'It’s the pause before the words that change everything.' },
    { start: 21.6, text: 'And sometimes... it’s just a few simple words, spoken exactly, the way they should be.' },
    { start: 29.2, text: 'That’s when voice becomes more than sound — It becomes a feeling...' },
    { start: 34.2, text: 'Welcome to Svara ONE.' },
    { start: 36.7, text: 'Intelligent performance orchestration- for natural — expressive voice.' },
    { start: 40.3, text: "I'm Kaya, one of the many expressive voices at Svara ONE." }
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
      background-size:110% auto;
      background-position:0% 0%;
      background-repeat:no-repeat;
    }
    .hero-card > *{position:relative;z-index:3}
    .hero-card::after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(2,8,16,.18),rgba(2,8,16,.04) 45%,rgba(2,8,16,.3));}
    .hero-card .voice-row strong{font-size:inherit}
    .hero-card .voice-row small{font-size:inherit}
    .hero-script-wrap{margin:20px 0 12px;position:relative;z-index:4}
    .hero-script{min-height:76px;display:flex;align-items:center;max-width:92%;overflow:hidden}
    .hero-script-line{font-size:25px;line-height:1.34;letter-spacing:-.015em;color:#e5f0fb;transition:opacity .35s ease,transform .45s ease;opacity:0;transform:translateY(7px);text-shadow:0 2px 24px rgba(0,0,0,.65)}
    .hero-script-line.is-active{opacity:1;transform:translateY(0)}
    .hero-script-line .brand-one{font-weight:inherit}
    .hero-card .wave{position:relative;z-index:4;opacity:.9;width:72%;margin-left:auto;margin-right:auto;height:60px;display:flex;gap:5px;align-items:center;justify-content:space-between}
    .hero-card .wave i{transition:height .12s ease;flex:1 1 0;min-width:2px;max-width:5px}
    @media(max-width:700px){
      .hero-script{min-height:88px;max-width:100%}.hero-script-line{font-size:21px}
      .hero-card .wave{width:78%;height:54px;gap:3px}
      .hero-card .wave i{max-width:4px}
    }
    @media(prefers-reduced-motion:reduce){.hero-script-line{transition:none}}
  `;
  document.head.appendChild(style);

  function setup(){
    const card=document.querySelector('.hero-card');
    const player=card?.querySelector('.player');
    const oldQuote=card?.querySelector('.quote');
    if(!card||!player||!oldQuote)return;

    const voiceName=card.querySelector('.voice-row strong');
    const voiceMeta=card.querySelector('.voice-row small');
    const avatar=card.querySelector('.avatar');
    if(voiceName)voiceName.textContent='Kaya';
    if(voiceMeta)voiceMeta.textContent='American English';
    if(avatar)avatar.textContent='K';

    const wrap=document.createElement('div'); wrap.className='hero-script-wrap';
    const script=document.createElement('div'); script.className='hero-script';
    const line=document.createElement('div'); line.className='hero-script-line';
    script.appendChild(line); wrap.appendChild(script);
    oldQuote.replaceWith(wrap);

    let activeIndex=-1,scale=1;
    function brandify(text){
      return text.replace(/Svara ONE|SvaraONE/g,'<span class="brand-svara">Svara</span> <span class="brand-one">ONE</span>');
    }
    function render(index){
      if(index<0||index>=segments.length||index===activeIndex)return;
      activeIndex=index;
      line.classList.remove('is-active');
      requestAnimationFrame(()=>{
        line.innerHTML=brandify(segments[index].text);
        line.classList.add('is-active');
      });
    }
    function reset(){
      activeIndex=-1;
      line.classList.remove('is-active');
      line.innerHTML=brandify(segments[0].text);
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