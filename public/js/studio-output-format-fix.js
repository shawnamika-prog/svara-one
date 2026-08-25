(()=>{
  const $=id=>document.getElementById(id);
  const result=$('result'),formatSelect=$('outputFormat'),customPlayer=$('customPlayer'),formatReady=$('formatReady'),player=$('player'),download=$('download'),playerTitle=$('playerTitle');
  if(!result||!customPlayer||!formatReady)return;

  let lastFormat=null;

  function getGeneratedFormat(){
    const title=String(playerTitle?.textContent||'');
    const match=title.match(/·\s*(MP3|WAV|PCM)$/i);
    if(match)return match[1].toLowerCase();
    return String(formatSelect?.value||'mp3').toLowerCase();
  }

  function stampNow(){
    const d=new Date(),pad=n=>String(n).padStart(2,'0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}_${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  }

  function safeVoiceName(value){
    const name=String(value||'voice').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase();
    return name||'voice';
  }

  function filenameFor(voiceName,format,stamp){
    const extension=['mp3','wav','pcm'].includes(String(format||'').toLowerCase())?String(format).toLowerCase():'mp3';
    return `svara1_${safeVoiceName(voiceName)}_${stamp}.${extension}`;
  }

  // Add one server-authoritative filename stamp to the paid generation request.
  // The server uses the same stamp for the R2 object name; this keeps the
  // browser download name and R2 object name exactly identical.
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(input,init={})=>{
    const url=typeof input==='string'?input:(input?.url||'');
    const headers=new Headers(init.headers||{});
    if(url.endsWith('/api/voice/generate')&&(init.method||'GET').toUpperCase()==='POST'&&headers.get('X-SvaraONE-Free-Take')!=='true'&&typeof init.body==='string'){
      try{
        const body=JSON.parse(init.body);
        const stamp=stampNow();
        const voiceName=String(body.voiceName||'voice');
        body.voiceName=`${voiceName}@@SVARA1:${stamp}`;
        window.__svaraGenerationFilename=filenameFor(voiceName,body.format,stamp);
        init={...init,body:JSON.stringify(body)};
      }catch(_){ }
    }
    return nativeFetch(input,init);
  };

  function syncOutput(){
    if(result.hidden)return;
    const format=getGeneratedFormat();
    if(format===lastFormat)return;
    lastFormat=format;

    const info={
      mp3:{badge:'MP3',title:'MP3 audio ready',description:'Compressed audio output — ready to play, share or download.',download:'Download MP3'},
      wav:{badge:'WAV',title:'WAV audio ready',description:'Uncompressed audio output — ideal for editing and production workflows.',download:'Download WAV'},
      pcm:{badge:'PCM',title:'Linear16 audio ready',description:'Raw PCM output — download the file to use it in your audio workflow.',download:'Download PCM'}
    }[format]||{badge:format.toUpperCase(),title:`${format.toUpperCase()} audio ready`,description:'Audio output is ready to download and use in your workflow.',download:`Download ${format.toUpperCase()}`};

    $('formatBadge').textContent=info.badge;
    $('formatTitle').textContent=info.title;
    $('formatDescription').textContent=info.description;
    if(download)download.textContent=info.download;
    formatReady.hidden=false;

    if(format==='pcm'){
      if(player){
        player.pause();
        player.removeAttribute('src');
        player.load();
      }
      customPlayer.hidden=true;
    }else{
      customPlayer.hidden=false;
    }

    if(download&&window.__svaraGenerationFilename)download.download=window.__svaraGenerationFilename;
  }

  window.addEventListener('svara:generation-ready',()=>{
    if(download&&window.__svaraGenerationFilename)download.download=window.__svaraGenerationFilename;
  });

  const observer=new MutationObserver(syncOutput);
  observer.observe(result,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true});
  syncOutput();
})();
