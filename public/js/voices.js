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

  async function loadCardMetadata() {
    try {
      const response = await fetch('/api/voices', { headers: { accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const catalogue = Array.isArray(data.voices) ? data.voices : [];
      const byId = new Map();
      catalogue.forEach(voice => {
        if (voice.id) byId.set(String(voice.id), voice);
        if (voice.svara_id) byId.set(String(voice.svara_id), voice);
        if (voice.voice_id) byId.set(String(voice.voice_id), voice);
        if (voice.providerVoiceId) byId.set(String(voice.providerVoiceId), voice);
      });

      const decorateCards = () => {
        document.querySelectorAll('#voiceList .voice[data-id]').forEach(card => {
          if (card.dataset.metaRendered === '1') return;
          const voice = byId.get(String(card.dataset.id));
          if (!voice) return;
          const meta = voice.metadata || {};
          const intelligence = voice.voiceIntelligence?.providerMetadata || {};
          const characteristics = (Array.isArray(meta.characteristics) ? meta.characteristics : Array.isArray(intelligence.characteristics) ? intelligence.characteristics : voice.characteristics || [])
            .map(String).map(x => x.trim()).filter(Boolean).filter(x => !isGender(x));
          const useCases = (Array.isArray(meta.use_cases) ? meta.use_cases : Array.isArray(meta.useCases) ? meta.useCases : Array.isArray(intelligence.useCases) ? intelligence.useCases : [])
            .map(String).map(x => x.trim()).filter(Boolean);
          const age = String(meta.age || voice.age || intelligence.age || '').trim();
          const accent = String(meta.accent || voice.accent || '').trim();
          const language = String(meta.language || voice.languageName || intelligence.language || '').trim();
          const gender = String(voice.gender || intelligence.gender || '').trim();

          const identity = [accent, language, gender, age].filter(Boolean).join(' · ');
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
          card.dataset.metaRendered = '1';
        });
      };

      const list = document.getElementById('voiceList');
      if (!list) return;
      const observer = new MutationObserver(decorateCards);
      observer.observe(list, { childList: true, subtree: true });
      decorateCards();
    } catch (error) {
      console.warn('Voice card metadata unavailable.', error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadCardMetadata, { once: true });
  else loadCardMetadata();
})();
