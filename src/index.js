var scopePowerState = false;

/* Old knob values, used to update the screen only when a real change occurs (not just a mouse move) */
let oldVoltTicks;
let oldTimeTicks;
let oldTriggerSlope;
let oldTriggerOffset;
let oldVerticalOffset;
let oldHorizontalOffset;

/* HTML audio player for the fan loop sound */
let backgroundAudio;

/* Size limits */
const minSectionWidth = '150px';
const maxSectionWidth = '180px';
const minScopeSize = '400px'


/* IDs of the used html objects */
const scopeBox = document.getElementById('scopeBox');
const scopeScreenArea = document.getElementById('scopeScreenArea');
const scopePowerBtn = document.getElementById('pwrBtn');
const pwrBtnContainer = document.getElementById('pwrBtnContainer');
const voltSection = document.getElementById('voltSection');
const voltOffsetText = document.getElementById('voltOffsetText');
const voltDivText = document.getElementById('voltDivText');
const timeSection = document.getElementById('timeSection');
const timeOffsetText = document.getElementById('timeOffsetText');
const timeDivText = document.getElementById('timeDivText');
const triggerSection = document.getElementById('triggerSection');
const triggerSectionText = document.getElementById('triggerSectionText');
const triggerLevelText = document.getElementById('triggerLevelText');
const triggeredText = document.getElementById('triggeredText');
const triggerSlopeText = document.getElementById('triggerSlopeText');
const triggerSlopeBtn = document.getElementById('triggerSlopeBtn');
const triggerLED = document.getElementById('triggerLED');


/* Values and texts for the knobs and text overlays */
const voltSteps = [1, 0.5, 0.2, 0.1, 10, 5, 2];
const voltOverlay = ["1 V/div", "500 mV/div", "200 mV/div", "100 mV/div", "10 V/div", "5 V/div", "2 V/div"];

const timeSteps = [0.01, 0.005, 0.002, 0.001, 0.0005, 0.0002, 0.0001, 1, 0.5, 0.2, 0.1, 0.05, 0.02];
const timeOverlay = [
    "1 ms/div",
    "500 us/div", "200 us/div", "100 us/div",
    "50 us/div", "20 us/div", "10 us/div",
    "100 ms/div",
    "50 ms/div", "20 ms/div", "10 ms/div",
    "5 ms/div", "2 ms/div"
];



/* Controls creation */
//radius, left, top, overlay text array, overlay text id, step values, knob container, reference container for rotation
const voltKnob = new RotarySwitch('60px', '80%', '10%', voltOverlay, 'voltText', voltSteps, 'voltSection', 'scopeBox');
const timeKnob = new RotarySwitch('60px', '80%', '40%', timeOverlay, 'timeText', timeSteps, 'timeSection', 'scopeBox');
const voltOffsetKnob = new RotaryEncoder('40px', '70%', '10%', null, null, null, 'voltSection', 'scopeBox');
const timeOffsetKnob = new RotaryEncoder('40px', '70%', '40%', null, null, null, 'timeSection', 'scopeBox');
const triggerKnob = new RotaryEncoder('40px', '80%', '60%', null, 'triggerText', null, 'triggerSection', 'scopeBox');

/* Scope screen creation */
//fahter, container, obj name, html text, html text, width, height
const scopeScreen = new ScopeScreen('scopeBox', 'scopeScreenArea', 'scopeScreen', 'voltText', 'timeText', 'triggerText', '300px', '900px');

/* Signal processor setup */
const sigProc = new SignalProcessor();


sigProc.askForMic();
updateWindow();


function playSound(_src, _vol) {
    _src = './media/' + _src + '.mp3';

    let _audio = document.createElement('audio');
    _audio.src = _src;
    _audio.volume = _vol;
    _audio.play();
    _audio = null;
}

function playLoop(_src, _vol) {
    _src = './media/' + _src + '.mp3';

    backgroundAudio = document.createElement('audio');
    backgroundAudio.src = _src;
    backgroundAudio.volume = _vol;
    backgroundAudio.play();
}

function stopLoop() {
    backgroundAudio.pause();
    backgroundAudio = null;
}

sigProc.scriptProc.onaudioprocess = function (e) {
    let audioDataIn = e.inputBuffer.getChannelData(0);
    for (let i = 0; i < audioDataIn.length; i++, sigProc.bufferIndex++) {
        sigProc.dataBuffer[sigProc.bufferIndex] = audioDataIn[i];
        if (sigProc.bufferIndex == sigProc.dataBuffer.length) { sigProc.bufferIndex = 0; }
    }
}


