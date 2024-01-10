# musical-morse

A project to try and make a more musical "sequencer" for morse code messages, along the line of how the morse code in Kraftwerk's Radioactivity sounds in the beginning.

Takes text as input and creates a wav file with the output.

## Concessions

To make the generated morse code more musical, the timing has to be adjusted a little. The basic timing unit of morse code is a "dit". The program has modified the behavior so that a pause between characters is 4 dits (instead of 3), and a pause between words is 8 dits (instead of 7). This reduces the realism of the output while improving the musical characteristics.

## Typical audio representation of morse code

### Timing

Morse code, when represented audibly, uses a specific timing for the short and long beeps (dots and dashes) and the pauses between them. The timing is standardized and is based on a basic unit of duration called the "dit" length, which is the duration of a dot. Here's how it breaks down:

* **Dot (Dit):** The duration of a dot is 1 time unit.
* **Dash (Dah):** The duration of a dash is 3 time units.
* **Space between elements (dots and dashes) within a character:** The space between elements of the same letter is 1 time unit.
* **Space between letters:** The space between letters is 3 time units.
* **Space between words:** The space between words is 7 time units. (Or a "quiet dot" of 1 time unit.)

To give an example, if you choose a dit length of 100 milliseconds:

* A dot (dit) will be a beep lasting 100 milliseconds.
* A dash (dah) will be a beep lasting 300 milliseconds.
* The pause between dots and dashes within a character will be 100 milliseconds.
* The pause between characters (letters) will be 300 milliseconds.
* The pause between words will be 700 milliseconds. (Or a "quiet beep" of 100 milliseconds.)

These timing rules ensure that Morse code is uniformly understood and can be efficiently transmitted and decoded, whether it's through sound, light, or visual signals.

### Frequencies

* **Common Frequency Range:** The typical frequency range for Morse code beeps (tones) is between 500 Hz and 1000 Hz (one octave, C5 - B5). This range is chosen because it is easily audible to most people and is distinct from many background noises.
* **Preferred Frequency for Radio Operators:** Amateur radio operators often prefer a frequency around 600-800 Hz (5 semitones, D#5 - G5). This frequency range is a good balance between being comfortably audible and not too harsh, especially during prolonged listening.

### Timbre

The timbre of Morse code tones is important. Different waveforms are used to create these tones, each with its unique characteristics:

* **Sine Wave:** This waveform produces the most basic and pure tone. It's characterized by a smooth and consistent sound, devoid of harshness, making it pleasing and easy on the ears. Due to these qualities, sine waves are a preferred choice in scenarios requiring continuous listening. Their clear tone aids in distinguishing Morse code signals even in potentially noisy environments.

* **Square Wave:** A square wave creates a tone with a more pronounced and distinct character. It contains a richer array of harmonics, resulting in a sound that is often described as 'buzzy' or 'beepy.' This makes the Morse code signals more prominent, but the added harshness can be less comfortable for the listener during prolonged exposure. Square waves are often found in simpler or older equipment where the circuitry naturally produces this type of waveform.
