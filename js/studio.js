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
let audioContext = null;
let analyser = null;
let audioSourceNode = null;
let visualizerFrame = null;
let selectedVoiceId = "TEST-VOICE-01";
let activeFilter = "all";
let previewAudio = null;
let previewVoiceId = null;

const projectsButton = document.getElementById("projectsButton");
const projectsModal = document.getElementById("projectsModal");
const closeProjects = document.getElementById("closeProjects");
const projectNameInput = document.getElementById("projectNameInput");
const createProjectButton = document.getElementById("createProject");
const projectList = document.getElementById("projectList");
const projectCount = document.getElementById("projectCount");

const PROJECTS_KEY = "svaraOrigins.projects.v1";
const CURRENT_PROJECT_KEY = "svaraOrigins.currentProject.v1";
let projects = loadProjects();
let currentProjectId = localStorage.getItem(CURRENT_PROJECT_KEY) || null;

function loadProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (_) {
    return [];
  }
}

function saveProjects() {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  projectCount.textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;
}

function getCurrentProject() {
  return projects.find(project => project.id === currentProjectId) || null;
}

function persistCurrentProject() {
  const project = getCurrentProject();
  if (!project) return;
  project.script = scriptInput.value;
  project.voiceId = selectedVoiceId;
  project.speed = Number(speedSlider.value);
  project.stability = Number(stabilitySlider.value);
  project.style = styleSelect.value;
  project.updatedAt = new Date().toISOString();
  saveProjects();
}

function createProject(name) {
  const cleanName = name.trim();
  if (!cleanName) return;
  const project = {
    id: `project-${Date.now()}`,
    name: cleanName,
    script: scriptInput.value.trim(),
    voiceId: selectedVoiceId,
    speed: Number(speedSlider.value),
    stability: Number(stabilitySlider.value),
    style: styleSelect.value,
    generations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.unshift(project);
  currentProjectId = project.id;
  localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId);
  saveProjects();
  projectNameInput.value = "";
  renderProjects();
}

function selectProject(id) {
  const project = projects.find(item => item.id === id);
  if (!project) return;
  currentProjectId = id;
  localStorage.setItem(CURRENT_PROJECT_KEY, id);
  scriptInput.value = project.script || "";
  selectedVoiceId = project.voiceId || selectedVoiceId;
  speedSlider.value = project.speed ?? 1;
  stabilitySlider.value = project.stability ?? 70;
  styleSelect.value = project.style || "Natural";
  updateVoiceDetails();
  updateSettingsSummary();
  speedValue.textContent = `${Number(speedSlider.value).toFixed(1)}x`;
  stabilityValue.textContent = `${stabilitySlider.value}%`;
  scriptInput.dispatchEvent(new Event("input"));
  resetAudioPreview();
  renderVoiceResults();
  renderProjects();
}

function deleteProject(id) {
  projects = projects.filter(project => project.id !== id);
  if (currentProjectId === id) {
    currentProjectId = projects[0]?.id || null;
    if (currentProjectId) localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId);
    else localStorage.removeItem(CURRENT_PROJECT_KEY);
  }
  saveProjects();
  renderProjects();
}

function renderProjects() {
  saveProjects();
  projectList.innerHTML = "";
  if (!projects.length) {
    projectList.innerHTML = '<div class="project-empty">No projects yet. Create your first project above.</div>';
    return;
  }
  projects.forEach(project => {
    const card = document.createElement("div");
    card.className = `project-card${project.id === currentProjectId ? " active" : ""}`;
    const date = new Date(project.updatedAt || project.createdAt);
    const generationCount = project.generations?.length || 0;
    card.innerHTML = `
      <div class="project-copy">
        <strong>${escapeHtml(project.name)}</strong>
        <span>${generationCount} generation${generationCount === 1 ? "" : "s"} · Updated ${date.toLocaleDateString()}</span>
      </div>
      <div class="project-actions">
        <button class="project-action open" type="button" data-open-project="${project.id}">${project.id === currentProjectId ? "Selected" : "Open"}</button>
        <button class="project-action" type="button" data-delete-project="${project.id}">Delete</button>
      </div>`;
    projectList.appendChild(card);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[char]));
}

function openProjects() {
  renderProjects();
  projectsModal.hidden = false;
  projectNameInput.focus();
}

function closeProjectsModal() {
  projectsModal.hidden = true;
}

const voices = SVARA_VOICES;

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


function stopWaveformVisualizer() {
  if (visualizerFrame) {
    cancelAnimationFrame(visualizerFrame);
    visualizerFrame = null;
  }
}

function animateWaveform() {
  if (!currentAudio || currentAudio.paused || currentAudio.ended) {
    stopWaveformVisualizer();
    return;
  }

  const bars = waveform.querySelectorAll(".bar");
  if (!bars.length) return;

  if (analyser) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const step = Math.max(1, Math.floor(data.length / bars.length));

    bars.forEach((bar, index) => {
      const sample = data[Math.min(data.length - 1, index * step)] || 0;
      const height = 10 + (sample / 255) * 68;
      bar.style.height = `${height}px`;
      bar.style.transform = `scaleY(${0.75 + (sample / 255) * 0.25})`;
      bar.style.opacity = String(0.45 + (sample / 255) * 0.55);
    });
  } else {
    // Fallback visualizer if AudioContext is unavailable.
    bars.forEach((bar, index) => {
      const pulse = 0.5 + 0.5 * Math.sin((performance.now() / 180) + index * 0.65);
      bar.style.height = `${12 + pulse * 62}px`;
      bar.style.transform = `scaleY(${0.72 + pulse * 0.28})`;
      bar.style.opacity = String(0.5 + pulse * 0.5);
    });
  }

  visualizerFrame = requestAnimationFrame(animateWaveform);
}

