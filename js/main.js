const playButton =
document.getElementById("playButton");

const audioProgress =
document.getElementById("audioProgress");


let playing = false;

let progress = 22;

let timer;


playButton.onclick = function(){

if(playing){

playing = false;

playButton.innerHTML = "▶";

clearInterval(timer);

return;

}


playing = true;

playButton.innerHTML = "Ⅱ";


timer = setInterval(function(){

progress += 1.3;

audioProgress.style.width =
progress + "%";


if(progress >= 100){

clearInterval(timer);

playing = false;

playButton.innerHTML = "▶";

progress = 22;

audioProgress.style.width =
progress + "%";

}

},100);

};

const previewButtons =
document.querySelectorAll(".showcase-play");

let activePreview = null;

let previewTimer = null;


previewButtons.forEach(function(button){

    button.addEventListener("click", function(){

        const card =
        this.closest(".showcase-card");

        if(activePreview === card){

            card.classList.remove("playing");

            this.innerHTML = "▶";

            activePreview = null;

            clearTimeout(previewTimer);

            return;

        }


        if(activePreview){

            activePreview.classList.remove("playing");

            const oldButton =
            activePreview.querySelector(".showcase-play");

            oldButton.innerHTML = "▶";

        }


        activePreview = card;

        card.classList.add("playing");

        this.innerHTML = "Ⅱ";


        previewTimer = setTimeout(function(){

            card.classList.remove("playing");

            button.innerHTML = "▶";

            activePreview = null;

        }, 4000);

    });

});

const useVoiceButtons =
document.querySelectorAll(".showcase-use");


useVoiceButtons.forEach(function(button){

    button.addEventListener("click", function(){

        const voice =
        this.dataset.voice;

        alert(
            voice +
            " selected. Voice Studio will open here."
        );

    });

});

const demoScript =
document.getElementById("demoScript");

const demoCharacters =
document.getElementById("demoCharacters");

const demoGenerate =
document.getElementById("demoGenerate");

const demoVoice =
document.getElementById("demoVoice");

const demoResult =
document.getElementById("demoResult");


demoScript.addEventListener("input", function(){

    demoCharacters.textContent =
        this.value.length + " / 250";

});


demoGenerate.addEventListener("click", function(){

    const text =
        demoScript.value.trim();

    if(!text){

        demoScript.focus();

        return;

    }


    demoGenerate.disabled = true;

    demoGenerate.querySelector("span:first-child")
        .textContent = "Generating...";


    demoResult.innerHTML = `

        <div class="result-empty">

            <div class="result-icon">
                ✦
            </div>

            <h3>
                Creating your voice...
            </h3>

            <p>
                Preparing your preview with
                ${demoVoice.value}.
            </p>

        </div>

    `;


    setTimeout(function(){

        const voiceData = {

            Naledi: {
                initial:"N",
                location:"Johannesburg"
            },

            Thabo: {
                initial:"T",
                location:"Pretoria"
            },

            Sipho: {
                initial:"S",
                location:"Durban"
            }

        };


        const voice =
            voiceData[demoVoice.value];


        demoResult.innerHTML = `

            <div class="generated-result">

                <div class="generated-header">

                    <div class="generated-voice">

                        <div class="generated-avatar">
                            ${voice.initial}
                        </div>

                        <div>

                            <h3>
                                ${demoVoice.value}
                            </h3>

                            <p>
                                ${voice.location} ·
                                South African English
                            </p>

                        </div>

                    </div>

                    <span class="generated-status">
                        READY
                    </span>

                </div>


                <div class="generated-script">
                    "${text}"
                </div>


                <div class="generated-player">

                    <button
                        class="generated-play"
                        id="generatedPlay">

                        ▶

                    </button>

                    <div class="generated-line">

                        <div
                            class="generated-progress"
                            id="generatedProgress">
                        </div>

                    </div>

                    <span class="generated-time">
                        00:04
                    </span>

                </div>


                <div class="result-cta">

                    Like what you hear?

                    <strong>
                        Create a free account
                    </strong>

                    to keep generating.

                </div>

            </div>

        `;


        demoGenerate.disabled = false;

        demoGenerate.querySelector("span:first-child")
            .textContent = "Generate Voice";


        const generatedPlay =
            document.getElementById("generatedPlay");

        const generatedProgress =
            document.getElementById("generatedProgress");


        let demoPlaying = false;

        let demoTimer;

        let demoProgress = 35;


        generatedPlay.onclick = function(){

            if(demoPlaying){

                demoPlaying = false;

                generatedPlay.innerHTML = "▶";

                clearInterval(demoTimer);

                return;

            }


            demoPlaying = true;

            generatedPlay.innerHTML = "Ⅱ";


            demoTimer = setInterval(function(){

                demoProgress += 2;

                generatedProgress.style.width =
                    demoProgress + "%";


                if(demoProgress >= 100){

                    clearInterval(demoTimer);

                    demoPlaying = false;

                    generatedPlay.innerHTML = "▶";

                    demoProgress = 35;

                    generatedProgress.style.width =
                        demoProgress + "%";

                }

            },100);

        };


    },1400);

});

document.querySelectorAll(".plan-button").forEach(function(button){

    button.addEventListener("click", function(){

        alert(
            "Plans and subscriptions will be connected when account and billing are added."
        );

    });

});
