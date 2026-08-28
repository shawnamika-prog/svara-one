window.SVARA_VOICES = [
 {id:"svara-amara-01",name:"Amara",region:"American English",category:"global",style:"Conversational",gender:"Female",provider:"deepgram",providerVoiceId:"aura-2-thalia-en"},
 {id:"svara-james-01",name:"James",region:"British English",category:"global",style:"Professional",gender:"Male",provider:"deepgram",providerVoiceId:"aura-2-orion-en"}
];

(async () => {
  try {
    const [catalogueResponse, accessResponse] = await Promise.all([
      fetch('/api/voices', { cache: 'no-store' }),
      fetch('/api/voice-access', { cache: 'no-store', credentials: 'same-origin' })
    ]);
    if (!catalogueResponse.ok) throw new Error(`Catalogue ${catalogueResponse.status}`);
    if (!accessResponse.ok) throw new Error(`Voice access ${accessResponse.status}`);

    const data = await catalogueResponse.json();
    const access = await accessResponse.json();
    const catalogue = Array.isArray(data.voices) ? data.voices : [];
    const allowed = new Set(Array.isArray(access.voiceIds) ? access.voiceIds.map(String) : []);

    if (!catalogue.length) return;

    window.SVARA_VOICES = catalogue.map((voice, index) => {
      const id = String(voice.voice_id || '');
      const meta = voice.metadata || {};
      const language = String(meta.language || meta.languages?.[0] || 'English');
      const accent = String(meta.accent || meta.region || 'Global');
      const characteristics = Array.isArray(meta.characteristics) ? meta.characteristics : [];
      const gender = String(meta.gender || characteristics.find(x => /male|female|masculine|feminine/i.test(String(x))) || 'Voice');
      const style = characteristics.filter(x => !/male|female|masculine|feminine/i.test(String(x))).slice(0,2).join(' · ') || 'Natural';
      return {
        id: `deepgram-${id || index}`,
        name: id.replace(/^aura-2-/, '').replace(/-en$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        region: `${accent} · ${language}`,
        category: /south africa|south african/i.test(`${accent} ${language}`) ? 'south-africa' : 'global',
        style,
        gender,
        provider: 'deepgram',
        providerVoiceId: id,
        characteristics,
        metadata: meta
      };
    }).filter(v => v.providerVoiceId && (access.fullCatalogue === true || allowed.has(v.providerVoiceId)));

    window.dispatchEvent(new CustomEvent('svara:voices-updated'));
  } catch (error) {
    console.warn('Svara voice catalogue unavailable; keeping the safe fallback.', error);
  }
})();

/* Voice-card metadata presentation: expose useful provider metadata without recommendation scoring. */
(() => {
  const escapeHtml = value => String(value ?? '').replace(/[&<>'\"]/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '\"':'&quot;'
  }[char]));
  const isGender = value => /^(male|female|masculine|feminine)$/i.test(String(value || '').trim());
  const titleCase = value => String(value || '').replace(/\b\w/g, c => c.toUpperCase());

  function decorateCards() {
    const catalogue = Array.isArray(window.SVARA_VOICES) ? window.SVARA_VOICES : [];
    if (!catalogue.length) return;
    const byId = new Map(catalogue.map(voice => [String(voice.id), voice]));

    document.querySelectorAll('#voiceList .voice[data-id]').forEach(card => {
      const voice = byId.get(String(card.dataset.id));
      if (!voice) return;
      const meta = voice.metadata || {};
      const characteristics = (Array.isArray(meta.characteristics) ? meta.characteristics : voice.characteristics || [])
        .map(String).map(x => x.trim()).filter(Boolean).filter(x => !isGender(x));
      const useCases = (Array.isArray(meta.use_cases) ? meta.use_cases : Array.isArray(meta.useCases) ? meta.useCases : [])
        .map(String).map(x => x.trim()).filter(Boolean);
      const age = String(meta.age || voice.age || '').trim();
      const accent = String(meta.accent || '').trim();
      const language = String(meta.language || voice.languageName || '').trim();
      const gender = String(voice.gender || '').trim();

      const identity = [accent || String(voice.region || '').split(' · ')[0], language || voice.languageName, gender, age]
        .filter(Boolean).join(' · ');
      const character = characteristics.slice(0, 4).join(' · ');
      const useCase = useCases.slice(0, 4).map(titleCase).join(' · ');

      const target = card.querySelector('.voice-card-meta');
      if (!target) return;
      target.innerHTML = `
        <div class="voice-meta-identity">${escapeHtml(identity)}</div>
        ${character ? `<div class="voice-meta-character">${escapeHtml(character)}</div>` : ''}
        ${useCase ? `<div class="voice-meta-usecase"><span>USE CASES</span> ${escapeHtml(useCase)}</div>` : ''}
      `;
      target.title = [identity, character, useCase].filter(Boolean).join(' · ');
    });
  }

  const start = () => {
    const list = document.getElementById('voiceList');
    if (!list) return;
    const observer = new MutationObserver(decorateCards);
    observer.observe(list, { childList: true, subtree: true });
    decorateCards();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  window.addEventListener('svara:voices-updated', decorateCards);
})();