/* If scope is on, the scope values are updated with the ones of the knobs */
setInterval(() => {

    if (!scopePowerState) { return; }

    /* Check for changes in time division */
    if (oldTimeTicks != timeKnob.ticks) {
        console.log('Time scale changed to: ' + timeOverlay[timeKnob.ticks]);
        sigProc.setBufferSize = timeSteps[timeKnob.ticks];
        oldTimeTicks = timeKnob.ticks;
    }

    /* Check for changes in volt division */
    if (oldVoltTicks != voltKnob.ticks) {
        console.log('Volt scale changed to: ' + voltOverlay[voltKnob.ticks]);
        scopeScreen.verticalGain = voltSteps[voltKnob.ticks];
        oldVoltTicks = voltKnob.ticks;

        /* Update trigger text based on volt divs to maintain the position on the screen */
        let _value = triggerKnob.value;
        if (_value > 180) { _value -= 360; }
        scopeScreen.triggerOffset = -_value / 180;
        triggerKnob.text = ((_value / 180) * ((scopeScreen.verticalDivs / 2) * scopeScreen.verticalGain)).toFixed(2) + ' V';

        _value = voltOffsetKnob.value;
        if (_value > 180) { _value -= 360; }
        scopeScreen.verticalOffset = -(_value / 180) * scopeScreen.verticalGain;
    }

    /* Check for changes in trigger threshold */
    if (oldTriggerOffset != triggerKnob.value) {

        let _value = triggerKnob.value;
        if (_value > 180) { _value -= 360; }
        scopeScreen.triggerOffset = -_value / 180;

        console.log('Trigger threshold changed to: ' + ((_value / 180) * ((scopeScreen.verticalDivs / 2) * scopeScreen.verticalGain)).toFixed(2) + ' V');
        triggerKnob.text = ((_value / 180) * ((scopeScreen.verticalDivs / 2) * scopeScreen.verticalGain)).toFixed(2) + ' V';
        oldTriggerOffset = triggerKnob.value;
    }

    /* Check for changes in vertical offset */
    if (oldVerticalOffset != voltOffsetKnob.value) {
        let _value = voltOffsetKnob.value;
        if (_value > 180) { _value -= 360; }

        scopeScreen.verticalOffset = -(_value / 180) * scopeScreen.verticalGain;

        console.log('Volt offset changed to: ' + ((_value / 180) * (scopeScreen.verticalDivs / 2) * scopeScreen.verticalGain).toFixed(2) + ' V')
        oldVerticalOffset = voltOffsetKnob.value;
    }

    /* Check for changes in horizontal offset */
    if (oldHorizontalOffset != timeOffsetKnob.value) {
        let _value = timeOffsetKnob.value;
        if (_value > 180) { _value -= 360; }

        scopeScreen.horizontalOffset = Math.round((sigProc.dataBuffer.length / 2) * (_value / 180));

        console.log('Time offset changed to: ' + Math.round((sigProc.dataBuffer.length / 4) * (_value / 180)));
        oldHorizontalOffset = timeOffsetKnob.value;
    }

    /* Audio buffer is being pushed to the screen */
    scopeScreen.drawTrace(sigProc.dataBuffer, scopeScreen);


    /* Refresh @30 fps */
}, 1000 / 30);



