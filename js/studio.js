const generateButton = document.querySelector(".generate");
const waveform = document.getElementById("waveform");
const audioStatus = document.getElementById("audioStatus");
const audioEmpty = document.getElementById("audioEmpty");
const audioMessage = document.getElementById("audioMessage");
const playButton = document.getElementById("playButton");
const playerProgress = document.querySelector(".player-progress");
const scriptInput = document.getElementById("scriptInput");
const characterCount = document.getElementById("characterCount");
const durationEstimate = document.getElementById("durationEstimate");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
const stabilitySlider = document.getElementById("stabilitySlider");
const stabilityValue = document.getElementById("stabilityValue");
const voiceSelect = document.getElementById("voiceSelect");
const styleSelect = document.getElementById("styleSelect");
const voiceName = document.getElementById("voiceName");
const voiceDetails = document.getElementById("voiceDetails");
const voiceAvatar = document.getElementById("voiceAvatar");
const voiceGender = document.getElementById("voiceGender");
const voiceStyle = document.getElementById("voiceStyle");
const downloadMp3 = document.getElementById("downloadMp3");
const downloadWav = document.getElementById("downloadWav");

let currentAudio = null;
let currentAudioUrl = null;
let currentAudioBlob = null;
let currentWavBlob = null;
let currentWavUrl = null;
let playing = false;

const voices = {
  "TEST-VOICE-01": {
    location: "Development",
    language: "English",
    gender: "Female",
    style: "Commercial",
    initial: "1"
  },
  "TEST-VOICE-02": {
    location: "Development",
    language: "English",
    gender: "Female",
    style: "Corporate",
    initial: "2"
  },
  "TEST-VOICE-03": {
    location: "Development",
    language: "English",
    gender: "Female",
    style: "Storytelling",
    initial: "3"
  }
};

function setStatus(label, mode = "ready") {
  audioStatus.innerHTML = label;

  if (mode === "generating") {
    audioStatus.style.color = "#ffd166";
    audioStatus.style.borderColor = "#ffd16633";
    audioStatus.style.background = "#ffd16612";
    return;
  }

  if (mode === "error") {
    audioStatus.style.color = "#ff7b7b";
    audioStatus.style.borderColor = "#ff7b7b33";
    audioStatus.style.background = "#ff7b7b12";
    return;
  }

  audioStatus.style.color = "#16d89a";
  audioStatus.style.borderColor = "#16d89a25";
  audioStatus.style.background = "#16d89a12";
}

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
  }

  currentAudio = null;
  currentAudioUrl = null;
  currentAudioBlob = null;
  currentWavBlob = null;
  if (currentWavUrl) URL.revokeObjectURL(currentWavUrl);
  currentWavUrl = null;
  downloadMp3.disabled = true;
  downloadWav.disabled = true;
  playing = false;
  playButton.innerHTML = "▶";
  playerProgress.style.width = "0%";
}

function resetAudioPreview() {
  stopCurrentAudio();
  waveform.classList.remove("generating", "generated");
  setStatus("READY");
  audioEmpty.firstChild.textContent = "No audio generated yet.";
  audioMessage.textContent = "Your generated voice will appear here.";
}

function updateVoiceDetails() {
  const voice = voices[voiceSelect.value];
  if (!voice) return;

  voiceName.textContent = voiceSelect.value;
  voiceDetails.textContent = `${voice.location} · ${voice.language}`;
  voiceAvatar.textContent = voice.initial;
  voiceGender.textContent = voice.gender;
  voiceStyle.textContent = styleSelect.value;
}

async function generateVoice() {
  const text = scriptInput.value.trim();

  if (!text) {
    scriptInput.focus();
    return;
  }

  if (text.length > 2000) {
    setStatus("LIMIT", "error");
    audioEmpty.firstChild.textContent = "Development limit reached.";
    audioMessage.textContent = "Test generation is limited to 2,000 characters per request.";
    return;
  }

  stopCurrentAudio();
  generateButton.innerHTML = "Generating...";
  generateButton.style.opacity = "0.7";
  generateButton.disabled = true;
  waveform.classList.remove("generated");
  waveform.classList.add("generating");
  setStatus("GENERATING", "generating");
  audioEmpty.firstChild.textContent = "Creating your voice...";
  audioMessage.textContent = "Rendering your development voice.";

  try {
    const response = await fetch("/api/voice/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voiceId: voiceSelect.value,
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
    downloadMp3.disabled = false;
    downloadWav.disabled = false;
    currentAudio = new Audio(currentAudioUrl);

    currentAudio.addEventListener("timeupdate", () => {
      if (!currentAudio || !currentAudio.duration) return;
      playerProgress.style.width = `${(currentAudio.currentTime / currentAudio.duration) * 100}%`;
    });

    currentAudio.addEventListener("ended", () => {
      playing = false;
      playButton.innerHTML = "▶";
      playerProgress.style.width = "0%";
    });

    waveform.classList.remove("generating");
    waveform.classList.add("generated");
    setStatus("READY");
    audioEmpty.firstChild.textContent = "Voice generated successfully";
    audioMessage.textContent = "Development voice · Deepgram";
    generateButton.innerHTML = "✓ Voice Generated";
  } catch (error) {
    waveform.classList.remove("generating", "generated");
    setStatus("ERROR", "error");
    audioEmpty.firstChild.textContent = "Voice generation failed.";
    audioMessage.textContent = error.message || "Please try again.";
    generateButton.innerHTML = "Generate Voice";
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
    playButton.innerHTML = "▶";
    return;
  }

  try {
    await currentAudio.play();
    playing = true;
    playButton.innerHTML = "Ⅱ";
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
          voiceId: voiceSelect.value,
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

scriptInput.addEventListener("input", function () {
  resetAudioPreview();

  const characters = scriptInput.value.length;
  characterCount.textContent = `${characters.toLocaleString()} / 2000 characters`;

  const words = scriptInput.value.trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.round((words / 150) * 60);

  if (seconds < 60) {
    durationEstimate.textContent = `Estimated ${seconds} sec`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    durationEstimate.textContent = `Estimated ${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  characterCount.style.color = characters > 1800 ? "#ffd166" : "#687386";
});

speedSlider.addEventListener("input", function () {
  speedValue.textContent = `${Number(this.value).toFixed(1)}x`;
});

stabilitySlider.addEventListener("input", function () {
  stabilityValue.textContent = `${this.value}%`;
});

voiceSelect.addEventListener("change", function () {
  updateVoiceDetails();
  resetAudioPreview();
});

styleSelect.addEventListener("change", function () {
  voiceStyle.textContent = this.value;
  resetAudioPreview();
});

updateVoiceDetails();
characterCount.textContent = "0 / 2000 characters";
