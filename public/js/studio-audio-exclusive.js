(()=>{
const original=document.getElementById('player');
const processed=document.getElementById('processedAudio');
const tracked=new Set();
const NativeAudio=window.Audio;

function pauseOthers(current){
  document.querySelectorAll('audio,video').forEach(media=>{if(media!==current&&!media.paused)media.pause()});
  tracked.forEach(media=>{if(media!==current&&!media.paused)media.pause()});
}

if(NativeAudio){
  window.Audio=function(...args){
    const media=new NativeAudio(...args);
    tracked.add(media);
    media.addEventListener('ended',()=>tracked.delete(media),{once:true});
    media.addEventListener('play',()=>pauseOthers(media));
    return media;
  };
  window.Audio.prototype=NativeAudio.prototype;
}

document.addEventListener('play',event=>{
  const media=event.target;
  if(media instanceof HTMLMediaElement)pauseOthers(media);
},true);

if(original&&processed){
  original.addEventListener('play',()=>{if(!processed.paused)processed.pause()});
  processed.addEventListener('play',()=>{if(!original.paused)original.pause()});
}
})();