/* Refresh on resize */
function updateWindow() {


    /* Size limits check */
    if (((window.innerHeight * 0.90) < parseInt(minScopeSize)) || ((window.innerWidth * 0.90) < parseInt(minScopeSize))) {
        scopeBox.style.width = minScopeSize;
        scopeBox.style.height = scopeBox.style.width;
    } else {
        scopeBox.style.width = (parseInt(window.innerWidth) * 0.90) + 'px';
        scopeBox.style.height = (parseInt(window.innerHeight) * 0.90) + 'px';
    }

    /* Ideal height and width calculations to be checked, better one is choosen */
    let idealW = scopeBox.getBoundingClientRect().width - parseInt(minSectionWidth) - 40;
    let idealH = scopeBox.getBoundingClientRect().height - pwrBtnContainer.getBoundingClientRect().height - 60;

    if (idealW > (idealH * scopeScreen.aspectRatio)) {
        scopeScreen.screenArea.style.height = idealH + 'px';
        scopeScreen.screenArea.style.width = (idealH * scopeScreen.aspectRatio) + 'px';
        scopeScreen.screen.style.width = scopeScreen.screenArea.style.width;
        scopeScreen.screen.style.height = scopeScreen.screenArea.style.height;
    } else {
        if (idealH > (idealW / scopeScreen.aspectRatio)) {
            scopeScreen.screenArea.style.width = idealW + 'px';
            scopeScreen.screenArea.style.height = (idealW / scopeScreen.aspectRatio) + 'px';
            scopeScreen.screen.style.width = scopeScreen.screenArea.style.width;
            scopeScreen.screen.style.height = scopeScreen.screenArea.style.height;
        }
    }


    /* volt section layout */
    let _temp = (scopeBox.clientLeft + scopeBox.clientWidth) - (scopeScreen.screen.clientLeft + scopeScreen.screen.clientWidth + 60);
    if (_temp > parseInt(maxSectionWidth)) { voltSection.style.width = maxSectionWidth; } else
        if (_temp < parseInt(minSectionWidth)) { voltSection.style.width = minSectionWidth; }
        else { voltSection.style.width = _temp + 'px'; }

    /* Every section occupies 1/3 of the scope screen height - the space inbetween */
    voltSection.style.height = (scopeScreen.screen.clientHeight * ((1 / 3) - (1 / 24))) + 'px';
    voltSection.style.left = (scopeBox.clientLeft + scopeBox.clientWidth - (voltSection.getBoundingClientRect().width + 20)) + 'px';
    voltSection.style.top = (scopeScreen.screen.clientTop) + 'px';

    voltOffsetKnob.container.style.top = ((parseInt(voltSection.style.height) - parseInt(voltOffsetKnob.container.style.height)) / 2) + 'px';
    voltOffsetKnob.container.style.left = '20px';

    voltKnob.container.style.top = ((parseInt(voltSection.style.height) - parseInt(voltKnob.container.style.height)) / 2) + 'px';
    voltKnob.container.style.left = (parseInt(voltSection.style.width) - parseInt(voltKnob.container.style.width) - 20) + 'px';

    voltOffsetText.style.top = (parseInt(voltOffsetKnob.container.style.top) + parseInt(voltOffsetKnob.container.style.height)) + 'px';
    voltOffsetText.style.left = (parseInt(voltOffsetKnob.container.style.left) + parseInt(voltOffsetKnob.container.style.width) / 2) + 'px';

    voltDivText.style.top = (parseInt(voltKnob.container.style.top) + parseInt(voltKnob.container.style.height)) + 'px';
    voltDivText.style.left = (parseInt(voltKnob.container.style.left) + parseInt(voltKnob.container.style.width) / 2) + 'px';



    /* Time section layout, same criteria as the volt section */
    _temp = (scopeBox.clientLeft + scopeBox.clientWidth) - (scopeScreen.screen.clientLeft + scopeScreen.screen.clientWidth + 60);
    if (_temp > parseInt(maxSectionWidth)) { timeSection.style.width = maxSectionWidth; } else
        if (_temp < parseInt(minSectionWidth)) { timeSection.style.width = minSectionWidth; } else
            timeSection.style.width = _temp + 'px';
    timeSection.style.height = (scopeScreen.screen.clientHeight * ((1 / 3) - (1 / 24))) + 'px';
    timeSection.style.left = (scopeBox.clientLeft + scopeBox.clientWidth - (timeSection.getBoundingClientRect().width + 20)) + 'px';
    timeSection.style.top = (scopeScreen.screen.clientTop + scopeScreen.screen.clientHeight * ((1 / 3) + (1 / 24))) + 'px';

    timeOffsetKnob.container.style.top = ((parseInt(timeSection.style.height) - parseInt(timeOffsetKnob.container.style.height)) / 2) + 'px';
    timeOffsetKnob.container.style.left = '20px';

    timeKnob.container.style.top = ((parseInt(timeSection.style.height) - parseInt(timeKnob.container.style.height)) / 2) + 'px';
    timeKnob.container.style.left = (parseInt(timeSection.style.width) - parseInt(timeKnob.container.style.width) - 20) + 'px';

    timeOffsetText.style.top = (parseInt(timeOffsetKnob.container.style.top) + parseInt(timeOffsetKnob.container.style.height)) + 'px';
    timeOffsetText.style.left = (parseInt(timeOffsetKnob.container.style.left) + parseInt(timeOffsetKnob.container.style.width) / 2) + 'px';

    timeDivText.style.top = (parseInt(timeKnob.container.style.top) + parseInt(timeKnob.container.style.height)) + 'px';
    timeDivText.style.left = (parseInt(timeKnob.container.style.left) + parseInt(timeKnob.container.style.width) / 2) + 'px';


    /* Trigger section , same criteria as the volt section */
    _temp = (scopeBox.clientLeft + scopeBox.clientWidth) - (scopeScreen.screen.clientLeft + scopeScreen.screen.clientWidth + 60);
    if (_temp > parseInt(maxSectionWidth)) { triggerSection.style.width = maxSectionWidth; } else
        if (_temp < parseInt(minSectionWidth)) { triggerSection.style.width = minSectionWidth; } else
            triggerSection.style.width = _temp + 'px';
    triggerSection.style.height = (scopeScreen.screen.clientHeight * ((1 / 3) - (1 / 12))) + 'px';
    triggerSection.style.left = (scopeBox.clientLeft + scopeBox.clientWidth - (triggerSection.getBoundingClientRect().width + 20)) + 'px';
    triggerSection.style.top = (scopeScreen.screen.clientTop + scopeScreen.screen.clientHeight - parseInt(triggerSection.style.height)) + 'px';

    triggerKnob.container.style.top = ((parseInt(triggerSection.style.height) - parseInt(triggerKnob.container.style.height)) / 2) + 'px';
    triggerKnob.container.style.left = '20px';

    triggerLED.style.top = ((parseInt(triggerSection.style.height) - triggerLED.clientHeight) / 10) + 'px';
    triggerLED.style.left = (parseInt(triggerSection.style.width) - triggerLED.clientWidth * 2) + 'px';

    triggerSlopeBtn.style.top = (parseInt(triggerKnob.container.style.top) + parseInt(triggerKnob.container.style.height) / 2) + 'px';
    triggerSlopeBtn.style.left = (parseInt(triggerSection.style.width) - triggerSlopeBtn.clientWidth - 20) + 'px';

    triggerSectionText.style.left = (parseInt(triggerKnob.container.style.left) + parseInt(triggerKnob.container.style.width)) + 'px';

    triggerLevelText.style.top = (parseInt(triggerKnob.container.style.top) + parseInt(triggerKnob.container.style.height)) + 'px';
    triggerLevelText.style.left = (parseInt(triggerKnob.container.style.left) + parseInt(triggerKnob.container.style.width) / 2) + 'px';

    triggeredText.style.top = (parseInt(triggerLED.style.top) + triggerLED.getBoundingClientRect().height / 1.5) + 'px';
    triggeredText.style.left = ((triggerLED.getBoundingClientRect().left - triggerSection.getBoundingClientRect().left) + (triggerLED.getBoundingClientRect().width / 2)) + 'px';

    triggerSlopeText.style.top = (parseInt(triggerSlopeBtn.style.top) + triggerSlopeBtn.getBoundingClientRect().height / 1.5) + 'px';;
    triggerSlopeText.style.left = ((triggerSlopeBtn.getBoundingClientRect().left - triggerSection.getBoundingClientRect().left) + (triggerSlopeBtn.getBoundingClientRect().width / 2)) + 'px';

    /* Power button vertical location after all the adjustments */
    pwrBtnContainer.style.top = (scopeScreen.screen.getBoundingClientRect().top + scopeScreen.screen.getBoundingClientRect().height) + 'px';

    /* Grid redraw adapted to the new scope screen size */
    scopeScreen.updateScopeBox();
}

/* Power button feedback */
scopePowerBtn.addEventListener('click', () => { scopeScreen.changePowerState(scopePowerBtn); });

/* Audio feedback */
scopePowerBtn.addEventListener('mousedown', () => { playSound('buttonDown', 0.60); });
scopePowerBtn.addEventListener('mouseup', () => { playSound('buttonUp', 0.60); });

window.addEventListener('resize', () => {
    scopeScreen.updateScopeBox();
    updateWindow();
});

/* Trigger slope switch */
triggerSlopeBtn.addEventListener('click', () => {
    if (!scopePowerState) { return; }
    scopeScreen.slope = !scopeScreen.slope;
    if (scopeScreen.slope) { triggerSlopeBtn.style.backgroundImage = 'url("img/SlopeDown.png")'; }
    else { triggerSlopeBtn.style.backgroundImage = 'url("img/SlopeUp.png")' };
    playSound('knobClick', 0.60);
})