async function startWaveformVisualizer() {
  if (!currentAudio) return;

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      audioSourceNode = audioContext.createMediaElementSource(currentAudio);
      audioSourceNode.connect(analyser);
      analyser.connect(audioContext.destination);
    }
    if (audioContext.state === "suspended") await audioContext.resume();
  } catch (_) {
    // The CSS/JS fallback still provides playback feedback.
    analyser = null;
  }

  stopWaveformVisualizer();
  animateWaveform();
}

function resetWaveformBars() {
  waveform.querySelectorAll(".bar").forEach(bar => {
    bar.style.height = "";
    bar.style.transform = "";
    bar.style.opacity = "";
  });
}

function stopCurrentAudio() {
  stopWaveformVisualizer();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
  if (currentWavUrl) URL.revokeObjectURL(currentWavUrl);
  currentAudio = null;
  audioSourceNode = null;
  analyser = null;
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
  waveform.classList.remove("generating", "generated", "playing");
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
    // WAV is generated on demand from the same script, so make the control
    // available as soon as a voice has been successfully generated.
    downloadWav.disabled = false;
    downloadWav.textContent = "↓ Download WAV";
    playButton.disabled = false;

    currentAudio.addEventListener("loadedmetadata", () => {
      audioDuration.textContent = formatTime(currentAudio.duration);
    });
    currentAudio.addEventListener("timeupdate", () => {
      if (!currentAudio || !currentAudio.duration) return;
      playerProgress.style.width = `${(currentAudio.currentTime / currentAudio.duration) * 100}%`;
      audioCurrentTime.textContent = formatTime(currentAudio.currentTime);
    });
    currentAudio.addEventListener("play", async () => {
      playing = true;
      waveform.classList.add("playing");
      playButton.textContent = "Ⅱ";
      await startWaveformVisualizer();
    });
    currentAudio.addEventListener("pause", () => {
      playing = false;
      stopWaveformVisualizer();
      waveform.classList.remove("playing");
      playButton.textContent = "▶";
    });
    currentAudio.addEventListener("ended", () => {
      playing = false;
      stopWaveformVisualizer();
      resetWaveformBars();
      waveform.classList.remove("playing");
      playButton.textContent = "▶";
      playerProgress.style.width = "0%";
      audioCurrentTime.textContent = "00:00";
    });

    waveform.classList.remove("generating");
    waveform.classList.add("generated");
    setStatus("READY");
    audioEmpty.querySelector("strong").textContent = "Voice generated successfully";
    audioMessage.textContent = `${getSelectedVoice().name} · Development · Deepgram`;

    const project = getCurrentProject();
    if (project) {
      project.script = text;
      project.voiceId = selectedVoiceId;
      project.speed = Number(speedSlider.value);
      project.stability = Number(stabilitySlider.value);
      project.style = styleSelect.value;
      project.updatedAt = new Date().toISOString();
      project.generations = project.generations || [];
      project.generations.unshift({
        id: `generation-${Date.now()}`,
        voiceId: selectedVoiceId,
        script: text,
        speed: Number(speedSlider.value),
        stability: Number(stabilitySlider.value),
        style: styleSelect.value,
        createdAt: new Date().toISOString()
      });
      saveProjects();
    }

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
    return;
  }
  try {
    if (currentAudio.ended) currentAudio.currentTime = 0;
    await currentAudio.play();
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

  settingsToggle.setAttribute("aria-expanded", String(isHidden));
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

projectsButton.addEventListener("click", openProjects);
closeProjects.addEventListener("click", closeProjectsModal);
projectsModal.addEventListener("click", event => {
  if (event.target === projectsModal) closeProjectsModal();
  const openButton = event.target.closest("[data-open-project]");
  const deleteButton = event.target.closest("[data-delete-project]");
  if (openButton) {
    selectProject(openButton.dataset.openProject);
    closeProjectsModal();
  }
  if (deleteButton) {
    deleteProject(deleteButton.dataset.deleteProject);
  }
});
createProjectButton.addEventListener("click", () => createProject(projectNameInput.value));
projectNameInput.addEventListener("keydown", event => {
  if (event.key === "Enter") createProject(projectNameInput.value);
  if (event.key === "Escape") closeProjectsModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !projectsModal.hidden) closeProjectsModal();
});

scriptInput.addEventListener("input", persistCurrentProject);
speedSlider.addEventListener("input", persistCurrentProject);
stabilitySlider.addEventListener("input", persistCurrentProject);
styleSelect.addEventListener("change", persistCurrentProject);

updateVoiceDetails();
updateSettingsSummary();
renderVoiceResults();
saveProjects();
renderProjects();
