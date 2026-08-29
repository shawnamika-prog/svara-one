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
      const id = String(voice.voice_id || voice.providerVoiceId || '');
      const meta = voice.metadata || {};
      const language = String(meta.language || meta.languages?.[0] || voice.languageName || 'English');
      const accent = String(meta.accent || meta.region || voice.accent || voice.region || 'Global');
      const characteristics = Array.isArray(meta.characteristics) ? meta.characteristics : (Array.isArray(voice.characteristics) ? voice.characteristics : []);
      const useCases = Array.isArray(meta.use_cases)
        ? meta.use_cases
        : Array.isArray(meta.useCases)
          ? meta.useCases
          : Array.isArray(voice.useCases)
            ? voice.useCases
            : [];
      const gender = String(meta.gender || voice.gender || characteristics.find(x => /male|female|masculine|feminine/i.test(String(x))) || 'Voice');
      const style = String(voice.style || 'Natural');
      return {
        id: voice.id ? String(voice.id) : `deepgram-${id || index}`,
        name: String(voice.name || id.replace(/^aura-2-/, '').replace(/-en$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
        region: accent,
        category: String(voice.category || language.match(/[a-z]{2}$/i)?.[0] || 'en').toLowerCase(),
        style,
        gender,
        age: String(meta.age || voice.age || ''),
        provider: String(voice.provider || 'deepgram'),
        providerVoiceId: id,
        sampleUrl: String(voice.sampleUrl || ''),
        sampleStatus: String(voice.sampleStatus || 'missing'),
        languageName: String(voice.languageName || (language.length === 2 ? ({en:'English',es:'Spanish',de:'German',fr:'French',nl:'Dutch',it:'Italian',ja:'Japanese'}[language] || language.toUpperCase()) : language)),
        characteristics,
        useCases,
        metadata: meta
      };
    }).filter(v => v.providerVoiceId && (access.fullCatalogue === true || allowed.has(v.providerVoiceId)));

    window.dispatchEvent(new CustomEvent('svara:voices-updated'));
  } catch (error) {
    console.warn('Svara voice catalogue unavailable; keeping the safe fallback.', error);
  }
})();
