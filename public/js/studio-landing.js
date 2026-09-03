(()=>{
  const workspace=document.querySelector('.workspace');
  const voiceView=document.getElementById('voiceWorkspace');
  const libraryView=document.getElementById('myLibraryView');
  const voiceLink=document.querySelector('aside a[href="#voice"]');
  const soundLink=document.querySelector('aside a[href="#sound"]');
  const videoLink=document.querySelector('aside a[href="#video"]');
  const composeLink=document.querySelector('aside a[href="#compose"]');
  const libraryLink=document.querySelector('aside a[href="#library"]');
  const homeLink=document.querySelector('aside .home-link');
  const svaraFlowToggle=document.getElementById('svaraFlowToggle');
  if(!workspace||!voiceView||!libraryView||!voiceLink||!libraryLink||!homeLink)return;

  const assets={
    voice:'/api/branding/studio-voice-card.png',
    sound:'/api/branding/studio-sound-card.png',
    video:'/api/branding/studio-video-card.png',
    compose:'/api/branding/studio-compose-card.png'
  };

  const icons={
    voice:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 3v18M23 10v4"/></svg>',
    sound:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h4l5 4V5.5l-5 4z"/><path d="M17 9.2a4.2 4.2 0 0 1 0 5.6M19.5 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>',
    video:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3z"/></svg>',
    compose:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7z"/><path d="m19 3 .7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7z"/></svg>'
  };

  const soundStyle=document.createElement('style');
  soundStyle.textContent=`
    .sound-workspace{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(380px,.92fr);gap:18px;align-items:start;min-height:calc(100vh - 124px)}
    .sound-panel{border:1px solid #ffffff10;background:linear-gradient(180deg,#0a1020,#080d19);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px #0004}
    .sound-panel-head{padding:22px 22px 17px;border-bottom:1px solid #ffffff0b;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
    .sound-panel-head small{color:#a66cff;font-size:9px;letter-spacing:.2em;font-weight:800}.sound-panel-head h2{margin:6px 0 0;font-size:23px;letter-spacing:-.04em}.sound-panel-head p{margin:7px 0 0;color:#8091a8;font-size:11px;line-height:1.5}
    .sound-flow{display:flex;align-items:center;gap:9px;white-space:nowrap;padding:7px 10px;border:1px solid #a85cff45;border-radius:999px;background:#26143a;color:#d7b9ff;font-size:10px;font-weight:750}.sound-flow-dot{width:8px;height:8px;border-radius:50%;background:#c06cff;box-shadow:0 0 12px #c06cff99}.sound-flow.off{background:#101625;border-color:#ffffff14;color:#75879b}.sound-flow.off .sound-flow-dot{background:#66788c;box-shadow:none}
    .sound-prompt{margin:18px 20px 0}.sound-prompt textarea{width:100%;min-height:145px;resize:vertical;border:1px solid #ffffff12;border-radius:14px;background:#050a14;color:#edf4ff;padding:16px;font:13px/1.65 Inter,system-ui,sans-serif;outline:none}.sound-prompt textarea:focus{border-color:#a75cff77;box-shadow:0 0 0 3px #a75cff12}.sound-prompt-foot{display:flex;justify-content:space-between;gap:10px;margin-top:7px;color:#60738a;font-size:9px}.sound-inspire{border:0;background:transparent;color:#b878ff;font:700 10px Inter;cursor:pointer;padding:0}
    .sound-section{padding:18px 20px 0}.sound-label{display:block;margin-bottom:9px;color:#73879e;font-size:9px;letter-spacing:.14em;font-weight:800}.sound-type-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}.sound-choice{min-height:58px;border:1px solid #ffffff0d;border-radius:11px;background:#09111e;color:#8fa1b5;cursor:pointer;padding:8px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;transition:.16s ease;font:600 9px Inter}.sound-choice svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.sound-choice:hover{background:#101525;color:#d8e1ec;border-color:#ffffff1b}.sound-choice.active{background:linear-gradient(145deg,#24153b,#101d35);color:#d7a8ff;border-color:#a85cff77;box-shadow:inset 0 0 18px #a85cff10}
    .sound-moods{display:flex;flex-wrap:wrap;gap:7px}.sound-mood{border:1px solid #ffffff0d;border-radius:999px;background:#09111e;color:#8295aa;padding:8px 11px;font:600 9px Inter;cursor:pointer}.sound-mood:hover{color:#dce6f2;background:#101525}.sound-mood.active{color:#e0bdff;background:#2a1640;border-color:#a85cff66}
    .sound-control-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.sound-control{border:1px solid #ffffff0d;border-radius:12px;background:#09111e;padding:11px 12px}.sound-control-top{display:flex;justify-content:space-between;gap:8px;margin-bottom:9px;color:#91a3b7;font-size:9px}.sound-control-top strong{color:#e1ebf5;font-size:10px}.sound-control select{width:100%;border:1px solid #ffffff0d;background:#0b1524;color:#dbe7f3;border-radius:8px;padding:8px;font:600 10px Inter;outline:none}.sound-range{width:100%;height:5px;appearance:none;-webkit-appearance:none;background:#30394a;border-radius:999px;outline:none}.sound-range::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:17px;height:17px;border:0;border-radius:50%;background:#b568ff;box-shadow:0 0 0 3px #b568ff14;cursor:pointer}.sound-range::-moz-range-thumb{width:17px;height:17px;border:0;border-radius:50%;background:#b568ff;cursor:pointer}
    .sound-advanced{margin:14px 20px 0;border-top:1px solid #ffffff0b;padding-top:13px}.sound-advanced-toggle{display:flex;align-items:center;justify-content:space-between;color:#8799ad;font-size:10px;font-weight:700;cursor:pointer}.sound-advanced-toggle span:last-child{color:#b568ff;font-size:9px}.sound-advanced-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:11px}.sound-advanced-body[hidden]{display:none}.sound-advanced-item{padding:10px 11px;border:1px solid #ffffff0b;border-radius:10px;background:#08101c}.sound-advanced-item label{display:flex;justify-content:space-between;color:#8193a7;font-size:9px}.sound-advanced-item input,.sound-advanced-item select{width:100%;margin-top:8px}
    .sound-generate{width:calc(100% - 40px);margin:18px 20px 7px;border:0;border-radius:12px;padding:14px 16px;background:linear-gradient(105deg,#5c73ff,#8c4cf3 55%,#c15cff);color:#fff;font:800 11px Inter;cursor:pointer;box-shadow:0 10px 30px #7a4cf32a;transition:.18s ease}.sound-generate:hover{transform:translateY(-1px);filter:brightness(1.06)}.sound-generate:disabled{opacity:.72;cursor:wait;transform:none}.sound-generation-note{text-align:center;color:#586c82;font-size:9px;padding:0 20px 17px}
    .sound-output{min-height:610px}.sound-output-body{padding:20px}.sound-empty{min-height:480px;display:grid;place-items:center;align-content:center;text-align:center;padding:25px}.sound-empty-wave{height:88px;display:flex;align-items:center;gap:4px;margin-bottom:22px}.sound-empty-wave i{width:3px;border-radius:99px;background:linear-gradient(180deg,#a75cff,#3d7bff);height:var(--h);opacity:.32}.sound-empty h3{margin:0;color:#a8b7c8;font-size:14px}.sound-empty p{max-width:310px;margin:8px auto 0;color:#5f7289;font-size:10px;line-height:1.6}.sound-result{display:none}.sound-result.show{display:block}.sound-main-card{border:1px solid #a85cff33;border-radius:15px;background:linear-gradient(145deg,#111326,#0b1120);overflow:hidden;box-shadow:inset 0 0 30px #9c5cff08}.sound-result-top{padding:15px 16px;border-bottom:1px solid #ffffff0a;display:flex;align-items:center;justify-content:space-between;gap:12px}.sound-result-top strong{font-size:12px}.sound-result-top span{color:#8f6bb5;font-size:9px}.sound-wave{height:115px;margin:17px;border-radius:12px;border:1px solid #ffffff0a;background:#060a14;display:flex;align-items:center;justify-content:center;gap:3px;padding:10px;overflow:hidden}.sound-wave i{width:3px;min-height:5px;height:var(--h);border-radius:99px;background:linear-gradient(180deg,#d36cff,#5377ff);opacity:.78;transform-origin:center}.sound-wave.playing i{animation:soundPulse .72s ease-in-out infinite alternate}.sound-wave.playing i:nth-child(2n){animation-delay:-.2s}.sound-wave.playing i:nth-child(3n){animation-delay:-.4s}@keyframes soundPulse{from{transform:scaleY(.55);opacity:.45}to{transform:scaleY(1.08);opacity:.95}}
    .sound-player-row{display:flex;align-items:center;gap:12px;padding:0 17px 17px}.sound-play{width:43px;height:43px;flex:none;border:0;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#6975ff,#bd59ff);cursor:pointer;box-shadow:0 0 22px #a85cff28}.sound-play span{width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:9px solid #fff;margin-left:2px}.sound-time{display:flex;justify-content:space-between;color:#71839a;font-size:9px;flex:1}.sound-time strong{color:#c4d1de;font-size:10px}
    .sound-actions{display:flex;gap:8px;padding:0 17px 17px}.sound-action{flex:1;border:1px solid #ffffff12;border-radius:10px;background:#0b1523;color:#aab9c8;padding:10px;font:700 9px Inter;cursor:pointer}.sound-action.primary{background:linear-gradient(105deg,#263b72,#7439a4);border-color:#a85cff55;color:#fff}
    .sound-variations{margin-top:16px}.sound-subhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.sound-subhead small{color:#75889f;font-size:9px;letter-spacing:.14em;font-weight:800}.sound-subhead span{color:#5e7289;font-size:8px}.sound-variation{display:flex;align-items:center;gap:10px;padding:11px;border:1px solid #ffffff0b;border-radius:11px;background:#09111e;margin-bottom:7px}.sound-mini-play{width:28px;height:28px;border-radius:50%;border:1px solid #a85cff44;background:#18122a;color:#ca82ff;display:grid;place-items:center;cursor:pointer;font-size:9px}.sound-variation-copy{min-width:0;flex:1}.sound-variation-copy strong{display:block;color:#cdd9e5;font-size:10px}.sound-variation-copy small{display:block;margin-top:3px;color:#61758c;font-size:8px}.sound-variation-wave{height:26px;width:100px;display:flex;align-items:center;gap:2px}.sound-variation-wave i{width:2px;height:var(--h);background:#7253a8;border-radius:99px;opacity:.7}.sound-mock-note{margin-top:14px;padding:10px 11px;border:1px solid #a85cff22;border-radius:10px;background:#120e1d;color:#786b8a;font-size:8px;line-height:1.5}.sound-mock-note strong{color:#a97dca}
    @media(max-width:1050px){.sound-workspace{grid-template-columns:1fr}.sound-output{min-height:0}.sound-empty{min-height:280px}.sound-type-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:560px){.sound-workspace{display:block}.sound-workspace>*{margin-bottom:12px}.sound-panel-head{padding:18px 15px}.sound-flow{display:none}.sound-prompt,.sound-section{margin-left:14px;margin-right:14px}.sound-control-grid{grid-template-columns:1fr}.sound-advanced{margin-left:14px;margin-right:14px}.sound-generate{width:calc(100% - 28px);margin-left:14px;margin-right:14px}.sound-type-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.sound-output-body{padding:12px}.sound-wave{margin:12px}.sound-actions{padding-left:12px;padding-right:12px}.sound-player-row{padding-left:12px;padding-right:12px}.sound-variation-wave{width:70px}}
  `;
  document.head.appendChild(soundStyle);

  const landing=document.createElement('section');
  landing.id='studioLanding';
  landing.className='studio-landing';
  landing.innerHTML=`
    <div class="studio-landing-hero">
      <p class="studio-landing-eyebrow">WELCOME TO SVARAONE STUDIO</p>
      <h1>What do you <span>want to create?</span></h1>
      <p class="studio-landing-lede">Create with voice, sound and video — or let SvaraFlow orchestrate your idea into one complete composition.</p>
    </div>
    <div class="studio-landing-grid">
      <a href="#voice" class="studio-domain-card" data-domain="voice" aria-label="Open Voice workspace">
        <img src="${assets.voice}" alt="" loading="eager" decoding="async">
        <span class="studio-card-top">${icons.voice}</span>
        <div class="studio-card-copy"><p class="studio-card-kicker">VOICE</p><h2>Create voices that connect.</h2><p class="studio-card-description">Natural, expressive voice creation for real creative work.</p><span class="studio-card-cta">Explore Voice <span aria-hidden="true">→</span></span></div>
      </a>
      <a href="#sound" class="studio-domain-card" data-domain="sound" aria-label="Open Sound workspace">
        <img src="${assets.sound}" alt="" loading="lazy" decoding="async">
        <span class="studio-card-top">${icons.sound}</span>
        <div class="studio-card-copy"><p class="studio-card-kicker">SOUND</p><h2>Create sound that moves.</h2><p class="studio-card-description">Music, SFX and sonic worlds built for your projects.</p><span class="studio-card-cta">Explore Sound <span aria-hidden="true">→</span></span></div>
      </a>
      <a href="#video" class="studio-domain-card" data-domain="video" aria-label="Open Video workspace">
        <img src="${assets.video}" alt="" loading="lazy" decoding="async">
        <span class="studio-card-top">${icons.video}</span>
        <div class="studio-card-copy"><p class="studio-card-kicker">VIDEO</p><h2>Create videos that inspire.</h2><p class="studio-card-description">Bring ideas to life through cinematic visual creation.</p><span class="studio-card-cta">Explore Video <span aria-hidden="true">→</span></span></div>
      </a>
    </div>
    <a href="#compose" class="studio-compose-card" aria-label="Compose with SvaraFlow">
      <img src="${assets.compose}" alt="" loading="lazy" decoding="async">
      <div class="studio-compose-copy"><p class="studio-compose-kicker">HAVE AN IDEA?</p><h2>Compose with <span>SvaraFlow</span></h2><p>Describe what you want to create and SvaraFlow understands your intent, orchestrates the right creative capabilities, and brings voice, sound and video into a single creative composition.</p><span class="studio-compose-cta">Start creating with SvaraFlow <span aria-hidden="true">→</span></span></div>
    </a>
    <div class="studio-landing-footer"><strong>ONE</strong> Intelligent Orchestration . <strong>THREE</strong> Creative Domains . <strong>ONE</strong> Studio</div>`;
  workspace.prepend(landing);

  const soundView=document.createElement('section');
  soundView.id='soundWorkspace';
  soundView.className='sound-workspace';
  soundView.hidden=true;
  soundView.innerHTML=`
    <section class="sound-panel">
      <div class="sound-panel-head">
        <div><small>SOUND STUDIO</small><h2>Create sound that moves.</h2><p>Shape music, sound effects, ambience and sonic worlds for your creative work.</p></div>
        <div id="soundFlowBadge" class="sound-flow"><span class="sound-flow-dot"></span>SvaraFlow ON</div>
      </div>
      <div class="sound-prompt">
        <textarea id="soundPrompt" maxlength="2000" placeholder="Describe the sound you want to create…">Cinematic emotional soundscape for a premium coffee advert — warm strings, subtle percussion, intimate atmosphere, gentle build.</textarea>
        <div class="sound-prompt-foot"><span id="soundPromptCount">0 / 2,000</span><button id="soundInspire" class="sound-inspire" type="button">✦ Inspire me</button></div>
      </div>
      <div class="sound-section"><span class="sound-label">TYPE</span>
        <div class="sound-type-grid">
          <button class="sound-choice active" type="button" data-sound-type="music"><svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>Music</button>
          <button class="sound-choice" type="button" data-sound-type="sfx"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l6 4V5l-6 4z"/><path d="M18 9a4 4 0 0 1 0 6M20 6a8 8 0 0 1 0 12"/></svg>SFX</button>
          <button class="sound-choice" type="button" data-sound-type="ambience"><svg viewBox="0 0 24 24"><path d="M4 16c3-4 6-4 8 0s5 4 8 0"/><path d="M4 11c3-4 6-4 8 0s5 4 8 0"/></svg>Ambience</button>
          <button class="sound-choice" type="button" data-sound-type="loop"><svg viewBox="0 0 24 24"><path d="M4 8V5h3M20 16v3h-3"/><path d="M6 6a8 8 0 0 1 12 2M18 18a8 8 0 0 1-12-2"/></svg>Loop</button>
          <button class="sound-choice" type="button" data-sound-type="jingle"><svg viewBox="0 0 24 24"><path d="M8 18V6l10-2v12"/><circle cx="5" cy="18" r="3"/><circle cx="15" cy="16" r="3"/></svg>Jingle</button>
          <button class="sound-choice" type="button" data-sound-type="transition"><svg viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7"/></svg>Transition</button>
        </div>
      </div>
      <div class="sound-section"><span class="sound-label">MOOD</span>
        <div class="sound-moods"><button class="sound-mood" type="button">Cinematic</button><button class="sound-mood active" type="button">Emotional</button><button class="sound-mood" type="button">Dark</button><button class="sound-mood" type="button">Uplifting</button><button class="sound-mood" type="button">Peaceful</button><button class="sound-mood" type="button">Energetic</button><button class="sound-mood" type="button">Playful</button></div>
      </div>
      <div class="sound-section"><span class="sound-label">SHAPE</span>
        <div class="sound-control-grid">
          <div class="sound-control"><div class="sound-control-top"><span>Duration</span><strong>01:30</strong></div><select><option>00:30</option><option>01:00</option><option selected>01:30</option><option>02:00</option><option>03:00</option></select></div>
          <div class="sound-control"><div class="sound-control-top"><span>Tempo</span><strong id="soundTempoValue">100 BPM</strong></div><input id="soundTempo" class="sound-range" type="range" min="60" max="160" value="100"></div>
          <div class="sound-control"><div class="sound-control-top"><span>Intensity</span><strong id="soundIntensityValue">Medium</strong></div><input id="soundIntensity" class="sound-range" type="range" min="0" max="100" value="55"></div>
        </div>
      </div>
      <div class="sound-advanced">
        <div id="soundAdvancedToggle" class="sound-advanced-toggle" role="button" tabindex="0" aria-expanded="false"><span>Advanced sound controls</span><span>SHOW +</span></div>
        <div id="soundAdvancedBody" class="sound-advanced-body" hidden>
          <div class="sound-advanced-item"><label><span>Complexity</span><b id="soundComplexityValue">Balanced</b></label><input id="soundComplexity" class="sound-range" type="range" min="0" max="100" value="50"></div>
          <div class="sound-advanced-item"><label><span>Texture</span><b>Organic</b></label><select><option>Organic</option><option>Electronic</option><option>Hybrid</option><option>Minimal</option></select></div>
          <div class="sound-advanced-item"><label><span>Instrumental</span><b>ON</b></label><input type="checkbox" checked style="accent-color:#b568ff"></div>
          <div class="sound-advanced-item"><label><span>Exclude vocals</span><b>ON</b></label><input type="checkbox" checked style="accent-color:#b568ff"></div>
        </div>
      </div>
      <button id="soundGenerate" class="sound-generate" type="button">Generate Sound</button>
      <div class="sound-generation-note">Mockup only — generation is not connected to a provider yet.</div>
    </section>
    <section class="sound-panel sound-output">
      <div class="sound-panel-head"><div><small>OUTPUT</small><h2>Sound preview</h2><p>Preview the result and explore variations.</p></div></div>
      <div class="sound-output-body">
        <div id="soundEmpty" class="sound-empty">
          <div><div class="sound-empty-wave">${Array.from({length:38},(_,i)=>`<i style="--h:${18+(i*17)%61}px"></i>`).join('')}</div><h3>Your sound will appear here</h3><p>Describe an idea, shape its character and generate a sound asset.</p></div>
        </div>
        <div id="soundResult" class="sound-result">
          <div class="sound-main-card">
            <div class="sound-result-top"><strong>Cinematic Emotional Pad</strong><span>Music · 01:30</span></div>
            <div id="soundWave" class="sound-wave">${Array.from({length:74},(_,i)=>`<i style="--h:${12+(i*31)%78}px"></i>`).join('')}</div>
            <div class="sound-player-row"><button id="soundPlay" class="sound-play" type="button" aria-label="Play sound"><span></span></button><div class="sound-time"><strong id="soundCurrentTime">0:00</strong><span>01:30</span></div></div>
            <div class="sound-actions"><button class="sound-action primary" type="button">Download</button><button class="sound-action" type="button">Add to Library</button></div>
          </div>
          <div class="sound-variations"><div class="sound-subhead"><small>VARIATIONS</small><span>3 generated options</span></div>
            <div class="sound-variation"><button class="sound-mini-play" type="button">▶</button><div class="sound-variation-copy"><strong>Emotional Pad 01</strong><small>01:30 · Balanced</small></div><div class="sound-variation-wave">${Array.from({length:20},(_,i)=>`<i style="--h:${5+(i*11)%20}px"></i>`).join('')}</div></div>
            <div class="sound-variation"><button class="sound-mini-play" type="button">▶</button><div class="sound-variation-copy"><strong>Emotional Pad 02</strong><small>01:30 · Warmer</small></div><div class="sound-variation-wave">${Array.from({length:20},(_,i)=>`<i style="--h:${5+(i*7)%20}px"></i>`).join('')}</div></div>
            <div class="sound-variation"><button class="sound-mini-play" type="button">▶</button><div class="sound-variation-copy"><strong>Emotional Pad 03</strong><small>01:30 · More cinematic</small></div><div class="sound-variation-wave">${Array.from({length:20},(_,i)=>`<i style="--h:${5+(i*13)%20}px"></i>`).join('')}</div></div>
          </div>
          <div class="sound-mock-note"><strong>UI prototype.</strong> These controls establish the Sound Studio experience before we connect SvaraFlow, provider adapters, Cloudflare configuration, D1 and R2.</div>
        </div>
      </div>
    </section>`;
  workspace.appendChild(soundView);

  const placeholder=document.createElement('section');
  placeholder.id='studioPlaceholder';
  placeholder.className='studio-domain-placeholder';
  placeholder.hidden=true;
  workspace.appendChild(placeholder);

  function setActive(active){
    [homeLink,voiceLink,soundLink,videoLink,composeLink,libraryLink].filter(Boolean).forEach(link=>link.classList.remove('active'));
    const link=({studio:homeLink,voice:voiceLink,sound:soundLink,video:videoLink,compose:composeLink,library:libraryLink})[active];
    if(link)link.classList.add('active');
  }

  function show(view,updateHash=true){
    if(updateHash)history.replaceState(null,'',view==='studio'?'#studio':`#${view}`);
    landing.hidden=view!=='studio';
    voiceView.hidden=view!=='voice';
    soundView.hidden=view!=='sound';
    libraryView.hidden=view!=='library';
    placeholder.hidden=!['video','compose'].includes(view);
    if(['video','compose'].includes(view)){
      const labels={video:['Video','Video workspace'],compose:['Compose','SvaraFlow composition workspace']};
      const [title,subtitle]=labels[view];
      placeholder.innerHTML=`<div class="placeholder-panel"><small>${title.toUpperCase()}</small><h2>${subtitle}</h2><p>This workspace is being built as an independent SvaraONE domain. The Studio landing page is ready for it.</p></div>`;
    }
    setActive(view);
    if(view==='library')window.SvaraLibrary?.refresh?.();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  const soundPrompt=document.getElementById('soundPrompt');
  const soundPromptCount=document.getElementById('soundPromptCount');
  const soundInspire=document.getElementById('soundInspire');
  const soundGenerate=document.getElementById('soundGenerate');
  const soundResult=document.getElementById('soundResult');
  const soundEmpty=document.getElementById('soundEmpty');
  const soundWave=document.getElementById('soundWave');
  const soundPlay=document.getElementById('soundPlay');
  const soundFlowBadge=document.getElementById('soundFlowBadge');
  const soundAdvancedToggle=document.getElementById('soundAdvancedToggle');
  const soundAdvancedBody=document.getElementById('soundAdvancedBody');
  const soundTempo=document.getElementById('soundTempo');
  const soundTempoValue=document.getElementById('soundTempoValue');
  const soundIntensity=document.getElementById('soundIntensity');
  const soundIntensityValue=document.getElementById('soundIntensityValue');
  const soundComplexity=document.getElementById('soundComplexity');
  const soundComplexityValue=document.getElementById('soundComplexityValue');

  const updatePromptCount=()=>{if(soundPrompt&&soundPromptCount)soundPromptCount.textContent=`${soundPrompt.value.length.toLocaleString()} / 2,000`;};
  soundPrompt?.addEventListener('input',updatePromptCount);updatePromptCount();
  soundInspire?.addEventListener('click',()=>{if(soundPrompt){soundPrompt.value='A warm cinematic soundscape for a premium South African coffee advert — intimate café ambience, soft strings, subtle percussion and a confident emotional build.';updatePromptCount();soundPrompt.focus();}});
  soundView.querySelectorAll('[data-sound-type]').forEach(button=>button.addEventListener('click',()=>{soundView.querySelectorAll('[data-sound-type]').forEach(b=>b.classList.remove('active'));button.classList.add('active');}));
  soundView.querySelectorAll('.sound-mood').forEach(button=>button.addEventListener('click',()=>{soundView.querySelectorAll('.sound-mood').forEach(b=>b.classList.remove('active'));button.classList.add('active');}));
  soundTempo?.addEventListener('input',()=>{soundTempoValue.textContent=`${soundTempo.value} BPM`;});
  soundIntensity?.addEventListener('input',()=>{const v=Number(soundIntensity.value);soundIntensityValue.textContent=v<34?'Low':v<67?'Medium':'High';});
  soundComplexity?.addEventListener('input',()=>{const v=Number(soundComplexity.value);soundComplexityValue.textContent=v<34?'Simple':v<67?'Balanced':'Dense';});
  const toggleAdvanced=()=>{const open=soundAdvancedBody.hidden;soundAdvancedBody.hidden=!open;soundAdvancedToggle.setAttribute('aria-expanded',String(open));soundAdvancedToggle.lastElementChild.textContent=open?'HIDE −':'SHOW +';};
  soundAdvancedToggle?.addEventListener('click',toggleAdvanced);soundAdvancedToggle?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleAdvanced();}});
  soundGenerate?.addEventListener('click',()=>{soundGenerate.disabled=true;soundGenerate.textContent='Generating preview…';setTimeout(()=>{soundEmpty.style.display='none';soundResult.classList.add('show');soundGenerate.disabled=false;soundGenerate.textContent='Generate Sound';},850);});
  soundPlay?.addEventListener('click',()=>{soundWave.classList.toggle('playing');soundPlay.setAttribute('aria-label',soundWave.classList.contains('playing')?'Pause sound':'Play sound');});
  soundView.querySelectorAll('.sound-mini-play').forEach(button=>button.addEventListener('click',()=>{button.textContent=button.textContent==='▶'?'Ⅱ':'▶';}));

  homeLink.addEventListener('click',e=>{e.preventDefault();show('studio');});
  voiceLink.addEventListener('click',e=>{e.preventDefault();show('voice');});
  soundLink?.addEventListener('click',e=>{e.preventDefault();show('sound');});
  videoLink?.addEventListener('click',e=>{e.preventDefault();show('video');});
  composeLink?.addEventListener('click',e=>{e.preventDefault();show('compose');});
  libraryLink.addEventListener('click',e=>{e.preventDefault();show('library');});
  landing.addEventListener('click',e=>{const card=e.target.closest('a[data-domain]');if(card){e.preventDefault();show(card.dataset.domain);return;}if(e.target.closest('.studio-compose-card')){e.preventDefault();show('compose');}});

  if(svaraFlowToggle){
    svaraFlowToggle.checked=true;
    svaraFlowToggle.dispatchEvent(new Event('change'));
    svaraFlowToggle.addEventListener('change',()=>{if(soundFlowBadge){soundFlowBadge.classList.toggle('off',!svaraFlowToggle.checked);soundFlowBadge.innerHTML=`<span class="sound-flow-dot"></span>SvaraFlow ${svaraFlowToggle.checked?'ON':'OFF'}`;}});
  }

  const initial=location.hash.replace(/^#/,'');
  show(['voice','sound','video','compose','library'].includes(initial)?initial:'studio',false);
})();