const generateButton = document.querySelector(".generate");
const waveform = document.getElementById("waveform");
const audioStatus = document.getElementById("audioStatus");
const audioEmpty = document.getElementById("audioEmpty");
const audioMessage = document.getElementById("audioMessage");
const playButton = document.getElementById("playButton");
const playerProgress = document.querySelector(".player-progress");
const audioCurrentTime = document.getElementById("audioCurrentTime");
const audioDuration = document.getElementById("audioDuration");
const scriptInput = document.getElementById("scriptInput");
const characterCount = document.getElementById("characterCount");
const durationEstimate = document.getElementById("durationEstimate");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
const stabilitySlider = document.getElementById("stabilitySlider");
const stabilityValue = document.getElementById("stabilityValue");
const styleSelect = document.getElementById("styleSelect");
const voiceName = document.getElementById("voiceName");
const voiceDetails = document.getElementById("voiceDetails");
const voiceAvatar = document.getElementById("voiceAvatar");
const voiceGender = document.getElementById("voiceGender");
const voiceStyle = document.getElementById("voiceStyle");
const selectedVoiceSummary = document.getElementById("selectedVoiceSummary");
const voiceSearch = document.getElementById("voiceSearch");
const voiceResults = document.getElementById("voiceResults");
const voiceFilters = document.getElementById("voiceFilters");
const settingsToggle = document.getElementById("settingsToggle");
const settingsPanel = document.getElementById("settingsPanel");
const settingsSummary = document.getElementById("settingsSummary");
const clearScript = document.getElementById("clearScript");
const downloadMp3 = document.getElementById("downloadMp3");
const downloadWav = document.getElementById("downloadWav");

let currentAudio = null;
let currentAudioUrl = null;
let currentAudioBlob = null;
let currentWavBlob = null;
let currentWavUrl = null;
let playing = false;
let selectedVoiceId = "TEST-VOICE-01";
let activeFilter = "all";
let previewAudio = null;
let previewVoiceId = null;

const voices = [
  {
    id: "TEST-VOICE-01",
    name: "Test Voice 01",
    location: "Development",
    language: "English",
    gender: "Female",
    style: "Commercial",
    tags: ["commercial", "warm", "natural"],
    initial: "1"
  },
  {
    id: "TEST-VOICE-02",
    name: "Test Voice 02",
    location: "Development",
    language: "English",
    gender: "Female",
    style: "Corporate",
    tags: ["corporate", "clear", "professional"],
    initial: "2"
  },
  {
    id: "TEST-VOICE-03",
    name: "Test Voice 03",
    location: "Development",
    language: "English",
    gender: "Female",
    style: "Storytelling",
    tags: ["narrative", "storytelling", "calm"],
    initial: "3"
  }
];

const previewText = "Hello. This is a Svara Origins voice preview.";

function getSelectedVoice() {
  return voices.find(voice => voice.id === selectedVoiceId) || voices[0];
}

