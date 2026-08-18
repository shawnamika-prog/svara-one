(() => {
const voices=window.SVARA_VOICES||[], list=document.getElementById('voiceList'), search=document.getElementById('voiceSearch');
let filter='all', selected=voices[0];
const $=id=>document.getElementById(id);
function render(){
 const q=(search.value||'').toLowerCase();
 list.innerHTML=voices.filter(v=>(filter==='all'||v.category===filter)&&`${v.name} ${v.region} ${v.style}`.toLowerCase().includes(q)).map(v=>`<button class="voice ${selected.id===v.id?'selected':''}" data-id="${v.id}"><span class="avatar">${v.name[0]}</span><span><b>${v.name}</b><small>${v.region} · ${v.style}</small></span><em>›</em></button>`).join('');
 list.querySelectorAll('.voice').forEach(b=>b.onclick=()=>{selected=voices.find(v=>v.id===b.dataset.id)||selected;render();});
}
document.querySelectorAll('.filters button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render();});
search.oninput=render;
const script=$('script'), count=$('charCount'), cost=$('estimatedCost');
function updateCount(){const n=script.value.length;count.textContent=`${n.toLocaleString()} / 10,000`;cost.textContent=`${n.toLocaleString()} credits`;}
script.addEventListener('input',updateCount); updateCount();
$('speed').oninput=e=>$('speedValue').textContent=`${Number(e.target.value).toFixed(2)}×`;
$('stability').oninput=e=>$('stabilityValue').textContent=`${e.target.value}%`;
$('generate').onclick=async()=>{
 const text=script.value.trim(); if(!text)return;
 const btn=$('generate'); btn.disabled=true; btn.textContent='Generating…'; $('status').textContent='Generating';
 try{
   const res=await fetch('/api/voice/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
     voiceId:selected.id,text,format:'mp3',speed:Number($('speed').value),stability:Number($('stability').value),style:$('style').value
   })});
   if(!res.ok) throw new Error(`Generation failed (${res.status})`);
   const blob=await res.blob(), url=URL.createObjectURL(blob);
   $('player').src=url;$('download').href=url;$('result').hidden=false;$('empty').hidden=true;$('status').textContent='Ready';
 }catch(e){$('status').textContent='Error';$('debug').textContent=e.message;}
 finally{btn.disabled=false;btn.textContent='✦ Generate voice';}
};
render();
})();