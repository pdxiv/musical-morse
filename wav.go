package main

import (
	"bytes"
	"encoding/binary"
	"os"
)

// WAVHeader represents the header of a WAV file
type WAVHeader struct {
	RiffTag       [4]byte
	RiffSize      uint32
	WaveTag       [4]byte
	FmtTag        [4]byte
	FmtSize       uint32
	AudioFormat   uint16
	NumChannels   uint16
	SampleRate    uint32
	ByteRate      uint32
	BlockAlign    uint16
	BitsPerSample uint16
	DataTag       [4]byte
	DataSize      uint32
}

// NewWAVHeader creates a new WAVHeader for the given sample rate, bit depth, and data length
func NewWAVHeader(sampleRate int, bitsPerSample int, dataLength int) WAVHeader {
	var header WAVHeader
	copy(header.RiffTag[:], "RIFF")
	copy(header.WaveTag[:], "WAVE")
	copy(header.FmtTag[:], "fmt ")
	copy(header.DataTag[:], "data")

	header.FmtSize = 16    // PCM
	header.AudioFormat = 1 // Linear quantization
	header.NumChannels = 1 // Mono
	header.SampleRate = uint32(sampleRate)
	header.BitsPerSample = uint16(bitsPerSample)
	header.ByteRate = header.SampleRate * uint32(header.NumChannels) * uint32(header.BitsPerSample) / 8
	header.BlockAlign = header.NumChannels * header.BitsPerSample / 8
	header.DataSize = uint32(dataLength) * uint32(header.BlockAlign)
	header.RiffSize = header.DataSize + 36

	return header
}

// SaveAsWAV saves the given data as a WAV file
func SaveAsWAV(filename string, sampleRate int, data []int16) error {
	// Create a buffer to store the WAV data in memory
	var buffer bytes.Buffer

	header := NewWAVHeader(sampleRate, 16, len(data))

	// Write the WAV header to the buffer
	if err := binary.Write(&buffer, binary.LittleEndian, header); err != nil {
		return err
	}

	// Write the audio data to the buffer
	for _, value := range data {
		if err := binary.Write(&buffer, binary.LittleEndian, value); err != nil {
			return err
		}
	}

	// Create the file and write the buffer contents to it
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = buffer.WriteTo(file)
	if err != nil {
		return err
	}

	return nil
}
