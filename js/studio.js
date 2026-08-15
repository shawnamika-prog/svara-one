const generateButton =
document.querySelector(".generate");

const waveform =
document.getElementById("waveform");

const audioStatus =
document.getElementById("audioStatus");

const audioEmpty =
document.getElementById("audioEmpty");

const audioMessage =
document.getElementById("audioMessage");


generateButton.onclick = function(){

/* Start generating */

generateButton.innerHTML =
"Generating...";

generateButton.style.opacity =
"0.7";

generateButton.disabled =
true;


/* Animate waveform */

waveform.classList.add("generating");


/* Change status */

audioStatus.innerHTML =
"GENERATING";

audioStatus.style.color =
"#ffd166";

audioStatus.style.borderColor =
"#ffd16633";

audioStatus.style.background =
"#ffd16612";


/* Change message */

audioEmpty.firstChild.textContent =
"Creating your voice...";

audioMessage.textContent =
"AI is rendering your South African voice.";


/* Simulated generation */

setTimeout(function(){

/* Stop animation */

waveform.classList.remove(
"generating"
);

waveform.classList.add(
"generated"
);


/* Update status */

audioStatus.innerHTML =
"READY";

audioStatus.style.color =
"#16d89a";

audioStatus.style.borderColor =
"#16d89a25";

audioStatus.style.background =
"#16d89a12";


/* Update message */

audioEmpty.firstChild.textContent =
"Voice generated successfully";

audioMessage.textContent =
"Studio HD • South African English";


/* Update button */

generateButton.innerHTML =
"✓ Voice Generated";

generateButton.style.opacity =
"1";

generateButton.disabled =
false;


},2500);

};

const playButton = document.getElementById("playButton");

const playerProgress =
document.querySelector(".player-progress");

let playing = false;

let playTimer;

playButton.onclick = function(){

if(playing){

playing = false;

playButton.innerHTML = "▶";

clearInterval(playTimer);

return;

}

playing = true;

playButton.innerHTML = "Ⅱ";

let progress = 0;

playTimer = setInterval(function(){

progress += 1;

playerProgress.style.width = progress + "%";

if(progress >= 100){

clearInterval(playTimer);

playing = false;

playButton.innerHTML = "▶";

playerProgress.style.width = "0%";

}

},100);

};

const scriptInput =
document.getElementById("scriptInput");

const characterCount =
document.getElementById("characterCount");

const durationEstimate =
document.getElementById("durationEstimate");


scriptInput.addEventListener("input", function(){

resetAudioPreview();

const characters =
scriptInput.value.length;

characterCount.textContent =
characters.toLocaleString()
+ " / 5000 characters";


/* Estimate based on approximately
150 spoken words per minute */

const words =
scriptInput.value
.trim()
.split(/\s+/)
.filter(Boolean)
.length;


const seconds =
Math.round((words / 150) * 60);


if(seconds < 60){

durationEstimate.textContent =
"Estimated " + seconds + " sec";

}else{

const minutes =
Math.floor(seconds / 60);

const remainingSeconds =
seconds % 60;

durationEstimate.textContent =
"Estimated "
+ minutes
+ ":"
+ String(remainingSeconds).padStart(2,"0");

}


/* Character warning */

if(characters > 4500){

characterCount.style.color =
"#ffd166";

}else{

characterCount.style.color =
"#687386";

}

});

const speedSlider =
document.getElementById("speedSlider");

const speedValue =
document.getElementById("speedValue");

const stabilitySlider =
document.getElementById("stabilitySlider");

const stabilityValue =
document.getElementById("stabilityValue");


speedSlider.addEventListener("input", function(){

speedValue.textContent =
Number(this.value).toFixed(1) + "x";

});


stabilitySlider.addEventListener("input", function(){

stabilityValue.textContent =
this.value + "%";

});

const voiceName =
document.getElementById("voiceName");

const voiceDetails =
document.getElementById("voiceDetails");

const voiceAvatar =
document.getElementById("voiceAvatar");

const voiceGender =
document.getElementById("voiceGender");

const voiceStyle =
document.getElementById("voiceStyle");


const voices = {

Naledi: {
location: "Johannesburg",
language: "South African English",
gender: "Female",
style: "Commercial",
initial: "N"
},

Thabo: {
location: "Pretoria",
language: "South African English",
gender: "Male",
style: "Corporate",
initial: "T"
},

Sipho: {
location: "Durban",
language: "South African English",
gender: "Male",
style: "Storytelling",
initial: "S"
}

};


voiceSelect.addEventListener("change", function(){

const voice =
voices[this.value];

if(!voice){

return;

}

voiceName.textContent =
this.value;

voiceDetails.textContent =
voice.location
+ " · "
+ voice.language;

voiceAvatar.textContent =
voice.initial;

voiceGender.textContent =
voice.gender;

voiceStyle.textContent =
styleSelect.value;

resetAudioPreview();

});

styleSelect.addEventListener("change", function(){

voiceStyle.textContent =
this.value;

resetAudioPreview();

});

function resetAudioPreview(){

waveform.classList.remove("generating");
waveform.classList.remove("generated");

audioStatus.innerHTML =
"READY";

audioStatus.style.color =
"#16d89a";

audioStatus.style.borderColor =
"#16d89a25";

audioStatus.style.background =
"#16d89a12";

audioEmpty.firstChild.textContent =
"No audio generated yet.";

audioMessage.textContent =
"Your generated voice will appear here.";

playerProgress.style.width =
"0%";

playButton.innerHTML =
"▶";

}
