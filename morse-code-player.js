function textToMorse(text) {
    // Morse code representation
    const morseCodeDict = {
        'A': ".-", 'B': "-...", 'C': "-.-.", 'D': "-..", 'E': ".",
        'F': "..-.", 'G': "--.", 'H': "....", 'I': "..", 'J': ".---",
        'K': "-.-", 'L': ".-..", 'M': "--", 'N': "-.", 'O': "---",
        'P': ".--.", 'Q': "--.-", 'R': ".-.", 'S': "...", 'T': "-",
        'U': "..-", 'V': "...-", 'W': ".--", 'X': "-..-", 'Y': "-.--",
        'Z': "--..",

        '1': ".----", '2': "..---", '3': "...--", '4': "....-", '5': ".....",
        '6': "-....", '7': "--...", '8': "---..", '9': "----.", '0': "-----",

        ',': "--..--", '.': ".-.-.-", '?': "..--..", '/': "-..-.", '-': "-....-",
        '(': "-.--.", ')': "-.--.-",

        ' ': "_", // This is used to explicitly track the space between words
    };

    // Add two dummy blank spaces at the end of the Morse code, to make looping more intuitive
    text += "  ";

    // Converting text to uppercase
    text = text.toUpperCase();

    // Translating each character to Morse code
    const morseCode = [];
    for (const char of text) {
        if (morseCodeDict[char]) {
            morseCode.push(morseCodeDict[char]);
        }
    }

    return morseCode.join(" ");
}

function generateWave(waveform, frequency, sampleRate, duration, fadeTime) {
    if (waveform == "sine") {
        return generateSineWave(frequency, sampleRate, duration, fadeTime);
    }
    if (waveform == "square") {
        return generateSquareWave(frequency, sampleRate, duration, fadeTime);
    }
}

function generateSineWave(frequency, sampleRate, duration, fadeTime) {
    const completeCyclesDuration = Math.round(frequency * duration) / frequency;
    const samplesCount = Math.round(sampleRate * completeCyclesDuration);
    const floatSineWave = new Array(samplesCount);
    const sineWave = new Array(samplesCount);

    for (let i = 0; i < samplesCount; i++) {
        // Calculate the sine value for this sample
        const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
        // Convert it to 16-bit integer range
        floatSineWave[i] = sample * 32767;
    }

    const fadeSamples = Math.round(fadeTime * sampleRate);
    // Fade in sample
    for (let i = 0; i < fadeSamples; i++) {
        const fadeInMultiplier = i / fadeSamples;
        floatSineWave[i] *= fadeInMultiplier;
    }

    // Fade out sample
    const fadeoutOffset = floatSineWave.length - fadeSamples;
    for (let i = 0; i < fadeSamples; i++) {
        const fadeOutMultiplier = (fadeSamples - i - 1) / fadeSamples;
        floatSineWave[i + fadeoutOffset] *= fadeOutMultiplier;
    }

    // Convert to 16-bit integers
    for (let i = 0; i < samplesCount; i++) {
        sineWave[i] = Math.round(floatSineWave[i]);
    }

    return sineWave;
}

// Generate a band-limited square wave using fourier series
function generateSquareWave(frequency, sampleRate, duration, fadeTime) {
    const completeCyclesDuration = Math.round(frequency * duration) / frequency;
    const samplesCount = Math.round(sampleRate * completeCyclesDuration);
    const floatSineWave = new Array(samplesCount);
    const squareWave = new Array(samplesCount);

    // const harmonicsCount = 12;
    const harmonicsCount = ((sampleRate / 2 / frequency) - 1) / 2;


    let maxAmplitude = 0;

    for (let i = 0; i < samplesCount; i++) {
        // Calculate the sine value for this sample
        let sample = 0;
        for (let j = 0; j <= harmonicsCount; j++) {
            let harmonic = j * 2 + 1;
            let amplitude = 4 / (harmonic * Math.PI);
            sample += amplitude * Math.sin((2 * Math.PI * frequency * (i * harmonic)) / sampleRate);
        }

        // Get information about if amplitude is too big
        if (sample > maxAmplitude) { maxAmplitude = sample; }
        if (-sample > maxAmplitude) { maxAmplitude = -sample; }

        // Convert it to 16-bit integer range
        floatSineWave[i] = sample * 32767;
    }

    // Normalize amplitude
    for (let i = 0; i < samplesCount; i++) {
        floatSineWave[i] = floatSineWave[i] / maxAmplitude;
    }

    const fadeSamples = Math.round(fadeTime * sampleRate);
    // Fade in sample
    for (let i = 0; i < fadeSamples; i++) {
        const fadeInMultiplier = i / fadeSamples;
        floatSineWave[i] *= fadeInMultiplier;
    }

    // Fade out sample
    const fadeoutOffset = floatSineWave.length - fadeSamples;
    for (let i = 0; i < fadeSamples; i++) {
        const fadeOutMultiplier = (fadeSamples - i - 1) / fadeSamples;
        floatSineWave[i + fadeoutOffset] *= fadeOutMultiplier;
    }

    // Convert to 16-bit integers
    for (let i = 0; i < samplesCount; i++) {
        squareWave[i] = Math.round(floatSineWave[i]);
    }

    return squareWave;
}

