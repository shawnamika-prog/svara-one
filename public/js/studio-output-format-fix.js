(()=>{
  const $=id=>document.getElementById(id);
  const result=$('result'), formatSelect=$('outputFormat'), customPlayer=$('customPlayer'), formatReady=$('formatReady'), player=$('player'), download=$('download');
  if(!result||!formatSelect||!customPlayer||!formatReady)return;

  function syncOutput(){
    const format=formatSelect.value||'mp3';
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

  const observer=new MutationObserver(()=>{
    if(!result.hidden)syncOutput();
  });
  observer.observe(result,{attributes:true,attributeFilter:['hidden']});
})();
