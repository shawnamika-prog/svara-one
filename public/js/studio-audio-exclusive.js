(()=>{
const original=document.getElementById('player');
const processed=document.getElementById('processedAudio');
const tracked=new Set();
const NativeAudio=window.Audio;

function stopOthers(current){
  document.querySelectorAll('audio,video').forEach(media=>{
    if(media!==current&&!media.paused){
      media.pause();
      try{media.currentTime=0}catch{}
    }
  });
  tracked.forEach(media=>{
    if(media!==current&&!media.paused){
      media.pause();
      try{media.currentTime=0}catch{}
    }
  });
}

function stopAllAudio(){
  document.querySelectorAll('audio,video').forEach(media=>{
    media.pause();
    try{media.currentTime=0}catch{}
  });
  tracked.forEach(media=>{
    media.pause();
    try{media.currentTime=0}catch{}
  });
}

window.SVARA_STOP_ALL_AUDIO=stopAllAudio;

if(NativeAudio){
  window.Audio=function(...args){
    const media=new NativeAudio(...args);
    tracked.add(media);
    media.addEventListener('ended',()=>tracked.delete(media),{once:true});
    media.addEventListener('play',()=>stopOthers(media));
    return media;
  };
  window.Audio.prototype=NativeAudio.prototype;
}

document.addEventListener('play',event=>{
  const media=event.target;
  if(media instanceof HTMLMediaElement)stopOthers(media);
},true);

if(original&&processed){
  original.addEventListener('play',()=>{
    if(!processed.paused){processed.pause();try{processed.currentTime=0}catch{}}
  });
  processed.addEventListener('play',()=>{
    if(!original.paused){original.pause();try{original.currentTime=0}catch{}}
  });
}

// Stop all Studio audio whenever the user leaves the Voice view, including
// SPA navigation to My Library and full-page navigation to Home or Settings.
document.addEventListener('click',event=>{
  const link=event.target.closest('aside a, .studio-nav a');
  if(!link)return;
  const href=link.getAttribute('href')||'';
  if(href==='#voice')return;
  stopAllAudio();
},true);

window.addEventListener('hashchange',()=>{
  if(location.hash!=='#voice')stopAllAudio();
});

window.addEventListener('pagehide',stopAllAudio);
window.addEventListener('beforeunload',stopAllAudio);
window.addEventListener('pageshow',stopAllAudio);
})();
