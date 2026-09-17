(()=>{
  if(window.SvaraSoundProposalPolish)return;
  window.SvaraSoundProposalPolish=true;

  const text=value=>String(value??'').replace(/\u00a0/g,' ');
  const escapeHtml=value=>text(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  const inline=value=>escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/__([^_]+?)__/g,'<strong>$1</strong>');
  const normalizeVoiceIntro=value=>text(value).replace(/SvaraFlow has mapped the current creative direction here:/gi,'I have mapped the current creative direction here:');

  function proposalShape(source){
    const lines=text(source).split(/\r?\n/);
    const directions=[];
    const preface=[];
    const postface=[];
    let current=null;
    let afterDirections=false;

    const flush=()=>{
      if(!current)return;
      current.body=current.body.trim().replace(/\s+/g,' ');
      directions.push(current);
      current=null;
    };

    for(const rawLine of lines){
      const line=rawLine.trim();
      const match=line.match(/^\s*(\d+)[.)]\s+\*\*(.+?)\*\*\s*:?\s*(.*)$/);
      if(match){
        flush();
        afterDirections=false;
        current={number:match[1],title:match[2].trim(),body:match[3].trim()};
        continue;
      }
      if(!line){
        if(current){
          flush();
          afterDirections=true;
        }
        continue;
      }
      if(current&&!afterDirections){
        current.body+=(current.body?' ':'')+line;
      }else if(afterDirections){
        postface.push(line);
      }else{
        preface.push(line);
      }
    }
    flush();

    if(directions.length<2)return null;
    if(!/\bdirections\b/i.test(text(source)))return null;
    return {directions,preface,postface};
  }

  function renderProposal(bubble,source){
    if(!bubble||bubble.dataset.sfProposalPolished==='1')return;
    const shape=proposalShape(normalizeVoiceIntro(source));
    if(!shape)return;

    const prefaceHtml=shape.preface.map(line=>`<p>${inline(line)}</p>`).join('');
    const directionHtml=shape.directions.map(item=>{
      const recommended=/\s[—-]\s*recommended\s*:?\s*$/i.test(item.title);
      const title=item.title.replace(/\s[—-]\s*recommended\s*:?\s*$/i,'').trim();
      const badge=recommended?'<span class="sound-sf-direction-badge">RECOMMENDED</span>':'';
      const body=item.body?`<div class="sound-sf-direction-copy">${inline(item.body)}</div>`:'';
      return `<article class="sound-sf-direction"><div class="sound-sf-direction-index">${escapeHtml(item.number)}</div><div class="sound-sf-direction-content"><div class="sound-sf-direction-title"><span>${escapeHtml(title)}</span>${badge}</div>${body}</div></article>`;
    }).join('');
    const postfaceHtml=shape.postface.length?`<div class="sound-sf-proposal-postface">${shape.postface.map(line=>`<p>${inline(line)}</p>`).join('')}</div>`:'';

    bubble.classList.add('sound-sf-proposal-message');
    bubble.innerHTML=`<div class="sound-sf-proposal-content">${prefaceHtml}<div class="sound-sf-direction-list">${directionHtml}</div>${postfaceHtml}</div>`;
    bubble.dataset.sfProposalPolished='1';
  }

  function renderMarkdown(bubble,source){
    if(!bubble||bubble.dataset.sfProposalPolished==='1'||bubble.dataset.sfMarkdownPolished==='1')return;
    if(!/\*\*(.+?)\*\*/.test(source)&&!/__([^_]+?)__/.test(source))return;
    bubble.classList.add('sound-sf-markdown-message');
    bubble.innerHTML=inline(source).replace(/\r?\n/g,'<br>');
    bubble.dataset.sfMarkdownPolished='1';
  }

  function injectStyle(){
    if(document.getElementById('sound-svaraflow-proposal-polish'))return;
    const style=document.createElement('style');
    style.id='sound-svaraflow-proposal-polish';
    style.textContent=`
      #soundWorkspace .sound-sf-thread{height:540px!important;max-height:64vh!important}
      #soundWorkspace .sound-sf-message.assistant.sound-sf-proposal-message{max-width:720px!important;background:linear-gradient(180deg,#0d1928,#0a1523)!important;border:1px solid #ffffff0d!important;border-radius:18px!important;box-shadow:0 12px 30px #0002!important;padding:17px 20px!important;line-height:1.62!important}
      #soundWorkspace .sound-sf-proposal-content>p{margin:0 0 12px!important;color:#aebdcc!important;font-size:14px!important;line-height:1.62!important}
      #soundWorkspace .sound-sf-direction-list{margin-top:4px!important}
      #soundWorkspace .sound-sf-direction{display:grid!important;grid-template-columns:28px minmax(0,1fr)!important;gap:11px!important;padding:13px 0!important;border-top:1px solid #ffffff0d!important}
      #soundWorkspace .sound-sf-direction:first-child{border-top:0!important;padding-top:9px!important}
      #soundWorkspace .sound-sf-direction-index{width:28px!important;height:28px!important;border-radius:9px!important;display:grid!important;place-items:center!important;background:#111d2e!important;border:1px solid #8b5cff30!important;color:#c39aff!important;font-size:11px!important;font-weight:700!important;line-height:1!important}
      #soundWorkspace .sound-sf-direction-content{min-width:0!important}
      #soundWorkspace .sound-sf-direction-title{display:flex!important;align-items:center!important;gap:9px!important;flex-wrap:wrap!important;color:#eef6ff!important;font-size:14px!important;font-weight:700!important;line-height:1.5!important}
      #soundWorkspace .sound-sf-direction-title>span:first-child{min-width:0!important}
      #soundWorkspace .sound-sf-direction-copy{margin-top:4px!important;color:#aab9c8!important;font-size:12px!important;line-height:1.62!important}
      #soundWorkspace .sound-sf-direction-content strong{color:#eef6ff!important;font-weight:600!important}
      #soundWorkspace .sound-sf-direction-badge{display:inline-flex!important;align-items:center!important;padding:4px 7px!important;border-radius:999px!important;background:#8b5cff16!important;border:1px solid #8b5cff35!important;color:#caa9ff!important;font-size:8px!important;letter-spacing:.12em!important;font-weight:800!important;white-space:nowrap!important}
      #soundWorkspace .sound-sf-proposal-postface{margin-top:11px!important;padding-top:11px!important;border-top:1px solid #ffffff0d!important}
      #soundWorkspace .sound-sf-proposal-postface p{margin:0 0 7px!important;color:#9cadbd!important;font-size:12px!important;line-height:1.58!important}
      #soundWorkspace .sound-sf-markdown-message{white-space:pre-wrap!important}
      @media(max-width:760px){#soundWorkspace .sound-sf-thread{height:330px!important;max-height:52vh!important}#soundWorkspace .sound-sf-message.assistant.sound-sf-proposal-message{max-width:100%!important;padding:15px 16px!important}#soundWorkspace .sound-sf-proposal-content>p{font-size:13px!important}#soundWorkspace .sound-sf-direction-title{font-size:13px!important}#soundWorkspace .sound-sf-direction-copy{font-size:12px!important}}
      @media(max-width:560px){#soundWorkspace .sound-sf-thread{height:300px!important;max-height:52vh!important}}
    `;
    document.head.appendChild(style);
  }

  function scan(root=document){
    const nodes=[];
    if(root.nodeType===1&&root.matches?.('.sound-sf-message.assistant'))nodes.push(root);
    root.querySelectorAll?.('.sound-sf-message.assistant').forEach(node=>nodes.push(node));
    nodes.forEach(node=>{
      const source=node.textContent||'';
      const normalized=normalizeVoiceIntro(source);
      renderProposal(node,normalized);
      renderMarkdown(node,normalized);
    });
  }

  injectStyle();
  scan();
  new MutationObserver(mutations=>mutations.forEach(mutation=>mutation.addedNodes.forEach(node=>scan(node)))).observe(document.documentElement,{childList:true,subtree:true});
})();
