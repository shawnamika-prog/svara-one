/*
 * Svara Origins Voice Catalogue
 *
 * Public voice metadata used by Studio for search, filtering and selection.
 * Provider/model mappings stay in the Cloudflare Worker.
 *
 * Add production voices here later without changing Studio's UI logic.
 */
const SVARA_VOICES = [
  {
    id: "TEST-VOICE-01",
    name: "Test Voice 01",
    location: "Development",
    language: "English",
    gender: "Female",
    style: "Commercial",
    tags: ["commercial", "warm", "natural"],
    initial: "1",
    status: "development"
  },
  {
    id: "TEST-VOICE-02",
    name: "Test Voice 02",
    location: "Development",
    language: "English",
    gender: "Female",
    style: "Corporate",
    tags: ["corporate", "clear", "professional"],
    initial: "2",
    status: "development"
  },
  {
    id: "TEST-VOICE-03",
    name: "Test Voice 03",
    location: "Development",
    language: "English",
    gender: "Female",
    style: "Storytelling",
    tags: ["narrative", "storytelling", "calm"],
    initial: "3",
    status: "development"
  }
];