function setStatus(label, mode = "ready") {
  audioStatus.textContent = label;
  if (mode === "generating") {
    audioStatus.style.color = "#ffd166";
    audioStatus.style.borderColor = "#ffd16633";
    audioStatus.style.background = "#ffd16612";
  } else if (mode === "error") {
    audioStatus.style.color = "#ff7b7b";
    audioStatus.style.borderColor = "#ff7b7b33";
    audioStatus.style.background = "#ff7b7b12";
  } else {
    audioStatus.style.color = "#16d89a";
    audioStatus.style.borderColor = "#16d89a25";
    audioStatus.style.background = "#16d89a12";
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function stopPreviewAudio() {
  if (previewAudio) {
    previewAudio.pause();
    previewAudio.currentTime = 0;
  }
  previewAudio = null;
  previewVoiceId = null;
  document.querySelectorAll(".preview-button.playing").forEach(button => {
    button.classList.remove("playing");
    button.textContent = "▶";
  });
}

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
  if (currentWavUrl) URL.revokeObjectURL(currentWavUrl);
  currentAudio = null;
  currentAudioUrl = null;
  currentAudioBlob = null;
  currentWavBlob = null;
  currentWavUrl = null;
  downloadMp3.disabled = true;
  downloadWav.disabled = true;
  playButton.disabled = true;
  playing = false;
  playButton.textContent = "▶";
  playerProgress.style.width = "0%";
  audioCurrentTime.textContent = "00:00";
  audioDuration.textContent = "00:00";
}

function resetAudioPreview() {
  stopCurrentAudio();
  waveform.classList.remove("generating", "generated");
  setStatus("READY");
  audioEmpty.querySelector("strong").textContent = "No audio generated yet.";
  audioMessage.textContent = "Your generated voice will appear here.";
}

function updateVoiceDetails() {
  const voice = getSelectedVoice();
  voiceName.textContent = voice.name;
  voiceDetails.textContent = `${voice.location} · ${voice.language}`;
  voiceAvatar.textContent = voice.initial;
  voiceGender.textContent = voice.gender;
  voiceStyle.textContent = styleSelect.value;
  selectedVoiceSummary.textContent = `${voice.name} · ${voice.location}`;
}

function matchesFilter(voice) {
  if (activeFilter === "all") return true;
  if (activeFilter === "female") return voice.gender.toLowerCase() === "female";
  return voice.tags.includes(activeFilter) || voice.style.toLowerCase() === activeFilter;
}

function renderVoiceResults() {
  const query = voiceSearch.value.trim().toLowerCase();
  const filtered = voices.filter(voice => {
    const haystack = [voice.name, voice.location, voice.language, voice.gender, voice.style, ...voice.tags].join(" ").toLowerCase();
    return matchesFilter(voice) && (!query || haystack.includes(query));
  });

  voiceResults.innerHTML = "";

  if (!filtered.length) {
    voiceResults.innerHTML = '<div class="no-results">No development voices match that search.</div>';
    return;
  }

  filtered.forEach(voice => {
    const card = document.createElement("div");
    card.className = `voice-result${voice.id === selectedVoiceId ? " selected" : ""}`;
    card.dataset.voiceId = voice.id;
    card.innerHTML = `
      <div class="voice-result-avatar">${voice.initial}</div>
      <div class="voice-result-copy">
        <strong>${voice.name}</strong>
        <span>${voice.location} · ${voice.language} · ${voice.style}</span>
      </div>
      <div class="voice-result-tags">
        <button class="preview-button" type="button" data-preview="${voice.id}" aria-label="Preview ${voice.name}">▶</button>
        <span class="select-check">${voice.id === selectedVoiceId ? "✓" : ""}</span>
      </div>`;

    card.addEventListener("click", event => {
      if (event.target.closest("[data-preview]")) return;
      selectVoice(voice.id);
    });
    voiceResults.appendChild(card);
  });
}

function selectVoice(id) {
  if (!voices.some(voice => voice.id === id)) return;
  stopPreviewAudio();
  selectedVoiceId = id;
  updateVoiceDetails();
  resetAudioPreview();
  renderVoiceResults();
}

async function previewVoice(id, button) {
  if (previewVoiceId === id && previewAudio) {
    stopPreviewAudio();
    return;
  }

  stopPreviewAudio();
  button.classList.add("playing");
  button.textContent = "Ⅱ";
  previewVoiceId = id;

  try {
    const response = await fetch("/api/voice/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voiceId: id,
        text: previewText,
        speed: 1,
        stability: 70,
        format: "mp3"
      })
    });
    if (!response.ok) throw new Error("Preview unavailable.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    previewAudio = new Audio(url);
    previewAudio.onended = () => {
      URL.revokeObjectURL(url);
      stopPreviewAudio();
    };
    await previewAudio.play();
  } catch (error) {
    stopPreviewAudio();
    setStatus("PREVIEW ERROR", "error");
    audioMessage.textContent = error.message || "Preview could not be generated.";
  }
}

voiceResults.addEventListener("click", event => {
  const button = event.target.closest("[data-preview]");
  if (!button) return;
  previewVoice(button.dataset.preview, button);
});

voiceSearch.addEventListener("input", renderVoiceResults);
voiceFilters.addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  voiceFilters.querySelectorAll(".filter-chip").forEach(chip => chip.classList.toggle("active", chip === button));
  renderVoiceResults();
});

