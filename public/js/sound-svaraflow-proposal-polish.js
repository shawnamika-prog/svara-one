(()=>{
  if(window.SvaraSoundProposalPolish)return;
  window.SvaraSoundProposalPolish=true;

  const text=value=>String(value??'');
  const escapeHtml=value=>text(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  const bold=value=>escapeHtml(value).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');

  function renderProposal(bubble,source){
    if(!bubble||bubble.dataset.sfProposalPolished==='1')return;
    if(!/several distinct directions/i.test(source)||!/^\s*\d+\.\s+\*\*/m.test(source))return;

    const lines=text(source).split(/\r?\n/);
    const directions=[];
    const preface=[];
    let current=null;

    const flush=()=>{
      if(!current)return;
      current.body=current.body.trim().replace(/\s+/g,' ');
      directions.push(current);
      current=null;
    };

    for(const rawLine of lines){
      const line=rawLine.trim();
      const match=line.match(/^\s*(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/);
      if(match){
        flush();
        current={number:match[1],title:match[2].trim(),body:match[3].trim()};
        continue;
      }
      if(current){
        if(line)current.body+=(current.body?' ':'')+line;
      }else if(line){
        preface.push(line);
      }
    }
    flush();

    if(!directions.length)return;

    const prefaceHtml=[];
    let paragraph=[];
    const flushParagraph=()=>{
      if(!paragraph.length)return;
      prefaceHtml.push(`<p>${bold(paragraph.join(' '))}</p>`);
      paragraph=[];
    };
    for(const line of preface){
      if(/here are several distinct directions:?/i.test(line)){
        flushParagraph();
        prefaceHtml.push(`<p class="sound-sf-proposal-lead">${bold(line)}</p>`);
      }else{
        paragraph.push(line);
      }
    }
    flushParagraph();

    const directionHtml=directions.map(item=>{
      const title=escapeHtml(item.title);
      const body=item.body?`<div class="sound-sf-direction-copy">${bold(item.body)}</div>`:'';
      return `<div class="sound-sf-direction"><span class="sound-sf-direction-index">${escapeHtml(item.number)}</span><div class="sound-sf-direction-content"><div class="sound-sf-direction-title">${title}</div>${body}</div></div>`;
    }).join('');

    bubble.classList.add('sound-sf-proposal-message');
    bubble.innerHTML=`<div class="sound-sf-proposal-content">${prefaceHtml.join('')}<div class="sound-sf-direction-list">${directionHtml}</div></div>`;
    bubble.dataset.sfProposalPolished='1';
  }

  function injectStyle(){
    if(document.getElementById('sound-svaraflow-proposal-polish'))return;
    const style=document.createElement('style');
    style.id='sound-svaraflow-proposal-polish';
    style.textContent=`
      #soundWorkspace .sound-sf-message.assistant.sound-sf-proposal-message{max-width:720px!important;background:linear-gradient(180deg,#0d1928,#0a1523)!important;border:1px solid #ffffff0d!important;border-radius:18px!important;box-shadow:0 12px 30px #0002!important;padding:17px 20px!important;line-height:1.62!important}
      #soundWorkspace .sound-sf-proposal-content>p{margin:0 0 12px!important;color:#aebdcc!important;font-size:14px!important;line-height:1.62!important}
      #soundWorkspace .sound-sf-proposal-content>p.sound-sf-proposal-lead{margin-top:2px!important;margin-bottom:2px!important;color:#dbe5ee!important;font-weight:500!important}
      #soundWorkspace .sound-sf-direction-list{margin-top:4px!important}
      #soundWorkspace .sound-sf-direction{display:grid!important;grid-template-columns:28px minmax(0,1fr)!important;gap:11px!important;padding:13px 0!important;border-top:1px solid #ffffff0d!important}
      #soundWorkspace .sound-sf-direction:first-child{border-top:0!important;padding-top:9px!important}
      #soundWorkspace .sound-sf-direction-index{width:28px!important;height:28px!important;border-radius:9px!important;display:grid!important;place-items:center!important;background:#111d2e!important;border:1px solid #8b5cff30!important;color:#c39aff!important;font-size:11px!important;font-weight:700!important;line-height:1!important}
      #soundWorkspace .sound-sf-direction-content{min-width:0!important}
      #soundWorkspace .sound-sf-direction-title{color:#eef6ff!important;font-size:14px!important;font-weight:700!important;line-height:1.5!important}
      #soundWorkspace .sound-sf-direction-copy{margin-top:3px!important;color:#aab9c8!important;font-size:13px!important;line-height:1.62!important}
      #soundWorkspace .sound-sf-direction-content strong{color:#eef6ff!important;font-weight:600!important}
      @media(max-width:700px){#soundWorkspace .sound-sf-message.assistant.sound-sf-proposal-message{max-width:100%!important;padding:15px 16px!important}#soundWorkspace .sound-sf-proposal-content>p{font-size:13px!important}#soundWorkspace .sound-sf-direction-title{font-size:13px!important}#soundWorkspace .sound-sf-direction-copy{font-size:12px!important}}
    `;
    document.head.appendChild(style);
  }

  function scan(root=document){
    if(root.nodeType===1&&root.matches?.('.sound-sf-message.assistant'))renderProposal(root,root.textContent||'');
    root.querySelectorAll?.('.sound-sf-message.assistant').forEach(node=>renderProposal(node,node.textContent||''));
  }

  injectStyle();
  scan();
  new MutationObserver(mutations=>mutations.forEach(mutation=>mutation.addedNodes.forEach(node=>scan(node)))).observe(document.documentElement,{childList:true,subtree:true});
})();
