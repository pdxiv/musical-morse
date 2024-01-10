package main

import (
	"fmt"
	"math"
	"strings"
)

// SineWaveConfig holds the configuration for generating a sine wave
type SineWaveConfig struct {
	Frequency  float64 // Frequency of the sine wave in Hz
	SampleRate int     // Sample rate in Hz
	Duration   float64 // Duration of the sine wave in seconds
	FadeTime   float64 // Duration of fadeing up and down the sine wave volume
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
func GenerateSineWave(config SineWaveConfig) []int16 {
	completeCyclesDuration := math.Round(config.Frequency*config.Duration) / config.Frequency
	samplesCount := int(math.Round(float64(config.SampleRate) * completeCyclesDuration))
	sineWave := make([]int16, samplesCount)

	for i := 0; i < samplesCount; i++ {
		// Calculate the sine value for this sample
		sample := math.Sin(2 * math.Pi * config.Frequency * float64(i) / float64(config.SampleRate))
		// Convert it to 16-bit integer range
		sineWave[i] = int16(sample * 32767)
	}

	fadeSamples := int(config.FadeTime * float64(config.SampleRate))
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

func main() {
	inputText := "stop radioactivity"
	morseCode := textToMorse(inputText)
	frequency := 1001.0
	sampleRate := 44100
	ditLength := 0.05

	config := SineWaveConfig{
		Frequency:  frequency,
		SampleRate: sampleRate,
		Duration:   ditLength,
		FadeTime:   0.005,
	}
	dotSample := GenerateSineWave(config)

	config = SineWaveConfig{
		Frequency:  frequency,
		SampleRate: sampleRate,
		Duration:   ditLength * 3,
		FadeTime:   0.005,
	}
	dashSample := GenerateSineWave(config)

	fmt.Println(len(dotSample), len(dashSample))

	var outputData []int16

	ditCounter := 0
	for _, runeValue := range morseCode {

		switch runeValue {
		case '.':
			outputData = append(outputData, dotSample...)
			outputData = append(outputData, make([]int16, int(ditLength*float64(sampleRate)))...)
			ditCounter += 2
		case '-':
			outputData = append(outputData, dashSample...)
			outputData = append(outputData, make([]int16, int(ditLength*float64(sampleRate)))...)
			ditCounter += 4
		case '_':
			outputData = append(outputData, make([]int16, int(8*ditLength*float64(sampleRate)))...)
			ditCounter += 8
		case ' ':
			outputData = append(outputData, make([]int16, int(4*ditLength*float64(sampleRate)))...)
			ditCounter += 4
		}

	}

	// Saving the data as a WAV file
	err := SaveAsWAV("output.wav", sampleRate, outputData)
	if err != nil {
		fmt.Println("Error saving WAV file:", err)
	} else {
		fmt.Println("WAV file saved successfully.")
	}
}