// NoteToFrequency converts a musical note to its frequency.
// Note should be in the format "C4", "A4", "F#3", etc.
function noteToFrequency(note) {
    const referenceFrequencyA4 = 440.0;
    const notesInOctave = 12;

    // Define the notes
    const notes = {
        "C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4,
        "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2,
    };

    note = note.toUpperCase();

    // Split the note into the note name and octave
    if (note.length < 2) {
        throw new Error("invalid note: " + note);
    }

    // Find the position where the octave starts (first digit)
    let octaveStart = 0;
    for (let i = 0; i < note.length; i++) {
        if (!isNaN(note[i])) {
            octaveStart = i;
            break;
        }
    }

    if (octaveStart === 0) {
        throw new Error("invalid note: " + note);
    }

    const noteName = note.slice(0, octaveStart);
    const octave = parseOctave(note.slice(octaveStart));

    // Calculate the position of the note
    const position = notes[noteName];
    if (position === undefined) {
        throw new Error("invalid note: " + note);
    }

    // Calculate the number of half steps from A4
    const halfSteps = position + (octave - 4) * notesInOctave;

    // Calculate the frequency
    const frequency = referenceFrequencyA4 * Math.pow(2, halfSteps / 12);

    return frequency;
}

// parseOctave parses the octave part of the note and checks for errors.
function parseOctave(octaveString) {
    const topOctave = 8;
    const octave = parseInt(octaveString);

    if (isNaN(octave) || octave < 0 || octave > topOctave) {
        throw new Error("invalid octave: " + octaveString);
    }

    return octave;
}

function ditLengthForTempo(tempo) {
    const SecondsInMinute = 60;
    const DitsInBeat = 8;
    return SecondsInMinute / tempo / DitsInBeat;
}

function createMorseCodeAudioData(wave, morseCode, sampleRate, tempo, note) {
    let outputData = [];

    const ditLength = ditLengthForTempo(tempo);
    const frequency = noteToFrequency(note);
    const sequence = [{ DitDuration: 999999999, Frequency: frequency }];

    let ditCounter = 0;
    let sequenceAccumulator = 0;
    let sequenceStep = 0;

    let dotSample = generateWave(wave, sequence[sequenceStep].Frequency, sampleRate, ditLength, 0.005);
    let dashSample = generateWave(wave, sequence[sequenceStep].Frequency, sampleRate, ditLength * 3, 0.005);

    for (const runeValue of morseCode) {
        if (ditCounter >= sequenceAccumulator + sequence[sequenceStep].DitDuration) {
            sequenceAccumulator += sequence[sequenceStep].DitDuration;
            sequenceStep++;
            dotSample = generateWave(wave, sequence[sequenceStep].Frequency, sampleRate, ditLength, 0.005);
            dashSample = generateWave(wave, sequence[sequenceStep].Frequency, sampleRate, ditLength * 3, 0.005);
        }

        switch (runeValue) {
            case '.':
                outputData = outputData.concat(dotSample);
                const expectedLength = Math.floor((ditCounter + 2) * ditLength * sampleRate);
                outputData = outputData.concat(new Array(expectedLength - outputData.length).fill(0));
                ditCounter += 2;
                break;
            case '-':
                outputData = outputData.concat(dashSample);
                const expectedLengthDash = Math.floor((ditCounter + 4) * ditLength * sampleRate);
                outputData = outputData.concat(new Array(expectedLengthDash - outputData.length).fill(0));
                ditCounter += 4;
                break;
            case '_':
                const expectedLengthSpace = Math.floor(ditCounter * ditLength * sampleRate);
                outputData = outputData.concat(new Array(expectedLengthSpace - outputData.length).fill(0));
                ditCounter += 0;
                break;
            case ' ':
                const expectedLengthSpaceBetweenWords = Math.floor((ditCounter + 4) * ditLength * sampleRate);
                outputData = outputData.concat(new Array(expectedLengthSpaceBetweenWords - outputData.length).fill(0));
                ditCounter += 4;
                break;
        }
    }
    return outputData;
}

// To make the functions optionally work in node.js as well
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // This code is running in a Node.js environment
    module.exports = {
        textToMorse,
        createMorseCodeAudioData
    };
}
