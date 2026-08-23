(()=>{
  const box=document.getElementById('languageWarning');
  if(!box)return;
  const rewrite=()=>{
    if(box.hidden||!box.textContent.includes('Language mismatch'))return;
    const text=box.textContent;
    const match=text.match(/This voice is\s+([^,]+),\s+but your script appears to be\s+([^\.]+)/i);
    if(!match)return;
    const voiceLanguage=match[1].trim();
    const scriptLanguage=match[2].trim();
    const span=box.querySelector('span');
    if(span)span.textContent=`The selected voice is ${voiceLanguage}. Switch to a voice that matches your script language. Alternatively rewrite the script language for the selected voice.`;
  };
  new MutationObserver(rewrite).observe(box,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  rewrite();
})();
