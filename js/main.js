const demo=document.getElementById('demoScript'), chars=document.getElementById('demoChars');
if(demo) demo.addEventListener('input',()=>chars.textContent=`${demo.value.length} / 250`);
document.querySelectorAll('#heroPlay').forEach(b=>b.addEventListener('click',()=>{b.textContent=b.textContent==='▶'?'Ⅱ':'▶';document.querySelector('.bar span').style.width=b.textContent==='Ⅱ'?'62%':'0%';}));
