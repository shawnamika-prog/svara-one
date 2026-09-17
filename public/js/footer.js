(()=>{
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const isStudio = path.endsWith('/studio') || path.endsWith('/studio.html');
  const isAccount = path.endsWith('/account.html');
  const isCompany = path.endsWith('/company.html');

  const footer = document.createElement('footer');
  footer.className = isStudio || isAccount ? 'svara-footer svara-footer-app' : 'svara-footer';

  if (isStudio) {
    const stateScript = document.createElement('script');
    stateScript.src = 'js/sound-studio-state.js';
    stateScript.defer = false;
    document.head.appendChild(stateScript);

    const playerStyle = document.createElement('link');
    playerStyle.rel = 'stylesheet';
    playerStyle.href = 'css/sound-output-player.css';
    document.head.appendChild(playerStyle);

    const playerScript = document.createElement('script');
    playerScript.src = 'js/sound-output-player.js';
    playerScript.defer = false;
    document.head.appendChild(playerScript);

    const voiceInputScript = document.createElement('script');
    voiceInputScript.src = 'js/sound-voice-input.js';
    voiceInputScript.defer = false;
    document.head.appendChild(voiceInputScript);

    const existingVoicePickerScript = document.createElement('script');
    existingVoicePickerScript.src = 'js/sound-existing-voice-picker.js';
    existingVoicePickerScript.defer = false;
    document.head.appendChild(existingVoicePickerScript);

    const existingVoicePickerVisibilityScript = document.createElement('script');
    existingVoicePickerVisibilityScript.src = 'js/sound-existing-voice-picker-visibility.js';
    existingVoicePickerVisibilityScript.defer = false;
    document.head.appendChild(existingVoicePickerVisibilityScript);

    const soundSvaraFlowScript = document.createElement('script');
    soundSvaraFlowScript.src = 'js/sound-svaraflow-ui-v3.js';
    soundSvaraFlowScript.defer = false;
    document.head.appendChild(soundSvaraFlowScript);

    const soundSvaraFlowModeScript = document.createElement('script');
    soundSvaraFlowModeScript.src = 'js/sound-svaraflow-ui-v4.js';
    soundSvaraFlowModeScript.defer = false;
    document.head.appendChild(soundSvaraFlowModeScript);

    const soundSvaraFlowApprovalScript = document.createElement('script');
    soundSvaraFlowApprovalScript.src = 'js/sound-svaraflow-ui-v5.js';
    soundSvaraFlowApprovalScript.defer = false;
    document.head.appendChild(soundSvaraFlowApprovalScript);

    const soundSvaraFlowVoiceContextScript = document.createElement('script');
    soundSvaraFlowVoiceContextScript.src = 'js/sound-svaraflow-voice-context.js';
    soundSvaraFlowVoiceContextScript.defer = false;
    document.head.appendChild(soundSvaraFlowVoiceContextScript);

    const soundLegacyUiLock = document.createElement('style');
    soundLegacyUiLock.id = 'sound-legacy-ui-lock';
    soundLegacyUiLock.textContent = '#soundWorkspace .sound-generate,#soundWorkspace .sound-generation-note,#soundWorkspace #soundInspire,#soundWorkspace #soundFlowBadge{display:none!important;}';
    document.head.appendChild(soundLegacyUiLock);

    const soundVisualPatch = document.createElement('style');
    soundVisualPatch.id = 'svara-sound-visual-patch';
    soundVisualPatch.textContent = `
      #soundWorkspace .sound-sf-brand{font-size:13px!important;gap:0!important;letter-spacing:0!important;}
      #soundWorkspace .sound-sf-brand .sound-sf-orb{margin-right:9px!important;}
      #soundWorkspace .sound-sf-brand .sf-name{display:inline-block!important;font-size:13px!important;line-height:1.05!important;letter-spacing:0!important;font-weight:800!important;white-space:nowrap!important;}
      #soundWorkspace .sound-sf-brand .sf-tm{font-size:7px!important;line-height:1!important;vertical-align:super!important;position:static!important;margin-left:1px!important;letter-spacing:0!important;display:inline!important;font-weight:700!important;white-space:nowrap!important;}
      #soundWorkspace .sound-sf-spec-title .sf-tm{font-size:7px!important;line-height:1!important;vertical-align:super!important;position:static!important;margin-left:1px!important;letter-spacing:0!important;display:inline!important;font-weight:700!important;}
      aside a.active[href="#sound"]{background:linear-gradient(100deg,#2a1640,#21142f)!important;color:#c478ff!important;box-shadow:inset 0 0 0 1px #a85cff77!important}
      aside a.active[href="#sound"] svg{color:#c478ff!important;stroke:#c478ff!important}
    `;
    document.head.appendChild(soundVisualPatch);

    document.addEventListener('click', event => {
      const link = event.target.closest('aside a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (href === '#sound') return;
      const audio = document.querySelectorAll('audio[aria-hidden="true"][preload="metadata"]');
      audio.forEach(player => { if (!player.paused) player.pause(); });
    }, true);
  }

  if (isStudio || isAccount) {
    footer.innerHTML = `
      <div class="svara-footer-inner">
        <span>© <span data-footer-year></span> SVARA ONE (Pty) Ltd</span>
        <nav aria-label="Footer">
          <a href="/">Home</a>
          <a href="/studio">Studio</a>
          <span class="svara-footer-separator" aria-hidden="true">·</span>
          <a href="/company.html">Company</a>
          <span class="svara-footer-muted">· Support · Legal</span>
        </nav>
      </div>`;
  } else {
    footer.innerHTML = `
      <div class="svara-footer-main">
        <div class="svara-footer-brand">
          <strong>Svara<span>ONE</span></strong>
          <p>Engineered Intelligence.<br>Human Orchestration.</p>
        </div>
        <div class="svara-footer-links">
          <div><h3>PRODUCT</h3><a href="/studio">Voice Studio</a><a href="/#svaraflow">SvaraFlow™</a><a href="/#workflow">How it works</a><a href="/#pricing">Pricing</a></div>
          <div><h3>ACCOUNT</h3><a href="/login.html">Sign in</a><a href="/signup.html">Get started</a></div>
          <div><h3>COMPANY</h3><a href="/company.html#about">About SvaraONE</a><a href="/company.html#vision">Vision</a><a href="/company.html#mission">Mission</a></div>
          <div><h3>SUPPORT &amp; LEGAL</h3><a href="/help.html">Help Centre</a><span>Contact Support</span><span>Terms of Use</span><span>Privacy Policy</span></div>
        </div>
      </div>
      <div class="svara-footer-bottom">
        <span>© <span data-footer-year></span> Svara ONE (Pty) Ltd. All rights reserved.</span>
      </div>`;
  }

  footer.querySelector('[data-footer-year]').textContent = new Date().getFullYear();
  document.body.appendChild(footer);
})();
