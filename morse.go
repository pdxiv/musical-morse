package main

import (
	"fmt"
	"math"
	"strings"
	"unicode"
)

const DitsInBeat = 8

type SequencerStep struct {
	DitDuration int
	Frequency   float64 // Frequency of the sine wave in Hz
}

func textToMorse(text string) string {
	// Morse code representation
	morseCodeDict := map[rune]string{
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
	}

	// Add two dummy blank spaces at the end of the more code, to make looping more intuitive
	text += "  "

	// Converting text to uppercase
	text = strings.ToUpper(text)

	// Translating each character to Morse code
	var morseCode []string
	for _, char := range text {
		morseCode = append(morseCode, morseCodeDict[char])
	}

	return strings.Join(morseCode, " ")
}

// GenerateSineWave generates a complete sine wave based on the SineWaveConfig
// If the duration doesn't match an even sine wave period, modify the duration.
func GenerateSineWave(frequency float64, sampleRate int, duration float64, fadeTime float64) []int16 {
	completeCyclesDuration := math.Round(frequency*duration) / frequency
	samplesCount := int(math.Round(float64(sampleRate) * completeCyclesDuration))
	sineWave := make([]int16, samplesCount)

	for i := 0; i < samplesCount; i++ {
		// Calculate the sine value for this sample
		sample := math.Sin(2 * math.Pi * frequency * float64(i) / float64(sampleRate))
		// Convert it to 16-bit integer range
		sineWave[i] = int16(sample * 32767)
	}

	fadeSamples := int(fadeTime * float64(sampleRate))
	// Fade in sample
	for i := 0; i < fadeSamples; i++ {
		fadeInMultiplier := float64(i) / float64(fadeSamples)
		sineWave[i] = int16(float64(sineWave[i]) * fadeInMultiplier)
	}

	// Fade out sample
	fadeoutOffset := len(sineWave) - fadeSamples
	for i := 0; i < fadeSamples; i++ {
		fadeOutMultiplier := float64(fadeSamples-i-1) / float64(fadeSamples)
		sineWave[i+fadeoutOffset] = int16(float64(sineWave[i+fadeoutOffset]) * fadeOutMultiplier)
	}

	return sineWave
}

// NoteToFrequency converts a musical note to its frequency.
// Note should be in the format "C4", "A4", "F#3", etc.
func NoteToFrequency(note string) (float64, error) {
	const ReferenceFrequencyA4 = 440.0
	const NotesInOctave = 12

	// Define the notes
	notes := map[string]int{
		"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4,
		"F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2,
	}

	note = strings.ToUpper(note)

	// Split the note into the note name and octave
	if len(note) < 2 {
		return 0, fmt.Errorf("invalid note: %s", note)
	}

	// Find the position where the octave starts (first digit)
	var octaveStart int
	for i, r := range note {
		if unicode.IsDigit(r) {
			octaveStart = i
			break
		}
	}

	if octaveStart == 0 {
		return 0, fmt.Errorf("invalid note: %s", note)
	}

	noteName := note[:octaveStart]
	octave, err := parseOctave(note[octaveStart:])
	if err != nil {
		return 0, err
	}

	// Calculate the position of the note
	position, ok := notes[noteName]
	if !ok {
		return 0, fmt.Errorf("invalid note: %s", note)
	}

	// Calculate the number of half steps from A4
	halfSteps := position + (octave-4)*NotesInOctave

	// Calculate the frequency
	frequency := ReferenceFrequencyA4 * math.Pow(2, float64(halfSteps)/12)

	return frequency, nil
}

// parseOctave parses the octave part of the note and checks for errors.
func parseOctave(octaveString string) (int, error) {
	const TopOctave = 8
	var octave int
	_, err := fmt.Sscanf(octaveString, "%d", &octave)
	if err != nil || octave < 0 || octave > TopOctave {
		return 0, fmt.Errorf("invalid octave: %s", octaveString)
	}
	return octave, nil
}

// Calculate a suitable dit length based on a tempo in BPM
func ditLengthForTempo(tempo float64) float64 {
	const SecondsInMinute = 60
	return SecondsInMinute / tempo / DitsInBeat
}

