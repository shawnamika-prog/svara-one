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
        providerVoiceId: id
      };
    }).filter(v => v.providerVoiceId && (access.fullCatalogue === true || allowed.has(v.providerVoiceId)));

    window.dispatchEvent(new CustomEvent('svara:voices-updated'));
  } catch (error) {
    console.warn('Svara voice catalogue unavailable; keeping the safe fallback.', error);
  }
})();
