let audioData;
let audioContext;
let audioSource;
let isAudioPlaying = false;
let tempo = 120.0; // Initialize tempo with the default value

function generateAudioData(sampleRate) {
    try {
        const inputText = "stop radioactivity";
        const morseCode = textToMorse(inputText); // Make sure this function is defined
        audioData = createMorseCodeAudioData(morseCode, sampleRate, tempo); // Make sure this function is defined
    } catch (error) {
        console.error("Error:", error.message);
        audioData = null;
    }
}

function playAudioData(audioData, sampleRate) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = audioContext.createBuffer(1, audioData.length, sampleRate);

    // Fill the AudioBuffer with the audio data
    const bufferChannel = audioBuffer.getChannelData(0);
    for (let i = 0; i < audioData.length; i++) {
        bufferChannel[i] = audioData[i] / 32767; // Convert from 16-bit to floating point
    }

    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioContext.destination);
    audioSource.onended = function () {
        isAudioPlaying = false;
        document.getElementById('stopButton').disabled = true;
        document.getElementById('playButton').disabled = false; // Re-enable Play button
    };

    audioSource.start();
    isAudioPlaying = true;
    document.getElementById('stopButton').disabled = false;
    document.getElementById('playButton').disabled = true; // Disable Play button while playing
}

function stopAudio() {
    if (isAudioPlaying) {
        audioSource.stop();
    }
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function generateWAVBlob(audioData, sampleRate) {
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);

    // Writing the WAV file header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, audioData.length * 2, true);

    // Writing the audio data
    for (let i = 0; i < audioData.length; i++) {
        view.setInt16(44 + i * 2, audioData[i], true);
    }

    return new Blob([view], { type: 'audio/wav' });
}

function download(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', function () {
    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');
    const downloadButton = document.getElementById('downloadButton');
    const sampleRateSelect = document.getElementById('sampleRateSelect');

    let sampleRate = parseInt(sampleRateSelect.value); // Initialize sampleRate with the default value


    playButton.addEventListener('click', function () {
        generateAudioData(sampleRate);
        playAudioData(audioData, sampleRate); // Use the selected sampleRate
    });

    stopButton.addEventListener('click', function () {
        stopAudio();
    });

    downloadButton.addEventListener('click', function () {
        generateAudioData(sampleRate);
        const wavBlob = generateWAVBlob(audioData, sampleRate); // Use the selected sampleRate
        download(wavBlob, 'morse_code_audio.wav');
    });

    sampleRateSelect.addEventListener('change', function () {
        sampleRate = parseInt(sampleRateSelect.value); // Update sampleRate when a new value is selected
    });

    tempoInput.addEventListener('input', function () {
        tempo = parseFloat(tempoInput.value); // Update tempo when the input changes
    });

});