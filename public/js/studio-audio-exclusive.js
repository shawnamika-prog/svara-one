(()=>{
const original=document.getElementById('player');
const processed=document.getElementById('processedAudio');
if(!original||!processed)return;
original.addEventListener('play',()=>{if(!processed.paused)processed.pause()});
processed.addEventListener('play',()=>{if(!original.paused)original.pause()});
})();
