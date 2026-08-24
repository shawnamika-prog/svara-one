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
  }

  const observer=new MutationObserver(syncOutput);
  observer.observe(result,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true});
  syncOutput();
})();
