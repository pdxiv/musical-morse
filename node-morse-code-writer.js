const fs = require('fs');
const { textToMorse, createMorseCodeAudioData } = require('./morse-code-player.js');

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

function main() {
    try {
        const tempo = 120.0;
        const inputText = "stop radioactivity";
        const sampleRate = 44100;

        const morseCode = textToMorse(inputText);
        const outputData = createMorseCodeAudioData(morseCode, sampleRate, tempo);

        const err = saveAsWAV("output.wav", sampleRate, outputData);

        if (err) {
            console.error("Error saving WAV file:", err.message);
        } else {
            console.log("WAV file saved successfully.");
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

main();