async function generateVoice() {
  const text = scriptInput.value.trim();
  if (!text) {
    scriptInput.focus();
    return;
  }
  if (text.length > 2000) {
    setStatus("LIMIT", "error");
    audioEmpty.querySelector("strong").textContent = "Development limit reached.";
    audioMessage.textContent = "Test generation is limited to 2,000 characters per request.";
    return;
  }

  stopCurrentAudio();
  generateButton.textContent = "Generating...";
  generateButton.style.opacity = "0.7";
  generateButton.disabled = true;
  waveform.classList.remove("generated");
  waveform.classList.add("generating");
  setStatus("GENERATING", "generating");
  audioEmpty.querySelector("strong").textContent = "Creating your voice...";
  audioMessage.textContent = "Rendering your development voice.";

  try {
    const response = await fetch("/api/voice/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voiceId: selectedVoiceId,
        text,
        speed: Number(speedSlider.value),
        stability: Number(stabilitySlider.value),
        format: "mp3"
      })
    });

    if (!response.ok) {
      let message = "Voice generation failed.";
      try {
        const data = await response.json();
        if (data.error) message = data.error;
      } catch (_) {}
      throw new Error(message);
    }

    currentAudioBlob = await response.blob();
    currentAudioUrl = URL.createObjectURL(currentAudioBlob);
    currentAudio = new Audio(currentAudioUrl);
    downloadMp3.disabled = false;
    playButton.disabled = false;

    currentAudio.addEventListener("loadedmetadata", () => {
      audioDuration.textContent = formatTime(currentAudio.duration);
    });
    currentAudio.addEventListener("timeupdate", () => {
      if (!currentAudio || !currentAudio.duration) return;
      playerProgress.style.width = `${(currentAudio.currentTime / currentAudio.duration) * 100}%`;
      audioCurrentTime.textContent = formatTime(currentAudio.currentTime);
    });
    currentAudio.addEventListener("ended", () => {
      playing = false;
      playButton.textContent = "▶";
      playerProgress.style.width = "0%";
      audioCurrentTime.textContent = "00:00";
    });

    waveform.classList.remove("generating");
    waveform.classList.add("generated");
    setStatus("READY");
    audioEmpty.querySelector("strong").textContent = "Voice generated successfully";
    audioMessage.textContent = `${getSelectedVoice().name} · Development · Deepgram`;
    generateButton.textContent = "✓ Voice Generated";
  } catch (error) {
    waveform.classList.remove("generating", "generated");
    setStatus("ERROR", "error");
    audioEmpty.querySelector("strong").textContent = "Voice generation failed.";
    audioMessage.textContent = error.message || "Please try again.";
    generateButton.textContent = "✦ Generate Voice";
  } finally {
    generateButton.style.opacity = "1";
    generateButton.disabled = false;
  }
}

generateButton.addEventListener("click", generateVoice);

playButton.addEventListener("click", async () => {
  if (!currentAudio) return;
  if (playing) {
    currentAudio.pause();
    playing = false;
    playButton.textContent = "▶";
    return;
  }
  try {
    await currentAudio.play();
    playing = true;
    playButton.textContent = "Ⅱ";
  } catch (error) {
    setStatus("PLAYBACK ERROR", "error");
  }
});

async function downloadAudio(format) {
  if (format === "mp3" && currentAudioBlob) {
    const url = URL.createObjectURL(currentAudioBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "svara-origins-test-voice.mp3";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  if (format !== "wav") return;

  if (!currentWavBlob) {
    downloadWav.disabled = true;
    downloadWav.textContent = "Preparing WAV...";
    try {
      const response = await fetch("/api/voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: selectedVoiceId,
          text: scriptInput.value.trim(),
          speed: Number(speedSlider.value),
          stability: Number(stabilitySlider.value),
          format: "wav"
        })
      });
      if (!response.ok) throw new Error("WAV generation failed.");
      currentWavBlob = await response.blob();
    } catch (error) {
      setStatus("ERROR", "error");
      audioMessage.textContent = error.message;
      downloadWav.textContent = "↓ Download WAV";
      downloadWav.disabled = false;
      return;
    }
    downloadWav.textContent = "↓ Download WAV";
    downloadWav.disabled = false;
  }

  const url = URL.createObjectURL(currentWavBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "svara-origins-test-voice.wav";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

downloadMp3.addEventListener("click", () => downloadAudio("mp3"));
downloadWav.addEventListener("click", () => downloadAudio("wav"));

scriptInput.addEventListener("input", () => {
  resetAudioPreview();
  const characters = scriptInput.value.length;
  characterCount.textContent = `${characters.toLocaleString()} / 2000 characters`;
  const words = scriptInput.value.trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.round((words / 150) * 60);
  durationEstimate.textContent = seconds < 60 ? `Estimated ${seconds} sec` : `Estimated ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  characterCount.style.color = characters > 1800 ? "#ffd166" : "#687386";
});

clearScript.addEventListener("click", () => {
  scriptInput.value = "";
  scriptInput.dispatchEvent(new Event("input"));
  scriptInput.focus();
});

settingsToggle.addEventListener("click", () => {
  const isHidden = settingsPanel.hasAttribute("hidden");
  if (isHidden) settingsPanel.removeAttribute("hidden");
  else settingsPanel.setAttribute("hidden", "");
  settingsToggle.querySelector(".chevron").textContent = isHidden ? "⌃" : "⌄";
});

function updateSettingsSummary() {
  settingsSummary.textContent = `Speed ${Number(speedSlider.value).toFixed(1)}x · Stability ${stabilitySlider.value}% · ${styleSelect.value}`;
}

speedSlider.addEventListener("input", () => {
  speedValue.textContent = `${Number(speedSlider.value).toFixed(1)}x`;
  updateSettingsSummary();
});
stabilitySlider.addEventListener("input", () => {
  stabilityValue.textContent = `${stabilitySlider.value}%`;
  updateSettingsSummary();
});
styleSelect.addEventListener("change", () => {
  voiceStyle.textContent = styleSelect.value;
  updateSettingsSummary();
  resetAudioPreview();
});

updateVoiceDetails();
updateSettingsSummary();
renderVoiceResults();
