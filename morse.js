const fs = require('fs');

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

class WAVHeader {
    constructor() {
        this.RiffTag = Buffer.from('RIFF');
        this.RiffSize = 0;
        this.WaveTag = Buffer.from('WAVE');
        this.FmtTag = Buffer.from('fmt ');
        this.FmtSize = 16; // PCM
        this.AudioFormat = 1; // Linear quantization
        this.NumChannels = 1; // Mono
        this.SampleRate = 0;
        this.ByteRate = 0;
        this.BlockAlign = 0;
        this.BitsPerSample = 0;
        this.DataTag = Buffer.from('data');
        this.DataSize = 0;
    }
}

function NewWAVHeader(sampleRate, bitsPerSample, dataLength) {
    const header = new WAVHeader();
    header.SampleRate = sampleRate;
    header.BitsPerSample = bitsPerSample;
    header.ByteRate = (sampleRate * bitsPerSample) / 8;
    header.BlockAlign = (bitsPerSample / 8);
    header.DataSize = dataLength * (bitsPerSample / 8);
    header.RiffSize = header.DataSize + 36;

    return header;
}

function saveAsWAV(filename, sampleRate, data) {
    const header = NewWAVHeader(sampleRate, 16, data.length);
    const headerSize = 44; // Size of WAV header

    // Create a buffer to store the WAV data
    const buffer = Buffer.alloc(headerSize + data.length * 2); // 16-bit audio (2 bytes per sample)

    // Write the WAV header to the buffer
    header.RiffSize = headerSize + data.length * 2 - 8;
    header.SampleRate = sampleRate;
    header.BitsPerSample = 16;
    header.ByteRate = (sampleRate * 16) / 8;
    header.BlockAlign = 2;
    header.DataSize = data.length * 2;
    header.FmtSize = 16;

    let offset = 0;
    offset += header.RiffTag.copy(buffer, offset);
    offset = buffer.writeUInt32LE(header.RiffSize, offset);
    offset += header.WaveTag.copy(buffer, offset);
    offset += header.FmtTag.copy(buffer, offset);
    offset = buffer.writeUInt32LE(header.FmtSize, offset);
    offset = buffer.writeUInt16LE(header.AudioFormat, offset);
    offset = buffer.writeUInt16LE(header.NumChannels, offset);
    offset = buffer.writeUInt32LE(header.SampleRate, offset);
    offset = buffer.writeUInt32LE(header.ByteRate, offset);
    offset = buffer.writeUInt16LE(header.BlockAlign, offset);
    offset = buffer.writeUInt16LE(header.BitsPerSample, offset);
    offset += header.DataTag.copy(buffer, offset);
    offset = buffer.writeUInt32LE(header.DataSize, offset);

    // Write the audio data to the buffer (16-bit little-endian)
    for (let i = 0; i < data.length; i++) {
        buffer.writeInt16LE(data[i], offset);
        offset += 2;
    }

    // Write the buffer contents to the WAV file
    try {
        fs.writeFileSync(filename, buffer);
        return null; // Success, no error
    } catch (err) {
        return err; // Error occurred
    }
}

function createMorseCodeAudioData(morseCode, sampleRate, tempo) {
    let outputData = [];

    const ditLength = ditLengthForTempo(tempo); // Assuming this function is defined elsewhere
    const note = "A5";
    const frequency = noteToFrequency(note); // Assuming this function is defined elsewhere
    const sequence = [{ DitDuration: 999999999, Frequency: frequency }];

    let ditCounter = 0;
    let sequenceAccumulator = 0;
    let sequenceStep = 0;

    let dotSample = generateSineWave(sequence[sequenceStep].Frequency, sampleRate, ditLength, 0.005);
    let dashSample = generateSineWave(sequence[sequenceStep].Frequency, sampleRate, ditLength * 3, 0.005);

    for (const runeValue of morseCode) {
        if (ditCounter >= sequenceAccumulator + sequence[sequenceStep].DitDuration) {
            sequenceAccumulator += sequence[sequenceStep].DitDuration;
            sequenceStep++;
            dotSample = generateSineWave(sequence[sequenceStep].Frequency, sampleRate, ditLength, 0.005);
            dashSample = generateSineWave(sequence[sequenceStep].Frequency, sampleRate, ditLength * 3, 0.005);
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

function main() {
    try {
        const tempo = 120.0;
        const inputText = "stop radioactivity";
        const sampleRate = 44100;

        const morseCode = textToMorse(inputText); // Assuming this function is defined elsewhere
        const outputData = createMorseCodeAudioData(morseCode, sampleRate, tempo);

        const err = saveAsWAV("output.wav", sampleRate, outputData); // Assuming this function is defined elsewhere

        if (err) {
            console.error("Error saving WAV file:", err.message);
        } else {
            console.log("WAV file saved successfully.");
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Call the main function to execute the code
main();