func main() {
	var err error
	tempo := 160.0
	note := "A5"
	frequency, err := NoteToFrequency(note)
	inputText := "stop radioactivity stop radioactivity stop radioactivity stop radioactivity"
	sampleRate := 44100
	ditLength := ditLengthForTempo(tempo)

	morseCode := textToMorse(inputText)

	var outputData []int16

	sequence := []SequencerStep{
		{8, 523.25},
		{8, 587.33},
		{8, 659.25},
		{8, 783.99},
		{8, 1046.50},
		{8, 1174.66},
		{8, 1318.51},
		{8, 1174.66},
		{8, 1046.50},
		{8, 783.99},
		{8, 659.25},
		{8, 587.33},

		{8, 523.25},
		{8, 587.33},
		{8, 659.25},
		{8, 783.99},
		{8, 1046.50},
		{8, 1174.66},
		{8, 1318.51},
		{8, 1174.66},
		{8, 1046.50},
		{8, 783.99},
		{8, 659.25},
		{8, 587.33},

		{8, 440.00},
		{8, 493.88},
		{8, 523.25},
		{8, 659.25},
		{8, 880.00},
		{8, 987.77},
		{8, 1046.50},
		{8, 987.77},
		{8, 880.00},
		{8, 659.25},
		{8, 523.25},
		{8, 493.88},

		{8, 440.00},
		{8, 493.88},
		{8, 523.25},
		{8, 659.25},
		{8, 880.00},
		{8, 987.77},
		{8, 1046.50},
		{8, 987.77},
		{8, 880.00},
		{8, 659.25},
		{8, 523.25},
		{8, 493.88},

		{8, 349.23},
		{8, 392.00},
		{8, 440.00},
		{8, 523.25},
		{8, 698.46},
		{8, 783.99},
		{8, 880.00},
		{8, 783.99},
		{8, 698.46},
		{8, 523.25},
		{8, 440.00},
		{8, 392.00},

		{8, 349.23},
		{8, 392.00},
		{8, 440.00},
		{8, 523.25},
		{8, 698.46},
		{8, 783.99},
		{8, 880.00},
		{8, 783.99},
		{8, 698.46},
		{8, 523.25},
		{8, 440.00},
		{8, 392.00},

		{999999999, 440},
	}

	ditCounter := 0
	sequenceAccumulator := 0
	sequenceStep := 0

	dotSample := GenerateSineWave(sequence[sequenceStep].Frequency, sampleRate, ditLength, 0.005)
	dashSample := GenerateSineWave(sequence[sequenceStep].Frequency, sampleRate, ditLength*3, 0.005)

	for _, runeValue := range morseCode {
		if ditCounter >= sequenceAccumulator+sequence[sequenceStep].DitDuration {
			sequenceAccumulator += sequence[sequenceStep].DitDuration
			sequenceStep++
			// Only generate new dot and dash samples on every new sequencer step
			dotSample = GenerateSineWave(sequence[sequenceStep].Frequency, sampleRate, ditLength, 0.005)
			dashSample = GenerateSineWave(sequence[sequenceStep].Frequency, sampleRate, ditLength*3, 0.005)
		}

		switch runeValue {
		case '.':
			outputData = append(outputData, dotSample...)
			expectedLength := int(float64(ditCounter+2) * (ditLength) * float64(sampleRate))
			outputData = append(outputData, make([]int16, expectedLength-len(outputData))...)
			ditCounter += 2
		case '-':
			outputData = append(outputData, dashSample...)
			expectedLength := int(float64(ditCounter+4) * (ditLength) * float64(sampleRate))
			outputData = append(outputData, make([]int16, expectedLength-len(outputData))...)
			ditCounter += 4
		case '_':
			expectedLength := int(float64(ditCounter+0) * (ditLength) * float64(sampleRate))
			outputData = append(outputData, make([]int16, expectedLength-len(outputData))...)
			ditCounter += 0
		case ' ':
			expectedLength := int(float64(ditCounter+4) * (ditLength) * float64(sampleRate))
			outputData = append(outputData, make([]int16, expectedLength-len(outputData))...)
			ditCounter += 4
		}

	}

	// Saving the data as a WAV file
	err = SaveAsWAV("output.wav", sampleRate, outputData)
	if err != nil {
		fmt.Println("Error saving WAV file:", err)
	} else {
		fmt.Println("WAV file saved successfully.")
	}

	fmt.Println(frequency)
	fmt.Println(ditLength)
}
