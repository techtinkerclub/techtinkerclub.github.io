---
layout: single
title: "Tech Tinker Club — Pseudocode Specification (Full)"
permalink: /tools/ttc-pseudocode-spec/
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

{% include print-to-pdf.html %}



# Tech Tinker Club Pseudocode Specification v1.2 (Full Content)


## 1. Introduction

Tech Tinker Club (TTC) pseudocode is a child‑friendly, English‑like way to describe what a program does.
It is used across the club for:

- Explaining MakeCode programs in words  
- Writing quiz questions and model answers  
- Helping children progress from block coding → pseudocode → real languages like Python  
- Teacher notes, lesson plans, worksheets, and debugging discussions  

TTC pseudocode is designed specifically for **children aged 8–11**, including mixed‑ability classrooms and clubs.
Its design goals are:

### **1.1 Easy to Read**
The pseudocode must be readable aloud like normal English.  
A child should be able to look at a line and *say* what it does.

### **1.2 Mirrors MakeCode Blocks**
Every MakeCode block has a **direct equivalent** in TTC pseudocode.
This makes it ideal for explaining “what the blocks mean”.

### **1.3 Bridge to Real Programming**
The syntax intentionally resembles:

- Python  
- JavaScript  
- Pseudocode used in Schools Computing (KS2–KS3)  

But without the complexity.  
No brackets for function calls, no semicolons, no curly braces.

### **1.4 Consistent Structure**
Every block that contains other blocks has a matching END statement:

```
WHEN … DO
    ...
END WHEN
```

```
IF … THEN
    ...
END IF
```

```
REPEAT … TIMES
    ...
END REPEAT
```

This teaches children structured programming from the very beginning.

### **1.5 Safe and Unambiguous**
The language avoids symbols that confuse younger learners.
For example:

- System or sensor values always use **[square brackets]**
- Variables always use **lowercase_with_underscores**
- Keywords always use **ALL CAPS**

This makes it extremely clear what is a value, what is a variable, and what is an instruction.

### **1.6 Why Not Just Use Python?**
Because Python introduces:

- colons  
- indentation rules that break code  
- parentheses  
- imports  
- exceptions  
- complex syntax for simple tasks  

TTC pseudocode keeps things focused on **computational thinking**, not syntax problems.

### **1.7 Scope of This Document**
This specification includes:

1. All syntax rules  
2. Full commands catalogue for every MakeCode category  
3. All system values  
4. MakeCode → TTC mappings  
5. TTC → MakeCode mappings  
6. Clear style rules and guidelines for teachers  
7. Best‑practice examples  
8. Sprite/game structures for MakeCode Arcade  

This is the **authoritative reference** for Tech Tinker Club resources.

---




## 2. Syntax Rules

TTC pseudocode is intentionally simple, readable, and consistent.  
These rules define how every program, quiz answer, worksheet example, and teaching explanation should be written.

---

### 2.1 Keywords in ALL CAPS
Keywords are always written in **ALL CAPS** so they stand out clearly from variables and values.

Examples of TTC keywords:

```
WHEN, DO, END WHEN
IF, THEN, ELSE, END IF
REPEAT, END REPEAT
WHILE, END WHILE
FOREVER, END FOREVER
FUNCTION, END FUNCTION
SET, TO, CALL
MAKE, LIST, IMAGE, TILEMAP
```

Children recognise these capitalised words as “instructions to the computer”.

---

### 2.2 Variables in lowercase_with_underscores
Variables are created by the programmer and follow these rules:

- All lowercase  
- Words separated by underscores  
- No spaces  
- No capitals

Examples:

```
score
player_x
bird_y
light_threshold
speed_x
temperature_log
```

Good variable names are **short but meaningful**.

---

### 2.3 System Values in [ Square Brackets ]
System or sensor readings always appear inside **square brackets**.

Examples:

```
[button A is pressed]
[light level]
[temperature]
[acceleration x]
[sound level]
[time ms]
[received packet number]
[digital reading from P0]
```

System values are **read-only**.

Incorrect (NOT allowed):

```
set [light level] to 5     # ❌ cannot assign to system value
```

Correct:

```
SET level TO [light level]
```

This rule makes it clear to children what comes **from the micro:bit/system**, and what is a **variable they control**.

---

### 2.4 Commands Always Start With a Verb
Commands make something happen.  
They always:

- start with a verb  
- use natural English order  
- go on their own line

Examples:

```
show number score
show text "READY"
set score to 0
change life by -1
radio send number score
destroy enemy
play melody "C D E" once
```

Commands are actions.

---

### 2.5 Expressions Return Values
Expressions appear inside commands or conditions:

Examples:

```
score + 1
length of list
to_text(score)
[random number from 0 to 10]
[light level] < 50
(speed_x * 2) + 5
```

An expression never appears standalone on its own line.

---

### 2.6 Block Structures Use Explicit END Lines
Every multi-line structure must be closed clearly:

### **WHEN blocks**
```
WHEN [button A is pressed] DO
    show icon heart
END WHEN
```

### **IF blocks**
```
IF score > 10 THEN
    show icon happy
ELSE
    show icon sad
END IF
```

### **Loops**
```
REPEAT 10 TIMES
    change x of player by 1
END REPEAT
```

```
FOREVER
    show icon heart
END FOREVER
```

### **Functions**
```
FUNCTION reset_game ()
    set score to 0
    set life to 3
END FUNCTION
```

This teaches structured programming from the start.

---

### 2.7 Indentation and Layout
Inside a block:

- all inner lines are indented with **4 spaces**
- blank lines are allowed between logical steps
- one instruction per line

Example:

```
WHEN [shake gesture happens] DO
    show icon warning
    change score by 1
    pause 200 ms
END WHEN
```

Proper indentation makes code easy for both children and teachers to read.

---

### 2.8 Comments
Comments use `#` at the beginning of the line.

Examples:

```
### reset the game values
set score to 0
set life to 3
```

```
### check if the room is too dark
IF [light level] < 30 THEN
    show text "TOO DARK"
END IF
```

Comments are ignored by the “computer” but very helpful for humans.

---

### 2.9 One Purpose Per Line
Children should avoid stacking multiple actions on one line.

Bad:

```
set score to 0 show text "go"
```

Good:

```
set score to 0
show text "GO"
```

---

### 2.10 No Symbols Children Don’t Need
TTC avoids:

- semicolons  
- curly braces  
- parentheses for commands  
- complex operators  
- indent-sensitive syntax like Python  

This keeps the language predictable and accessible.

---

### 2.11 Summary of Syntax Rules
- **Keywords** → ALL CAPS  
- **Variables** → lowercase_with_underscores  
- **System values** → [brackets]  
- **Commands** → verb first, one per line  
- **Blocks** → END WHEN, END IF, END REPEAT, END FOREVER  
- **Indentation** → always indent inside blocks  
- **Expressions** → never stand alone  
- **Comments** → start with `#`  

These rules define everything that follows in the TTC pseudocode system.



## 3. Data Types & System Values

This section defines all values TTC pseudocode can work with.  
It helps children understand *what kind of thing* a variable or event represents,  
and helps teachers explain “why this goes inside [square brackets]”.

---

### 3.1 Overview of Data Types
TTC pseudocode supports the following data types:

### **3.1.1 Numbers**
Whole numbers (integers).  
Used for:

- scores  
- life  
- counters  
- pins (digital/analog)  
- sensor readings  
- sprite positions  
- velocities  
- timing  

Examples:
```
0
15
speed_x
[light level]
```

---

### **3.1.2 Text (Strings)**
Written inside double quotes `" "`.

Examples:
```
"HELLO"
"Score:"
"LEVEL " + to_text(level_number)
```

Strings can be joined (concatenated) using `+`.

---

### **3.1.3 Booleans (True/False Values)**
These come from:

- sensor checks  
- comparisons  
- system values  

Examples:
```
[button A is pressed]
score > 10
[light level] < 30
```

Booleans are **usually not written explicitly** as `true` or `false`.  
They *result* from conditions.

---

### **3.1.4 Lists (Arrays)**
Lists hold multiple values.

Examples:
```
MAKE LIST scores WITH 5, 7, 12
scores[0]
[length of scores]
```

Lists are used for:

- storing sensor logs  
- high scores  
- sets of positions  
- storing multiple sprite values (optional)

---

### **3.1.5 Images**
Images represent LED patterns (micro:bit) or Arcade images.

Examples:
```
MAKE IMAGE heart AS
    . 1 . 1 .
    1 . 1 . 1
    1 . . . 1
    . 1 . 1 .
    . . 1 . .
END IMAGE
```

or Arcade images with >5×5 grids.

---

### **3.1.6 Sprites (Arcade Only)**
Sprites represent game objects with:

- position (x, y)  
- velocity (vx, vy)  
- acceleration  
- kind (player, enemy, food, etc.)  
- image  
- optional data fields  

Example:
```
MAKE SPRITE bird OF KIND player WITH IMAGE
    ...
END IMAGE
```

---

### 3.2 System Values in TTC Pseudocode
System values are values provided automatically by the micro:bit or Arcade engine.  
They always appear in **[square brackets]**.  
They are **read-only**.

---

## **3.2.1 Input System Values**

### Buttons
```
[button A is pressed]
[button B is pressed]
[buttons A and B are pressed]
```

### Gestures
```
[shake gesture happens]
[logo touched]
[tilt left]
[tilt right]
[freefall]
```

### Pins
```
[digital reading from P0]
[analog reading from P1]
```

---

## **3.2.2 Sensor System Values**

### Light
```
[light level]
```

### Temperature
```
[temperature]
```

### Sound (micro:bit v2)
```
[sound level]
```

### Compass / Magnetometer
```
[compass heading]
```

### Accelerometer
```
[acceleration x]
[acceleration y]
[acceleration z]
```

### Gesture-specific (optional)
```
[is gesture shake]
[is gesture face up]
```

---

## **3.2.3 Timing System Values**

```
[time ms]
[running time ms]
```

These allow:

- measuring durations  
- creating timers  
- time-based events  

Example:
```
IF [time ms] > 5000 THEN
    show icon clock
END IF
```

---

## **3.2.4 Radio System Values**

When receiving radio packets:

```
[received packet number]
[received text]
[received value name]
[received value number]
[received signal strength]
[received serial number]
```

Used in:

```
WHEN [radio receives number] DO
    set score to [received packet number]
END WHEN
```

---

## **3.2.5 Serial System Values**

```
[serial data received ","]
```

Used with:

```
WHEN [serial data received "
"] DO
    SET msg TO serial read line
END WHEN
```

---

## **3.2.6 Display System Values**

```
[pixel at x y is on]
[brightness]
```

---

## **3.2.7 Game System Values (micro:bit built-in game engine)**

```
[score]
[life]
[countdown]
```

---

## **3.2.8 Arcade Sprite System Values**

For overlap events:

```
[current sprite]
[other sprite]
```

For positions:

```
[x position of sprite]
[y position of sprite]
```

---

## **3.2.9 Tilemap System Values (Arcade optional)**

```
[current tile]
```

Used inside tilemap overlap events.

---

### 3.3 Rules About System Values
### **3.3.1 They cannot be assigned**
❌ `set [light level] to 100`  
✔ `SET level TO [light level]`

### **3.3.2 They can be compared**
✔ `IF [light level] < 30 THEN`

### **3.3.3 They can appear in expressions**
✔ `set brightness to [light level] / 5`

### **3.3.4 They can appear inside events**
✔ `WHEN [button A is pressed] DO`

### **3.3.5 They look visually different from variables**
This is intentional.

---

### 3.4 Summary
System values:

- are always in **[square brackets]**  
- come from sensors, radio, serial, or game engine  
- cannot be assigned  
- can be compared  
- can be used inside expressions  
- feed into events  

Supported types:

- numbers  
- booleans  
- text (radio/serial only)  
- sprites (Arcade)  

These rules make TTC pseudocode clear, predictable, and easy to teach.



## 4. Commands Catalogue

This section lists all TTC pseudocode commands, grouped to match the categories children see in MakeCode.
For each group you get:

- The TTC pattern (how we write it in pseudocode)  
- A short description of what it does  

Mappings to exact MakeCode blocks are given later in **Section 5**.

---


### 4.1 BASIC

This section now mirrors the **Basic** category in the MakeCode toolbox as closely as possible,  
so that what you see in the editor matches what you see in this spec.

The Basic category contains two groups of blocks:

1. **Start / loop structure blocks** – `on start`, `forever`  
2. **Simple display / timing blocks** – `show number`, `show leds`, `show icon`, `show string`, `clear screen`, `pause (ms)`, `show arrow`

Some of these are also documented in more detail in other sections (LED, Images, Timing),  
but they all appear here so teachers and children can map them 1‑to‑1 with the Basic menu.

---

#### 4.1.1 Start & Loop Blocks

**on start**

MakeCode block:  
`on start`

TTC pseudocode:
```text
ON START
    ...
END ON START
```

Usage:

- Runs **once** when the program begins.
- In TTC materials, we normally just show the commands that would go inside `on start`,  
  but when you need to be explicit you can wrap them in an `ON START … END ON START` block.

You can also simply write the startup commands at the top of the pseudocode and explain in text  
that they belong in the `on start` block.

---

**forever**

MakeCode block:  
`forever`

TTC pseudocode:
```text
FOREVER
    ...
END FOREVER
```

This is the main game / program loop.  
Anything inside this block will repeat until the program stops.

(See also **4.14 TIMING** for more discussion of game loops and timing.)

---

#### 4.1.2 Display & Timing Blocks

These are the “first contact” blocks most children see in MakeCode.

**show number**

MakeCode:  
`show number 0`

TTC:
```text
show number <Expression>
```

Shows a number on the 5×5 LED display.

---

**show leds**

MakeCode:  
`show leds` (5×5 editor)

TTC:
```text
show leds
    0 0 0 0 0
    0 0 0 0 0
    0 0 0 0 0
    0 0 0 0 0
    0 0 0 0 0
end leds
```

Shows a custom 5×5 LED pattern.  
(Discussed in more depth in **4.3 LED**.)

---

**show icon**

MakeCode:  
`show icon ♥`

TTC:
```text
show icon heart
```

Shows a built‑in icon such as `heart`, `small_heart`, `happy`, `sad`, `skull`, etc.  
(See also **Images** section for icons and custom images.)

---

**show string**

MakeCode:  
`show string "Hello!"`

TTC:
```text
show text "Hello!"
```

Scrolls text across the display from right to left.

---

**clear screen**

MakeCode:  
`clear screen`

TTC:
```text
clear screen
```

Turns off all LEDs.

---

**pause (ms)**

MakeCode:  
`pause (ms) 100`

TTC:
```text
pause <Expression> ms
```

Pauses the program for a number of milliseconds.  
Used inside `on start`, `forever`, event handlers, and functions.

(See also **4.14 TIMING**.)

---

**show arrow**

MakeCode:  
`show arrow North` (or other directions)

TTC:
```text
show icon arrow_north
show icon arrow_south
show icon arrow_east
show icon arrow_west
show icon arrow_northeast
show icon arrow_northwest
show icon arrow_southeast
show icon arrow_southwest
```

These are just special cases of `show icon` with arrow icons.

---

#### 4.1.3 “More” in Basic

In the editor, the **More…** menu under Basic links to a few blocks documented elsewhere:

- `plot bar graph of X up to Y` → documented in **4.3 LED**  
- `show animation` / image sequences → covered conceptually in **4.5 IMAGES** and via repeated `show image` or `scroll image` patterns  

We do **not** add separate new TTC forms for these here; instead, we treat them as:
- `plot bar graph <Expression> up to <Expression>` (LED section)  
- repeated `show icon` / `show leds` / image‑sequence patterns (Images/LED sections)

This keeps the mapping accurate **and** avoids duplicating definitions across the spec,  
while still matching what children see in the Basic toolbox.




### 4.2 INPUT

This section mirrors the **Input** category in the MakeCode toolbox, including the **More…** submenu
and micro:bit V2‑specific blocks. All blocks appear here so teachers and children can map directly
between the editor and this specification.

Events, sensors, buttons, touch logo, and gesture blocks refer to real hardware features of the micro:bit.

Where a block corresponds to a “system value”, the full definition also appears in **Section 3.2**.

---

#### 4.2.1 INPUT EVENTS

These run when something happens.

**on button A pressed**  
```text
WHEN [button A is pressed] DO
    ...
END WHEN
```

**on button B pressed**  
```text
WHEN [button B is pressed] DO
    ...
END WHEN
```

**on shake**  
```text
WHEN [shake gesture] DO
    ...
END WHEN
```

**on pin P0 pressed**  
```text
WHEN [pin P0 is pressed] DO
    ...
END WHEN
```

**on pin P0 released**  
```text
WHEN [pin P0 is released] DO
    ...
END WHEN
```

**on loud sound** (micro:bit V2)  
```text
WHEN [loud sound] DO
    ...
END WHEN
```

**on logo pressed**  
```text
WHEN [logo is pressed] DO
    ...
END WHEN
```

---

#### 4.2.2 INPUT VALUES (Boolean + numeric)

These return a value or true/false.

**button A is pressed**  
```text
[button A is pressed]
```

**pin P0 is pressed**  
```text
[pin P0 is pressed]
```

**logo is pressed**  
```text
[logo is pressed]
```

**acceleration (mg) X/Y/Z**  
```text
[acceleration X]
[acceleration Y]
[acceleration Z]
```

**is shake gesture**  
```text
[shake gesture]
```

**light level**  
```text
[light level]
```

**sound level**  
```text
[sound level]
```

**compass heading (°)**  
```text
[compass heading]
```

**temperature (°C)**  
```text
[temperature]
```

---

#### 4.2.3 INPUT — “MORE…” submenu

Advanced hardware readings.

**calibrate compass**  
```text
calibrate compass
```

**magnetic force (µT) X/Y/Z**  
```text
[magnetic force X]
[magnetic force Y]
[magnetic force Z]
```

**rotation (°) pitch / roll / yaw**  
```text
[rotation pitch]
[rotation roll]
[rotation yaw]
```

**running time (ms)**  
```text
[runtime ms]
```

**running time (micros)**  
```text
[runtime micros]
```

**set accelerometer range (1g/2g/4g/8g)**  
```text
set accelerometer range to <value g>
```

**set loud sound threshold to <value>** (micro:bit V2)  
```text
set loud sound threshold to <number>
```

---

#### 4.2.4 CROSS‑REFERENCES

These INPUT blocks correspond to system values defined in **Section 3.2 SYSTEM VALUES**:

- `[light level]`
- `[temperature]`
- `[acceleration X/Y/Z]`
- `[magnetic force X/Y/Z]`
- `[rotation pitch/roll/yaw]`
- `[runtime ms]`, `[runtime micros]`
- `[sound level]`
- `[compass heading]`

See Section 3.2 for detailed semantics, ranges, and sensor notes.






### 4.3 MUSIC

This section mirrors the **Music** category in the MakeCode toolbox,  
including melody, tone, volume, tempo, advanced melody blocks, and micro:bit V2 sound features.

---

#### 4.4.1 Melody

**play melody … at tempo … until done / in background**

MakeCode:  
`play melody ♫ at tempo 120 (bpm) until done`  
(or `in background` via dropdown)

TTC:
```text
play melody "<pattern>" once
play melody "<pattern>" until done
play melody "<pattern>" in background
```

Where `<pattern>` is the melody pattern selected in the editor.

For simple TTC use, we usually write:
```text
play melody "<pattern>" once
```

---

#### 4.4.2 Tone

**play tone for beats**

MakeCode:  
`play tone Middle C for 1 beat until done`

TTC:
```text
play tone C4 for 1 beat
play tone <frequency> Hz for <beats> beat
```

---

**ring tone**

MakeCode:  
`ring tone (Hz) Middle C`

TTC:
```text
start tone C4
start tone <frequency> Hz
```
(Conceptually: start a continuous tone until stopped.)

---

**rest**

MakeCode:  
`rest for 1 beat`

TTC:
```text
rest <beats> beat
```

---

#### 4.4.3 Volume

**set volume**

MakeCode:  
`set volume 127`

TTC:
```text
set volume to <Expression>
```

---

**volume (value)**

MakeCode:  
`volume` (reporter block)

TTC:
```text
[volume]
```

---

**stop all sounds**

MakeCode:  
`stop all sounds`

TTC:
```text
stop all sounds
```

Stops tones, melodies, and sound effects.

---

#### 4.4.4 Tempo

**change tempo by (bpm)**

MakeCode:  
`change tempo by (bpm) 20`

TTC:
```text
change tempo by <bpm>
```

---

**set tempo to (bpm)**

MakeCode:  
`set tempo to (bpm) 120`

TTC:
```text
set tempo to <bpm>
```

---

**1 beat (ms)**

MakeCode:  
`1 beat (ms)` (value block)

TTC:
```text
[beat ms]
```

---

**tempo (bpm)**

MakeCode:  
`tempo (bpm)` (value block)

TTC:
```text
[tempo bpm]
```

---

#### 4.4.5 Melody Advanced

**play melody … in background**

MakeCode:  
`play melody dadadum in background`

TTC:
```text
play melody "<pattern>" in background
```
(Alternative spelling of 4.4.1’s in-background form.)

---

**stop melody**

MakeCode:  
`stop melody all`

TTC:
```text
stop melody
stop melody all
```

---

**on melody note played** (event)

MakeCode:  
`on melody note played`

TTC:
```text
WHEN [melody note played] DO
    ...
END WHEN
```

Inside this event, the note/length can be obtained via MakeCode’s parameters;
in TTC we normally describe behaviour in words rather than exposing full parameters.

---

#### 4.4.6 micro:bit V2 Sound Effects

These appear under the “micro:bit (V2)” grouping inside Music.

**play sound <effect> until done**

MakeCode:  
`play giggle until done`

TTC:
```text
play sound giggle until done
play sound <effect_name> until done
```

---

**play sound <effect>**

MakeCode:  
`play giggle` (non-blocking)

TTC:
```text
play sound giggle
play sound <effect_name>
```

---

**play (icon waveform) until done**

MakeCode (sound expression):

This represents a **sound expression** or custom sound expression block.  
TTC (general form):
```text
play sound <expression> until done
play sound <expression>
```
(Teachers can describe this in words; TTC does not attempt to encode the sound-expression DSL.)

---

**sound is playing** (boolean)

MakeCode:  
`sound is playing`

TTC:
```text
[sound is playing]
```

---

**set built-in speaker on/off**

MakeCode:  
`set built-in speaker OFF` (or `ON`)

TTC:
```text
set built_in_speaker to on
set built_in_speaker to off
```

Enables or disables the on-board V2 speaker. Headphone output still works if wired.

---

#### 4.4.7 Cross-References

Music uses these system values and concepts from elsewhere in the spec:

- `[volume]`, `[beat ms]`, `[tempo bpm]` — see **3.2 System Values**  
- `[sound level]` from the Input category (micro:bit V2 microphone) — see **4.2 INPUT**  
- Timing with `pause` / game loops — see **4.14 TIMING**



### 4.4 LED

This section mirrors the **Led** category in the MakeCode toolbox, including the **More…** submenu.
It contains all blocks that work directly with the 5×5 LED grid.

Blocks like `show number`, `show string`, `show icon` and `show leds` live in **4.1 BASIC**  
because that is where they appear in the toolbox.

---

#### 4.3.1 Main LED Blocks

**plot x y**

MakeCode:  
`plot x 0 y 0`

TTC:
```text
plot <x> <y>
```
Turns ON the LED at column `<x>`, row `<y>`.

---

**toggle x y**

MakeCode:  
`toggle x 0 y 0`

TTC:
```text
toggle <x> <y>
```
If the LED at (x, y) is ON, turn it OFF. If it is OFF, turn it ON.

---

**unplot x y**

MakeCode:  
`unplot x 0 y 0`

TTC:
```text
unplot <x> <y>
```
Turns OFF the LED at (x, y).

---

**point x y** (query)

MakeCode:  
`point x 0 y 0`  (value block)

TTC:
```text
[pixel at <x> <y> is on]
```
Returns true if the LED at (x, y) is ON, otherwise false.

---

**plot bar graph of value up to max**

MakeCode:  
`plot bar graph of 0 up to 0`

TTC:
```text
plot bar graph <value> up to <max_value>
```
Displays a vertical bar proportional to `<value>`, scaled against `<max_value>`.

---

#### 4.3.2 LED → More… Blocks

These appear when you tap **More…** in the Led category.

**plot x y brightness b**

MakeCode:  
`plot x 0 y 0 brightness 255`

TTC:
```text
plot <x> <y> brightness <brightness_value>
```
Turns ON the LED at (x, y) with the given brightness (0–255).

---

**point x y brightness b** (query)

MakeCode:  
`point x 0 y 0 brightness 255`

TTC:
```text
[brightness of pixel <x> <y>]
```
Returns the brightness of the LED at (x, y) as a number from 0 to 255.

---

**brightness** (global)

MakeCode:  
`brightness`  (value block)

TTC:
```text
[brightness]
```
Current global display brightness level.

---

**set brightness b**

MakeCode:  
`set brightness 255`

TTC:
```text
set brightness <Expression>
```
Sets the global brightness level for all LEDs (0–255).

---

**led enable on/off**

MakeCode:  
`led enable false`

TTC:
```text
set display enabled to off
set display enabled to on
```
Turns the LED display as a whole on or off (useful for power saving).

---

**stop animation**

MakeCode:  
`stop animation`

TTC:
```text
stop animation
```
Stops any running LED animation (including scrolling text).

---

**set display mode**

MakeCode:  
`set display mode black and white` (or greyscale)

TTC:
```text
set display mode to black_and_white
set display mode to greyscale
```
Changes how the micro:bit renders brightness levels.

---

#### 4.3.3 Cross-References

The following are system values also described in **Section 3.2**:

- `[pixel at <x> <y> is on]`
- `[brightness]`
- `[brightness of pixel <x> <y>]`

For high-level display effects (`show number`, `show text`, `show icon`, `show leds`),  
see **4.1 BASIC**.




### 4.5 RADIO

This section mirrors the **Radio** category in the MakeCode toolbox,  
including the **More…** submenu.

Radio allows micro:bits to send and receive messages wirelessly.

---

#### 4.7.1 Group

**radio set group 1**

MakeCode:
`radio set group 1`

TTC:
```text
set radio group to <number>
```

All micro:bits that should talk to each other must use the same group number (0–255).

---

#### 4.7.2 Send

**radio send number 0**

MakeCode:
`radio send number 0`

TTC:
```text
radio send number <Expression>
```

---

**radio send value "name" = 0**

MakeCode:
`radio send value "name" = 0`

TTC:
```text
radio send value "<name>" = <Expression>
```

Sends a *tagged* value. The receiver can read both the name and the number.

---

**radio send string ""**

MakeCode:
`radio send string ""`

TTC:
```text
radio send text "<message>"
```

---

#### 4.7.3 Receive

**on radio received receivedNumber**

MakeCode:
`on radio received receivedNumber`

TTC:
```text
WHEN [radio receives number] DO
    ...
END WHEN
```

Inside this event, use:

```text
[received packet number]
```

to refer to the number.

---

**on radio received name value**

MakeCode:
`on radio received name value`

TTC:
```text
WHEN [radio receives value] DO
    ...
END WHEN
```

Inside this event, use:

```text
[received value name]
[received value number]
```

---

**on radio received receivedString**

MakeCode:
`on radio received receivedString`

TTC:
```text
WHEN [radio receives text] DO
    ...
END WHEN
```

Inside this event, use:

```text
[received text]
```

---

**received packet signal strength**

MakeCode (value block at bottom of Radio category):
`received packet signal strength`

TTC:
```text
[received signal strength]
```

Gives the strength of the last received message (RSSI value).

---

#### 4.7.4 Radio → More… (advanced)

These appear under **More…** in the Radio category.

**radio set transmit power 7**

MakeCode:
`radio set transmit power 7`

TTC:
```text
set radio transmit power to <level>
```

(Usually 0–7; higher values increase range but use more power.)

---

**radio set transmit serial number true/false**

MakeCode:
`radio set transmit serial number true`

TTC:
```text
set radio transmit serial number on
set radio transmit serial number off
```

When ON, the sender includes its serial number in packets.

---

**radio set frequency band 0**

MakeCode:
`radio set frequency band 0`

TTC:
```text
set radio frequency band to <band_number>
```

Sets which 2.4 GHz band is used (normally left at 0 for class projects).

---

**radio raise event from source … with value …**

MakeCode:
`radio raise event from source … with value …`

TTC:
```text
radio raise event from <source> with value <value>
```

This is an advanced feature used together with event handlers in the Control/Advanced API.  
For most KS2 activities you can ignore it; we keep it here for completeness.

---

#### 4.7.5 System Values (summary)

While handling radio packets, these system values are available:

- `[received packet number]`      – the number sent by `radio send number`
- `[received text]`              – the string sent by `radio send string`
- `[received value name]`        – the name/tag from `radio send value`
- `[received value number]`      – the number from `radio send value`
- `[received signal strength]`   – strength of last received packet
- `[received serial number]`     – serial number of the sender (if enabled)

See **Section 3.2 System Values** for more detailed notes on ranges and behaviour.



### 4.6 BLUETOOTH

Mainly for older learners or projects with phones/tablets.

**Services**

- `enable bluetooth uart service`  
- `enable bluetooth accelerometer service`  
- `enable bluetooth magnetometer service`  
- `enable bluetooth button service`  
- `enable bluetooth io pin service`  
- `enable bluetooth led service`  
- `enable bluetooth temperature service`  
- `enable bluetooth event service`

**Advertising**

- `bluetooth advertise url <StringExpression>`  
- `bluetooth advertise uid <StringExpression>`  
- `bluetooth stop advertising`

**State / UART (Optional)**

- `[bluetooth connected]`  
- `bluetooth uart write <StringExpression>`  
- `SET msg TO bluetooth uart read until <StringExpression>`

---



### 4.7 LOOPS

This section mirrors the **Loops** category in the MakeCode toolbox.
These blocks control repetition and timed actions.

`FOREVER` is documented in **4.1 BASIC**, because that is where it appears in the toolbox.

---

#### 4.17.1 Repeat N Times

MakeCode:  
`repeat 4 times do`

TTC:
```text
REPEAT <count> TIMES
    ...
END REPEAT
```

Runs the inner code a fixed number of times.

---

#### 4.17.2 While Loop

MakeCode:  
`while <condition> do`

TTC:
```text
WHILE <condition> DO
    ...
END WHILE
```

Keeps repeating while the condition is true.

---

#### 4.17.3 For Index From A to B

MakeCode:  
`for index from 0 to 4 do`

TTC:
```text
FOR index FROM <start> TO <end> DO
    ...
END FOR
```

`index` is a loop variable that counts from `<start>` to `<end>` inclusive.

---

#### 4.17.4 For Element of List

MakeCode:  
`for element value of list do`

TTC:
```text
FOR EACH element IN <list_name> DO
    ...
END FOR
```

Inside the loop, `element` holds each value from the list in turn.

(See **4.12 ARRAYS / LISTS** for more details on lists.)

---

#### 4.17.5 Every X ms

MakeCode:  
`every 500 ms do`

TTC:
```text
EVERY <time_ms> ms DO
    ...
END EVERY
```

Runs the inner code repeatedly, waiting `<time_ms>` milliseconds between runs.
This is effectively a timed loop.

(Closely related to `FOREVER` and `pause` in **4.1 BASIC** and timing notes in **4.14 TIMING**.)

---

#### 4.17.6 Break and Continue

MakeCode:  
`break` and `continue` (inside loops)

TTC:

```text
BREAK
```
Exits the nearest enclosing loop immediately.

```text
CONTINUE
```
Skips the rest of the current loop cycle and jumps to the next iteration.

These are advanced features and are not normally used with younger KS2 learners,
but are included here for completeness.




### 4.8 LOGIC

This section mirrors the **Logic** category in the MakeCode toolbox.

It covers:

- IF / IF–ELSE blocks (structure)
- Comparison operators ( =, <, > )
- Boolean operators (AND, OR, NOT)
- Boolean constants (true, false)

The same operators are also listed in **4.16 MATHS FUNCTIONS**,  
because they behave like normal expressions.

---

#### 4.18.1 IF and IF–ELSE

MakeCode:
- `if <condition> then`
- `if <condition> then … else`

TTC:

```text
IF <condition> THEN
    ...
END IF
```

```text
IF <condition> THEN
    ...
ELSE
    ...
END IF
```

You can nest IF blocks inside other IFs or loops, as long as each one has a matching `END IF`.

---

#### 4.18.2 Comparison Operators

MakeCode (Comparison section):

- `0 = 0`
- `0 < 0`
- `0 > 0`

TTC uses a full set of comparisons:

```text
<Expression> = <Expression>
<Expression> < <Expression>
<Expression> > <Expression>
<Expression> <= <Expression>
<Expression> >= <Expression>
<Expression> != <Expression>
```

These are used inside conditions, for example:

```text
IF score > 10 THEN
    show icon happy
END IF
```

(See **4.16 MATHS FUNCTIONS – D) Comparison Operators**.)

---

#### 4.18.3 Boolean Operators

MakeCode (Boolean section):

- `and`
- `or`
- `not`

TTC:

```text
<condition> AND <condition>
<condition> OR <condition>
NOT <condition>
```

Examples:

```text
IF score > 5 AND life > 0 THEN
    ...
END IF
```

```text
IF NOT [button A is pressed] THEN
    ...
END IF
```

(Also listed in **4.16 MATHS FUNCTIONS – E) Boolean Operators**.)

---

#### 4.18.4 Boolean Constants

MakeCode:

- `true`
- `false`

TTC:

```text
TRUE
FALSE
```

These are rarely needed in KS2 projects but can be useful for flags in more advanced work:

```text
SET game_over TO FALSE

IF life = 0 THEN
    SET game_over TO TRUE
END IF
```


## 5A. MakeCode → TTC Pseudocode  
This section gives the **direct mapping** from MakeCode blocks to TTC pseudocode.  
It is written for instructors who need to explain MakeCode code in plain English,  
create quiz answers, or prepare worksheets.

All mappings are grouped by MakeCode category.

---

### 5A.1 BASIC
### **show number**
MakeCode block:  
`show number 0`  
TTC:  
`show number <Expression>`

---

### **show string / show text**
MakeCode:  
`show string "Hello!"`  
TTC:  
`show text "Hello!"`

---

### **show icon**
MakeCode:  
`show icon IconNames.Heart`  
TTC:  
`show icon heart`

---

### **show leds**
MakeCode:  
Custom LED grid (5×5)  
TTC:
```
show leds
    0 1 0 1 0
    ...
end leds
```

---

### **pause**
MakeCode:  
`pause (ms)`  
TTC:  
`pause <Expression> ms`

---

### **forever**
MakeCode:  
`forever:`  
TTC:
```
FOREVER
    ...
END FOREVER
```

---

### 5A.2 INPUT
### **on button pressed**
MakeCode:  
`on button A pressed`  
TTC:
```
WHEN [button A is pressed] DO
    ...
END WHEN
```

---

### **button is pressed (value)**
MakeCode:  
`button A is pressed`  
TTC:  
`[button A is pressed]`

---

### **on shake / gesture**
MakeCode:  
`on shake`  
TTC:
```
WHEN [shake gesture happens] DO
    ...
END WHEN
```

---

### **acceleration / tilt**
MakeCode:  
`acceleration (mg)`  
TTC:  
`[acceleration x]`, `[acceleration y]`, `[acceleration z]`

---

### **light level**
MakeCode:  
`light level`  
TTC:  
`[light level]`

---

### **temperature**
MakeCode:  
`temperature`  
TTC:  
`[temperature]`

---

### 5A.3 LED
### **plot**
MakeCode:  
`plot x y`  
TTC:  
`plot <x> <y>`

---

### **unplot**
MakeCode:  
`unplot x y`  
TTC:  
`unplot <x> <y>`

---

### **toggle**
MakeCode:  
`toggle x y`  
TTC:  
`toggle <x> <y>`

---

### **brightness**
MakeCode:  
`set brightness 128`  
TTC:  
`set brightness <Expression>`

MakeCode:  
`brightness`  
TTC:  
`[brightness]`

---

### **bar graph**
MakeCode:  
`plot bar graph of X up to Y`  
TTC:  
`plot bar graph <Expression> up to <Expression>`

---

### 5A.4 MUSIC
### **play tone**
MakeCode:  
`play tone Middle C for 1 beat`  
TTC:  
`play tone C4 for 1 beat`

---

### **play tone Hz**
MakeCode:  
`play tone 440 for 1 beat`  
TTC:  
`play tone 440 Hz for 1 beat`

---

### **melody**
MakeCode:  
`play melody "C D E" once`  
TTC:  
`play melody "C D E" once`

MakeCode:  
`start melody repeating`  
TTC:  
`loop melody "..."`

---

### **tempo**
MakeCode:  
`set tempo 120 bpm`  
TTC:  
`set tempo to 120 bpm`

---

### **volume (v2)**
MakeCode:  
`set volume 100`  
TTC:  
`set volume to 100`

---

### 5A.5 IMAGES
### **show icon**
Matches Basic section:
`show icon heart`

---

### **scroll image**
MakeCode:  
`scroll image myImage at 200 ms`  
TTC:  
`scroll image myImage at speed 200`

---

### **show image at offset**
MakeCode:  
`show image myImage offset 2`  
TTC:  
`show image myImage at offset 2`

---

### **create image**
MakeCode:  
`images.createImage("...")`  
TTC:
```
MAKE IMAGE name AS
    ...
END IMAGE
```

---

### 5A.6 GAME
### **score**
MakeCode:  
`set score 0`  
→ `set score to 0`

`change score by 1`  
→ `change score by 1`

`score` (reporter)  
→ `[score]`

---

### **life**
`set life 3` → `set life to 3`  
`change life by -1` → `change life by -1`  
`life` → `[life]`

---

### **countdown**
`start countdown 10`  
→ `start countdown 10 s`

`countdown`  
→ `[countdown]`

---

### **game over**
`game over` → `game over`  
`game over(true)` → `game over with win`  
`game over(false)` → `game over with lose`

---

### 5A.7 RADIO
### **set group**
MakeCode:  
`radio.setGroup(1)`  
TTC:  
`set radio group to 1`

---

### **send number**
`radio.sendNumber(5)`  
→ `radio send number 5`

### **send string**
`radio.sendString("hi")`  
→ `radio send text "hi"`

### **on received number**
MakeCode:
```
radio.onReceivedNumber(function (receivedNumber) {
    ...
})
```
TTC:
```
WHEN [radio receives number] DO
    ...
END WHEN
```

**System values:**

MakeCode: `receivedNumber`  
TTC: `[received packet number]`

---

### 5A.8 PINS
### **digital write**
`pins.digitalWritePin(P0, 1)`  
→ `set digital pin P0 to 1`

### **digital read**
`pins.digitalReadPin(P1)`  
→ `[digital reading from P1]`

---

### **analog write**
`pins.analogWritePin(P0, 1023)`  
→ `set analog pin P0 to 1023`

### **analog read**
`pins.analogReadPin(P2)`  
→ `[analog reading from P2]`

---

### **servo**
`pins.servoWritePin(P1, 90)`  
→ `set servo P1 angle to 90`

---

### 5A.9 SERIAL
### **serial write**
`serial.writeLine("hello")`  
→ `serial write line "hello"`

---

### **serial read**
`serial.readLine()`  
→ `SET variable TO serial read line`

---

### **on data received**
MakeCode:
```
serial.onDataReceived("
", function () { ... })
```
TTC:
```
WHEN [serial data received "
"] DO
    ...
END WHEN
```

---

### 5A.10 BLUETOOTH
Exact mapping depends on services enabled; core examples:

`bluetooth.startUartService()`  
→ `enable bluetooth uart service`

`bluetooth.connected()`  
→ `[bluetooth connected]`

---

### 5A.11 TEXT (STRINGS)
### **join text**
MakeCode:  
`"Score:" + score`  
TTC:  
`"Score:" + to_text(score)`

---

### **length of**
MakeCode:  
`text.length`  
TTC:  
`[length of text]`

---

### 5A.12 LISTS / ARRAYS
### **create list**
MakeCode:
`let list = [1, 2, 3]`  
TTC:
`MAKE LIST list WITH 1, 2, 3`

---

### **push**
MakeCode:  
`list.push(5)`  
TTC:  
`append 5 TO list`

---

### **get item**
MakeCode:  
`list[0]`  
TTC:  
`list[0]`

---

### **set item**
MakeCode:
`list[1] = 10`  
TTC:  
`SET list[1] TO 10`

---

### **length**
MakeCode:
`list.length`  
TTC:
`[length of list]`

---

### 5A.13 SPRITES
### **create sprite**
MakeCode:
```
sprites.create(img`
    ...
`, SpriteKind.Player)
```
TTC:
```
MAKE SPRITE mySprite OF KIND player WITH IMAGE
    ...
END IMAGE
```

---

### **set position**
`sprite.x = 50`  
→ `set x of sprite to 50`

`sprite.y = 80`  
→ `set y of sprite to 80`

---

### **change velocity**
`sprite.vx = 50` → `set vx of sprite to 50`  
`sprite.vy = -20` → `set vy of sprite to -20`

---

### **overlaps**
MakeCode:
```
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, ...)
```
TTC:
```
WHEN player overlaps enemy DO
    ...
END WHEN
```

**System values:**

`otherSprite` → `[other sprite]`  
`sprite` → `[current sprite]`

---

### 5A.14 TILEMAP (Arcade)
### **on tile overlap**
MakeCode:
```
scene.onOverlapTile(sprite, tile, function() {})
```

TTC:
```
WHEN <sprite kind> overlaps <tile> DO
    ...
END WHEN
```

### **tilemap system values**
`location` → `[current tile]`

---

### 5A.15 ADVANCED
### **bitwise**
MakeCode:  
`bitwise AND`, `OR`, etc.  
TTC:
`bit_and(a, b)`, `bit_or(a, b)`, etc.

---

### **raise event**
MakeCode:
```
control.raiseEvent(100, 7)
```
TTC:
`raise event 100 value 7`

---

### **background**
MakeCode:
```
control.inBackground(function(){ ... })
```
TTC:
```
IN BACKGROUND
    ...
END BACKGROUND
```

---

This completes **all mappings from MakeCode → TTC pseudocode**.



### 5B. TTC Pseudocode → MakeCode  
This section gives the **reverse mapping**:  
Given a TTC pseudocode line (used in quizzes, examples, worksheets),  
which **exact MakeCode block** does it correspond to?

This helps with:
- marking answers
- generating MakeCode examples from TTC lessons
- debugging code written in TTC
- building automatic converters later

Mappings are grouped by category.

---

### 5B.1 BASIC
### **show number**
TTC:
```
show number score
```
MakeCode:  
**Basic → show number (0)**  
(value replaced with `score`)

---

### **show text**
TTC:
```
show text "HELLO"
```
MakeCode:  
**Basic → show string "HELLO"**

---

### **show icon**
TTC:
```
show icon heart
```
MakeCode:  
**Basic → show icon Heart**

---

### **custom LED image**
TTC:
```
show leds
    ...
end leds
```
MakeCode:  
**Basic → show leds** (5×5 editor)

---

### **pause**
TTC:
```
pause 200 ms
```
MakeCode:  
**Basic → pause (ms)**

---

### **FOREVER**
TTC:
```
FOREVER
    ...
END FOREVER
```
MakeCode:  
**Basic → forever** (loop)

---

### 5B.2 INPUT
### **WHEN button**
TTC:
```
WHEN [button A is pressed] DO
    ...
END WHEN
```
MakeCode:  
**Input → on button A pressed**

---

### **WHEN shake**
TTC:
```
WHEN [shake gesture happens] DO
```
MakeCode:  
**Input → on shake**

---

### **System values**
TTC:
`[light level]`  
→ MakeCode: **Input → light level**

TTC:
`[temperature]`  
→ MakeCode: **Input → temperature**

TTC:
`[acceleration x]`  
→ MakeCode: **Input → acceleration (mg)**

TTC:
`[time ms]`  
→ MakeCode: **Input → running time (ms)**

---

### 5B.3 LED
### **plot**
TTC:
```
plot 2 3
```
MakeCode:  
**LED → plot (x, y)**

---

### **unplot**
```
unplot 4 0
```
MakeCode:  
**LED → unplot (x, y)**

---

### **toggle**
```
toggle 1 1
```
MakeCode:  
**LED → toggle (x, y)**

---

### **set brightness**
```
set brightness 180
```
MakeCode:  
**LED → set brightness 0–255**

---

### **bar graph**
```
plot bar graph value up to max
```
MakeCode:  
**LED → plot bar graph of value up to max**

---

### 5B.4 MUSIC
### **play tone**
```
play tone C4 for 1 beat
```
MakeCode:  
**Music → play tone Middle C for 1 beat**

---

### **play frequency tone**
```
play tone 440 Hz for 1 beat
```
MakeCode:  
**Music → play tone 440 for 1 beat**

---

### **melody**
```
play melody "C D E" once
```
→ **Music → play melody "C D E" once**

```
loop melody "C D E"
```
→ **Music → start melody "C D E" repeating**

---

### **tempo**
```
set tempo to 120 bpm
```
→ MakeCode: **Music → set tempo 120 bpm**

---

### **volume (v2)**
```
set volume to 100
```
→ MakeCode: **Music → set volume 100**

---

### 5B.5 IMAGES
### **show big image / scroll**
```
scroll image mountain at speed 200
```
→ **Images → scroll image at ms**

---

### **show image offset**
```
show image banner at offset 2
```
→ **Images → show image offset 2**

---

### **custom image creation**
```
MAKE IMAGE heart AS
    ...
END IMAGE
```

The corresponding MakeCode is produced by:
**Images → create image (code editor panel)**  
(identical layout)

---

### 5B.6 GAME
### **score**
```
set score to 0
```
→ **Game → set score 0**

```
change score by 1
```
→ **Game → change score by 1**

```
[score]
```
→ **Game → score**

---

### **life**
Same mapping:
```
set life to 3
change life by -1
[life]
```

---

### **countdown**
```
start countdown 10 s
```
→ **Game → start countdown 10**

```
[countdown]
```
→ **Game → countdown**

---

### **game over**
```
game over
```
→ **Game → game over**

```
game over with win
```
→ **Game → game over(true)**

---

### 5B.7 RADIO
### **set group**
```
set radio group to 5
```
→ **Radio → set group 5**

---

### **send**
```
radio send number score
```
→ **Radio → send number score**

```
radio send text "hi"
```
→ **Radio → send string "hi"**

---

### **receive events**
```
WHEN [radio receives number] DO
```
→ **Radio → on received number**

System value:
`[received packet number]`  
→ MakeCode variable `receivedNumber`

---

### 5B.8 PINS
### **digital write**
```
set digital pin P1 to 1
```
→ **Pins → digital write pin P1 to 1**

---

### **digital read**
```
[digital reading from P1]
```
→ **Pins → digital read pin P1**

---

### **analog write**
```
set analog pin P0 to 1023
```
→ **Pins → analog write P0**

---

### **servo**
```
set servo P2 angle to 90
```
→ **Pins → servo write P2 to 90°**

---

### 5B.9 SERIAL
### **write**
```
serial write line "hello"
```
→ **Serial → write line "hello"**

```
serial write number score
```
→ **Serial → write number**

---

### **read**
```
SET msg TO serial read line
```
→ **Serial → read line**

---

### **event**
```
WHEN [serial data received "
"] DO
```
→ **Serial → on data received "
"**

---

### 5B.10 BLUETOOTH
### **uart service**
```
enable bluetooth uart service
```
→ **Bluetooth → start UART service**

---

### **connected**
```
[bluetooth connected]
```
→ **Bluetooth → bluetooth.connected()**

---

### 5B.11 TEXT
### **join text**
```
"Score: " + to_text(score)
```
→ **Text → join blocks** or **Arithmetic → text join**

---

### **length**
```
[length of name]
```
→ **Text → length of text**

---

### **substr / index**
Direct equivalents exist in **Text → substring**, **Text → char at**.

---

### 5B.12 LISTS
### **make list**
```
MAKE LIST nums WITH 1, 2, 3
```
→ **Arrays → create list with [1,2,3]**

---

### **append**
```
append 5 TO nums
```
→ **Arrays → list push 5**

---

### **get/set item**
```
nums[1]
```
→ **Arrays → get value at index**

```
SET nums[1] TO 10
```
→ **Arrays → set value at index**

---

### **length**
```
[length of nums]
```
→ **Arrays → length of list**

---

### 5B.13 SPRITES (Arcade)
### **create sprite**
```
MAKE SPRITE bird OF KIND player WITH IMAGE
    ...
END IMAGE
```
→ **Sprites → create sprite of kind Player**

---

### **movement**
```
set vx of bird to 30
```
→ **Sprites → set velocity (vx)**

```
change y of bird by -3
```
→ **Sprites → change Y by**

---

### **overlap event**
```
WHEN player overlaps enemy DO
```
→ **Sprites → on overlap SpriteKind.Player with SpriteKind.Enemy**

System values:
`[current sprite]` and `[other sprite]` map to the event parameters.

---

### **projectile**
```
MAKE PROJECTILE p FROM bird WITH VELOCITY 50, 0 WITH IMAGE
```
→ **Sprites → projectile from sprite with vx, vy**

---

### **flags**
```
set stay_in_screen of bird to on
```
→ **Sprites → set stay in screen true**

---

### 5B.14 TILEMAP (Arcade)
```
WHEN player overlaps tile grass DO
```
→ **Scene → on overlap tile**

```
[current tile]
```
→ MakeCode: **location** value from tilemap

---

### 5B.15 ADVANCED
### **background**
```
IN BACKGROUND
    ...
END BACKGROUND
```
→ **Loops → in background**

---

### **raise event**
```
raise event 5 value 9
```
→ **Control → raise event**

---

### **debug / log**
```
log data "temp" = temperature
```
→ **Datalogger → log data**

---

This completes the full **TTC → MakeCode** mapping.

### 4.9 VARIABLES

This section mirrors the **Variables** category in the MakeCode toolbox.

MakeCode automatically creates variable getter/setter blocks when you make a new variable.

---

#### 4.9.1 Set Variable

MakeCode:
`set score to 0`

TTC:
```text
SET <variable_name> TO <Expression>
```

---

#### 4.9.2 Change Variable

MakeCode:
`change score by 1`

TTC:
```text
CHANGE <variable_name> BY <Expression>
```

---

#### 4.9.3 Read Variable

MakeCode:
`score` (oval block)

TTC simply uses the variable name as an expression:

```text
score
lives
temperature_reading
```

See also **Section 2.4 – Variable Names and Types** for naming rules and examples.


### 4.10 MATHS

This section mirrors the **Math** category in the MakeCode toolbox,
and then adds a few optional advanced functions that are available in JavaScript / Python
but do not appear as blocks by default.

Everything here is written in TTC pseudocode style.

---

#### 4.16.1 Basic Arithmetic

MakeCode:
- `0 + 0`
- `0 - 0`
- `0 × 0`
- `0 ÷ 0`

TTC:
```text
<Expression> + <Expression>
<Expression> - <Expression>
<Expression> * <Expression>
<Expression> / <Expression>
```

These can be used anywhere a number expression is allowed.

---

#### 4.16.2 Remainder (Modulo)

MakeCode:
- `remainder of 0 / 1`

TTC:
```text
remainder of <Expression> divided by <Expression>
```

Example:
```text
SET r TO remainder of score divided by 5
```

This is the same idea as “modulo” in many languages.

---

#### 4.16.3 Min and Max

MakeCode:
- `min of 0 and 0`
- `max of 0 and 0`

TTC:
```text
min of <Expression> and <Expression>
max of <Expression> and <Expression>
```

---

#### 4.16.4 Absolute Value

MakeCode:
- `absolute of 0`

TTC:
```text
absolute of <Expression>
```

---

#### 4.16.5 Square Root

MakeCode:
- `square root 0`

TTC:
```text
square root of <Expression>
```

---

#### 4.16.6 Rounding

MakeCode:
- `round 0`

TTC:
```text
round <Expression>
```

(Optionally, TTC also supports the extra rounding forms below, which do not
appear as separate blocks in the toolbox but match JavaScript/Python concepts:)

```text
floor <Expression>
ceiling <Expression>
truncate <Expression>
```

Use these only in more advanced KS2/KS3 work.

---

#### 4.16.7 Random Integer

MakeCode:
- `pick random 0 to 10`

TTC:
```text
[random number from <low> to <high>]
```

Example:
```text
SET dice TO [random number from 1 to 6]
```

---

#### 4.16.8 Constrain / Clamp

MakeCode:
- `constrain 0 between 0 and 0`

TTC:
```text
constrain <value> between <low> and <high>
```

This forces `<value>` to stay between `<low>` and `<high>`:

- if `<value>` is less than `<low>`, the result is `<low>`
- if `<value>` is greater than `<high>`, the result is `<high>`
- otherwise, the result is `<value>` itself

In more mathematical language this is sometimes called *clamp*.

---

#### 4.16.9 Map from One Range to Another

MakeCode:
- `map 0 from low 0 high 1023 to low 0 high 4`

TTC:
```text
map <value> from <low1> to <high1> into <low2> to <high2>
```

Example:
```text
SET level TO map [light level] from 0 to 255 into 0 to 4
```

This rescales `<value>` from the first range to the second range.

---

#### 4.16.10 Random True or False

MakeCode:
- `pick random true or false`

TTC:
```text
[random true or false]
```

Returns either TRUE or FALSE at random.

Example:
```text
IF [random true or false] THEN
    show icon happy
ELSE
    show icon sad
END IF
```

---

#### 4.16.11 Constants

MakeCode:
- `π` (pi) drop-down value

TTC:
```text
pi
```

TTC also allows one extra constant that does not appear as a block:

```text
e
```

Use `pi` for circle/angle calculations and `e` only in advanced maths contexts.

---

#### 4.16.12 Comparisons (from Logic)

The Logic toolbox shows the comparison shapes:

- `=`, `<`, `>`

TTC supports the full family:

```text
<Expression> = <Expression>
<Expression> < <Expression>
<Expression> > <Expression>
<Expression> <= <Expression>
<Expression> >= <Expression>
<Expression> != <Expression>
```

These are used in conditions, for example:

```text
IF score > 10 THEN
    show icon happy
END IF
```

(See also **4.18 LOGIC**.)

---

#### 4.16.13 Boolean Operators

The Logic toolbox also contains the boolean operators:

- `and`, `or`, `not`

TTC:
```text
<condition> AND <condition>
<condition> OR <condition>
NOT <condition>
```

(See also **4.18 LOGIC**.)

---

#### 4.16.14 Optional Advanced Functions (not blocks, but allowed)

These functions do **not** appear as blocks in the Math toolbox, but they are
valid concepts taken from JavaScript/Python and may be useful for older learners.

You may use them in TTC pseudocode when needed:

```text
<Expression> to the power of <Expression>   # exponent / pow
sine of <Expression>                        # trig functions
cosine of <Expression>
tangent of <Expression>
arcsine of <Expression>
arccosine of <Expression>
arctangent of <Expression>
```

All trig functions assume the angle is in degrees unless a note says otherwise.



### 4.11 FUNCTIONS

This section mirrors the **Functions** category in the MakeCode toolbox.

Functions let you group blocks into a reusable named mini‑program.

---

#### 4.11.1 Defining a Function

MakeCode:
`function doSomething ()`

TTC:
```text
DEFINE FUNCTION <function_name>(optional_parameters...)
    ...
END FUNCTION
```

For KS2 we normally use functions without parameters:

```text
DEFINE FUNCTION flash_animation()
    ...
END FUNCTION
```

---

#### 4.11.2 Calling a Function

MakeCode:
`doSomething()`

TTC:
```text
CALL <function_name>()
```

or simply:

```text
<function_name>()
```

Example:
```text
CALL flash_animation()
```

---

Advanced patterns such as functions with parameters and return values are covered in  
**Section 5B – Advanced Patterns**, but they follow the same naming.


### 4.12 ARRAYS / LISTS

This section mirrors the **Arrays** category in the MakeCode toolbox.

An array (or list) is a variable that stores many values in order.

---

#### 4.12.1 Create

**set list to array of …**

MakeCode:
`set list to array of 0 1 2`

TTC:
```text
SET list TO [0, 1, 2]
```

---

**set text list to array of "a" "b" "c"**

MakeCode:
`set text list to array of "a" "b" "c"`

TTC:
```text
SET text_list TO ["a", "b", "c"]
```

---

**empty array**

MakeCode:
`empty array []`

TTC:
```text
SET list TO []
```

---

#### 4.12.2 Read

**length of array**

MakeCode:
`length of array list`

TTC:
```text
length of <list>
```

---

**get value at index**

MakeCode:
`list get value at 0`

TTC:
```text
<list>[<index>]
```

or

```text
get item at <index> from <list>
```

---

**get and remove value at index**

MakeCode:
`list get and remove value at 0`

TTC:
```text
get and remove item at <index> from <list>
```

---

**get and remove last value**

MakeCode:
`get and remove last value from list`

TTC:
```text
get and remove last item from <list>
```

---

**get and remove first value**

MakeCode:
`get and remove first value from list`

TTC:
```text
get and remove first item from <list>
```

---

**get random value**

MakeCode:
`get random value from list`

TTC:
```text
get random item from <list>
```

---

#### 4.12.3 Modify

**set value at index**

MakeCode:
`list set value at 0 to value`

TTC:
```text
SET <list>[<index>] TO <Expression>
```

---

**add value to end**

MakeCode:
`list add value to end`

TTC:
```text
append <Expression> TO <list>
```

---

**remove last value**

MakeCode:
`remove last value from list`

TTC:
```text
remove last item from <list>
```

---

**remove first value**

MakeCode:
`remove first value from list`

TTC:
```text
remove first item from <list>
```

---

**insert at beginning**

MakeCode:
`list insert at beginning`

TTC:
```text
insert <Expression> AT BEGINNING OF <list>
```

---

**insert at index**

MakeCode:
`list insert at 0 value`

TTC:
```text
insert <Expression> AT <index> IN <list>
```

---

**remove value at index**

MakeCode:
`list remove value at 0`

TTC:
```text
remove item AT <index> FROM <list>
```

---

#### 4.12.4 Operations

**find index of**

MakeCode:
`list find index of`

TTC:
```text
index of <value> in <list>
```

Returns the index of the first matching element, or -1 if not found.

---

**reverse list**

MakeCode:
`reverse list`

TTC:
```text
reverse <list>
```

Reverses the order of items in place.

---

#### 4.12.5 Notes

- Indexes start at 0 (first item is index 0).  
- Arrays can store numbers, text, sprites, etc., but each array should keep one type of thing.



### 4.13 TEXT

This section mirrors the **Text** category in the MakeCode toolbox.

It covers string literals, length, joining, parsing, splitting, searching, substrings,
character operations and conversions between numbers and text.

---

#### 4.11.1 Basic Text

**empty text literal**

MakeCode:
`""`

TTC:
```text
""
```

You can also write any other literal string:

```text
"Hello"
"Crashy Bird"
"Score:"
```

---

**length of text**

MakeCode:
`length of "Hello"`

TTC:
```text
length of <TextExpression>
```

Returns the number of characters.

---

**join text A and B**

MakeCode:
`join "Hello" "World"`

TTC:
```text
join <TextExpression1> and <TextExpression2>
```

Example:
```text
SET message TO join "Score: " and score
```

---

#### 4.11.2 Conversions

**parse to number**

MakeCode:
`parse to number "123"`

TTC:
```text
number from text <TextExpression>
```

Attempts to convert text to a number (e.g. "123" → 123).

---

**convert number to text**

MakeCode:
`convert 0 to text`

TTC:
```text
text from number <Expression>
```

---

#### 4.11.3 Splitting and Searching

**split text at separator**

MakeCode:
`split "this" at " "`

TTC:
```text
split <TextExpression> at <TextExpression>
```

Returns an array of pieces (see **4.12 ARRAYS**).

---

**text includes**

MakeCode:
`"this" includes ""`

TTC:
```text
<text> includes <search_text>
```

Example:
```text
IF "hello" includes "lo" THEN
    ...
END IF
```

---

**find index of**

MakeCode:
`"this" find index of ""`

TTC:
```text
index of <search_text> in <text>
```

Returns the position of the first match, or -1 if not found.

---

**is text empty**

MakeCode:
`"this" is empty`

TTC:
```text
<text> is empty
```

---

#### 4.11.4 Substrings and Characters

**substring from start with length**

MakeCode:
`substring of "this" from 0 of length 10`

TTC:
```text
substring of <text> from <start_index> length <length>
```

Indexes start at 0.

---

**compare text A to B**

MakeCode:
`compare "this" to ""`

TTC:
```text
compare <TextExpression1> to <TextExpression2>
```

Returns:
- 0 if the texts are equal,
- negative / positive otherwise (advanced use).

---

**character from text at index**

MakeCode:
`char from "this" at 0`

TTC:
```text
char from <text> at <index>
```

---

**character code from text at index**

MakeCode:
`char code from "this" at 0`

TTC:
```text
char code from <text> at <index>
```

---

**text from char code**

MakeCode:
`text from char code 0`

TTC:
```text
text from char code <number>
```

---

#### 4.11.5 Optional Helper Forms (not direct blocks)

For internal / teacher use we also allow these higher-level helpers, even though there is
no single block for them. They correspond to combinations of the blocks above:

- `contains(text, search)`  
- `index_of(text, search)`  
- `replace(text, old, new)`  
- `split(text, delimiter)`  
- `join(list, delimiter)`  
- `upper(text)`  
- `lower(text)`

These all follow the same naming and behaviour as typical programming languages,
but should be introduced only with more experienced groups.





### 4.14 GAME

This section mirrors the **Game** category in the MakeCode toolbox, including the **More…** submenu.

It covers:

- creating and deleting sprites
- moving sprites and reading their positions
- collisions and edge‑bounce
- score, lives and countdown
- overall game state (running / paused / over)

---

#### 4.14.1 Sprites

**create sprite at x … y …**

MakeCode:  
`create sprite at x: 2 y: 2`

TTC:
```text
SET sprite TO CREATE SPRITE AT (x, y)
```

Creates an LED sprite at the given coordinates and stores it in a variable (e.g. `bird`, `enemy`).

---

**delete sprite**

MakeCode:  
`delete sprite`

TTC:
```text
DELETE <sprite>
```

---

**is sprite deleted**

MakeCode:  
`is sprite deleted`

TTC:
```text
<sprite> IS DELETED
```

Returns TRUE if that sprite has already been deleted.

---

#### 4.14.2 Sprite Movement and Position

**move by**

MakeCode:  
`sprite move by 1`

TTC:
```text
MOVE <sprite> BY <steps>
```

Moves the sprite forward in its current direction.

---

**turn by degrees**

MakeCode:  
`sprite turn right by (°) 45`

TTC:
```text
TURN <sprite> RIGHT BY <degrees>
TURN <sprite> LEFT BY <degrees>
```

---

**change x / y by**

MakeCode:  
`sprite change x by 1`

TTC:
```text
CHANGE <sprite> X BY <value>
CHANGE <sprite> Y BY <value>
```

---

**set x / y to**

MakeCode:  
`sprite set x to 0`

TTC:
```text
SET <sprite> X TO <value>
SET <sprite> Y TO <value>
```

---

**read x / y**

MakeCode:  
`sprite x`  
`sprite y`

TTC:
```text
X POSITION OF <sprite>
Y POSITION OF <sprite>
```

These give numbers from 0–4 for the LED grid.

---

#### 4.14.3 Collisions and Edges

**is sprite touching other sprite**

MakeCode:  
`is sprite touching <other>`

TTC:
```text
<sprite> IS TOUCHING <other_sprite>
```

---

**is sprite touching edge**

MakeCode:  
`is sprite touching edge`

TTC:
```text
<sprite> IS TOUCHING EDGE
```

---

**if on edge, bounce**

MakeCode:  
`sprite if on edge, bounce`

TTC:
```text
IF <sprite> IS TOUCHING EDGE THEN
    BOUNCE <sprite>
END IF
```

---

#### 4.14.4 Life and Score

**life**

MakeCode:  
`remove life 1`  
`add life 1`  
`set life 3`

TTC:
```text
REMOVE LIFE <value>
ADD LIFE <value>
SET LIFE TO <value>
```

---

**score**

MakeCode:  
`set score 0`  
`change score by 1`  
`score`

TTC:
```text
SET SCORE TO <value>
CHANGE SCORE BY <value>
SCORE
```

`SCORE` is a value expression that returns the current score.

---

#### 4.14.5 Countdown

**start countdown**

MakeCode:  
`start countdown (ms) 10000`

TTC:
```text
START COUNTDOWN <milliseconds>
```

Starts a countdown timer; when time runs out the game ends.

---

#### 4.14.6 Game State

**game over**

MakeCode:  
`game over`

TTC:
```text
GAME OVER
```

Ends the game and shows the final score.

---

**is game over**

MakeCode:  
`is game over`

TTC:
```text
GAME IS OVER
```

---

**is paused / is running**

MakeCode:  
`is paused`  
`is running`

TTC:
```text
GAME IS PAUSED
GAME IS RUNNING
```

---

#### 4.14.7 Pause / Resume (More…)

MakeCode (More…):  
`pause`  
`resume`

TTC:
```text
GAME PAUSE
GAME RESUME
```

Used together with `GAME IS PAUSED` / `GAME IS RUNNING` in more advanced projects.



### 4.15 IMAGES

This section mirrors the **Images** category in the MakeCode toolbox.

It covers:

- showing and scrolling images
- creating 5×5 images
- creating wide “big images”
- built‑in icon and arrow images

---

#### 4.15.1 Show Image

**show image at offset**

MakeCode:  
`show image myImage at offset 0`

TTC:
```text
SHOW IMAGE <image> AT OFFSET <offset>
```

Shows a stored image starting at a horizontal offset.

---

#### 4.15.2 Scroll Image

MakeCode:  
`scroll image myImage with offset 1 and interval (ms) 200`

TTC:
```text
SCROLL IMAGE <image> WITH OFFSET <offset> INTERVAL <milliseconds>
```

Scrolls the image sideways across the display.

---

#### 4.15.3 Create 5×5 Image

MakeCode:  
`create image` (5×5 grid editor)

TTC:
```text
SET my_image TO CREATE IMAGE:
    row1
    row2
    row3
    row4
    row5
```

Each row is 5 characters, using brightness digits or `.` for off.

---

#### 4.15.4 Create Big Image

MakeCode:  
`create big image` (wide grid editor)

TTC:
```text
SET my_big_image TO CREATE BIG IMAGE:
    row1
    row2
    row3
    row4
    row5
```

Rows can be wider than 5 LEDs; useful for scrolling patterns.

---

#### 4.15.5 Icon Images

MakeCode:  
`icon image <icon>` (e.g. heart, small heart, happy, sad)

TTC:
```text
ICON <icon_name>
```

Used as an image value, for example:

```text
SHOW IMAGE ICON heart AT OFFSET 0
```

---

#### 4.15.6 Arrow Images

MakeCode:  
`arrow image North` (also East, South, West, etc.)

TTC:
```text
ARROW <direction>
```

Example:

```text
SHOW IMAGE ARROW North AT OFFSET 0
```



### 4.16 PINS

This section mirrors the **Pins** category in the MakeCode toolbox, including the **More…** submenu.

It covers:

- digital and analog IO
- mapping analog ranges
- audio pin selection
- servo outputs
- pulse‑measurement helpers
- I2C and SPI operations (advanced)

---

#### 4.16.1 Digital IO

**digital read pin**

MakeCode:  
`digital read pin P0`

TTC:
```text
[digital reading from P0]
```

---

**digital write pin**

MakeCode:  
`digital write pin P0 to 0`

TTC:
```text
SET digital pin P0 TO <0_or_1>
```

---

#### 4.16.2 Analog IO

**analog read pin**

MakeCode:  
`analog read pin P0`

TTC:
```text
[analog reading from P0]
```

---

**analog write pin**

MakeCode:  
`analog write pin P0 to 1023`

TTC:
```text
SET analog pin P0 TO <value_0_to_1023>
```

---

**map analog value**

MakeCode:  
`map 0 from low 0 high 1023 to low 0 high 4`

TTC:
```text
map <value> from <low1>.. <high1> to <low2>.. <high2>
```

(Same behaviour as the Math `map` block, often used with analog readings.)

---

**analog set period**

MakeCode:  
`analog set period pin P0 to (µs) 20000`

TTC:
```text
SET analog period of P0 TO <microseconds>
```

---

#### 4.16.3 Audio Pin

**set audio pin**

MakeCode:  
`set audio pin P0`

TTC:
```text
SET audio pin TO P0
```

---

**set audio pin enabled**

MakeCode:  
`set audio pin enabled false`

TTC:
```text
SET audio pin enabled TO <TRUE_or_FALSE>
```

(For micro:bit V2 with built‑in speaker.)

---

#### 4.16.4 Servo

**servo write angle**

MakeCode:  
`servo write pin P0 to 180`

TTC:
```text
SET servo on P0 TO angle <degrees>
```

---

**servo set pulse**

MakeCode:  
`servo set pulse pin P0 to (µs) 1500`

TTC:
```text
SET servo pulse on P0 TO <microseconds>
```

---

#### 4.16.5 Extra Pin Helpers (More… → Pins)

**digital pin expression**

MakeCode:  
`digital pin P0` (value block)

TTC:
```text
[digital reading from P0]
```

(Equivalent to the `digital read pin` block.)

---

**analog pin expression**

MakeCode:  
`analog pin P0`

TTC:
```text
[analog reading from P0]
```

---

**set pull pin**

MakeCode:  
`set pull pin P0 to up/down/none`

TTC:
```text
SET pull of P0 TO <up/down/none>
```

---

**set pin to emit edge events**

MakeCode:  
`set pin P0 to emit edge events`

TTC:
```text
SET P0 TO EMIT EDGE EVENTS
```

---

**analog set pitch pin**

MakeCode:  
`analog set pitch pin P0`

TTC:
```text
SET pitch pin TO P0
```

---

**neopixel matrix width pin**

MakeCode:  
`neopixel matrix width pin P0 5`

TTC:
```text
SET neopixel matrix on P0 WIDTH TO <value>
```

(Used with NeoPixel extensions; advanced.)

---

#### 4.16.6 Pulse (More… → Pulse)

**on pin pulsed**

MakeCode:  
`on pin P0 pulsed high/low`

TTC:
```text
WHEN [pin P0 is pulsed high/low] DO
    ...
END WHEN
```

---

**pulse duration**

MakeCode:  
`pulse duration (µs)`

TTC:
```text
[pulse duration us]
```

---

**pulse in**

MakeCode:  
`pulse in (µs) pin P0 pulsed high/low`

TTC:
```text
pulse in us on P0 pulsed high/low
```

Used to measure pulse length.

---

#### 4.16.7 I2C (More… → I2C) — Advanced

**i2c read number**

MakeCode:  
`i2c read number at address 0 of format Int8LE repeated false`

TTC:
```text
i2c read number at address <addr> format <format> repeated <TRUE_or_FALSE>
```

---

**i2c write number**

MakeCode:  
`i2c write number at address 0 with value 0 of format Int8LE repeated false`

TTC:
```text
i2c write number <value> to address <addr> format <format> repeated <TRUE_or_FALSE>
```

---

#### 4.16.8 SPI (More… → SPI) — Advanced

**spi frequency**

MakeCode:  
`spi frequency 1000000`

TTC:
```text
SET spi frequency TO <value>
```

---

**spi format**

MakeCode:  
`spi format bits 8 mode 3`

TTC:
```text
SET spi format TO <bits> bits MODE <mode>
```

---

**spi write**

MakeCode:  
`spi write 0`

TTC:
```text
spi write <value>
```

---

**spi set pins**

MakeCode:  
`spi set pins MOSI P0 MISO P0 SCK P0`

TTC:
```text
SET spi pins TO MOSI <pin> MISO <pin> SCK <pin>
```

---



### 4.17 SERIAL

This section mirrors the **Serial** category in the MakeCode toolbox, including the **More…** submenu.

It covers writing text and numbers, reading lines and strings, event‑based serial input,
redirecting serial to pins or USB, buffer settings and baud rate.

---

#### 4.17.1 Write

**serial write line**

MakeCode:  
`serial write line ""`

TTC:
```text
serial write line <TextExpression>
```

Writes text followed by a new line.

---

**serial write number**

MakeCode:  
`serial write number 0`

TTC:
```text
serial write number <Expression>
```

---

**serial write value**

MakeCode:  
`serial write value "x" = 0`

TTC:
```text
serial write value <TextExpression> = <Expression>
```

Useful for labelled data like `"temp" = 25`.

---

**serial write string**

MakeCode:  
`serial write string ""`

TTC:
```text
serial write string <TextExpression>
```

---

**serial write numbers (array)**

MakeCode:  
`serial write numbers array of 0 1 0`

TTC:
```text
serial write numbers <array_variable>
```

Writes all numbers in an array on one line, separated by commas.

---

#### 4.17.2 Read

**serial read line**

MakeCode:  
`serial read line`

TTC:
```text
SET text TO serial read line
```

---

**serial read until delimiter**

MakeCode:  
`serial read until new line ( 
 )` (or other delimiter)

TTC:
```text
SET text TO serial read until <delimiter>
```

---

**serial on data received**

MakeCode:  
`serial on data received new line ( 
 )`

TTC:
```text
WHEN [serial data received <delimiter>] DO
    ...
END WHEN
```

---

**serial read string**

MakeCode:  
`serial read string`

TTC:
```text
SET text TO serial read string
```

Reads whatever characters are currently available.

---

#### 4.17.3 Redirect

**serial redirect to pins**

MakeCode:  
`serial redirect to TX P0 RX P1 at baud rate 115200`

TTC:
```text
serial redirect TX <pin_tx> RX <pin_rx> baud <baud_rate>
```

---

**serial redirect to USB**

MakeCode:  
`serial redirect to USB`

TTC:
```text
serial redirect to USB
```

---

#### 4.17.4 More… — Buffers and Configuration

**set TX / RX buffer size**

MakeCode:  
`serial set tx buffer size to 32`  
`serial set rx buffer size to 32`

TTC:
```text
serial set tx buffer size TO <size>
serial set rx buffer size TO <size>
```

---

**write / read buffer**

MakeCode:  
`serial write buffer <buffer>`  
`serial read buffer`

TTC:
```text
serial write buffer <buffer_variable>
SET buffer_variable TO serial read buffer
```

---

**set write line padding**

MakeCode:  
`serial set write line padding to 0`

TTC:
```text
serial set write line padding TO <value>
```

---

**set baud rate**

MakeCode:  
`serial set baud rate 115200`

TTC:
```text
serial set baud rate TO <baud_rate>
```

---



### 4.18 CONTROL

This section mirrors the **Control** category in the MakeCode toolbox.

It covers:

- waiting for events
- running code in the background
- timing in microseconds
- resetting the micro:bit
- raising and handling events
- reading event timestamp and value

(The basic `pause (ms)` and `forever` loop are documented in **4.1 BASIC**.)

---

#### 4.18.1 Wait for Event

MakeCode:  
`wait for event from 0 with value 0`

TTC:
```text
WAIT FOR EVENT FROM <source> WITH VALUE <value>
```

Pauses until the given event occurs.

---

#### 4.18.2 Run in Background

MakeCode:  
`run in background`

TTC:
```text
RUN IN BACKGROUND:
    ...
END BACKGROUND
```

Runs the enclosed code on a background thread so the main program can continue.

---

#### 4.18.3 Time in Millis / Micros

**millis (ms)**

MakeCode:  
`millis (ms)`

TTC:
```text
[time ms]
```

Returns the number of milliseconds since reset.

---

**wait (µs)**

MakeCode:  
`wait (µs) 4`

TTC:
```text
wait <microseconds> us
```

Short delay in microseconds (much finer than `pause`).

---

#### 4.18.4 Reset

MakeCode:  
`reset`

TTC:
```text
RESET DEVICE
```

Restarts the micro:bit.

---

#### 4.18.5 Raise and Handle Events

**raise event**

MakeCode:  
`raise event from source MICROBIT_ID_BUTTON_A with value MICROBIT_EVT_ANY`

TTC:
```text
RAISE EVENT FROM <source> WITH VALUE <value>
```

---

**on event from … with value …**

MakeCode:  
`on event from MICROBIT_ID_BUTTON_A with value MICROBIT_EVT_ANY`

TTC:
```text
WHEN [event from <source> with value <value>] DO
    ...
END WHEN
```

---

#### 4.18.6 Event Details

**event timestamp**

MakeCode:  
`event timestamp`

TTC:
```text
[event timestamp]
```

---

**event value**

MakeCode:  
`event value`

TTC:
```text
[event value]
```

These are typically read inside an event handler.


### 4.19 SPRITES (ARCADE)

For MakeCode Arcade games only.

**Create Sprite**

- `MAKE SPRITE <identifier> OF KIND <kind> WITH IMAGE`  
  `...`  
  `END IMAGE`

Or with a predefined image.

**Position & Movement**

- `set x of <sprite> to <Expression>`  
- `set y of <sprite> to <Expression>`  
- `change x of <sprite> by <Expression>`  
- `change y of <sprite> by <Expression>`

- `set vx of <sprite> to <Expression>`  
- `set vy of <sprite> to <Expression>`  
- `set ax of <sprite> to <Expression>`  
- `set ay of <sprite> to <Expression>`

**Overlaps / Collisions**

- `WHEN <kind1> overlaps <kind2> DO` … `END WHEN`

Inside overlap events:

- `[current sprite]`  
- `[other sprite]`

**Destroy & Effects**

- `destroy <sprite>`  
- `destroy <sprite> WITH <effect>`

**Projectiles**

- `MAKE PROJECTILE <identifier> FROM <sprite> WITH VELOCITY <vx>, <vy> WITH IMAGE`  
  `...`  
  `END IMAGE`

**Sprite Flags**

- `set stay_in_screen of <sprite> to on/off`  
- `set bounce_on_wall of <sprite> to on/off`  
- `set ghost of <sprite> to on/off`

**Lifespan**

- `set lifespan of <sprite> to <Expression> ms`

**Camera & Screen**

- `set camera to follow <sprite>`  
- `screen shake <Expression> ms`  
- `screen start effect <identifier>` (optional)  
- `screen stop effect` (optional)

**Sprite Data**

- `set data "<key>" of <sprite> to <Expression>`  
- `[data "<key>" of <sprite>]`

---


### 4.20 ADVANCED / EXPERIMENTAL

Commands that are rarely needed for KS2 but useful at higher levels or for you in lab-style work.

**Reset & Background**

- `reset device`  
- `IN BACKGROUND` … `END BACKGROUND`  

**Events**

- `raise event <id> value <value>`  
- `WHEN [event <id> with value <value> happens] DO` … `END WHEN`  
- `[event value]`  
- `[event timestamp]`

**Bitwise Operations (Advanced Maths)**

When needed for specialist tasks:

- `bit_and(a, b)`  
- `bit_or(a, b)`  
- `bit_xor(a, b)`  
- `bit_not(a)`  
- `shift_left(value, bits)`  
- `shift_right(value, bits)`

**Random / Seeding**

- `set random seed to <Expression>`  
- `[random number from a to b]` (treated as a standard expression)

**Logging & Debugging**

- `debug <StringExpression>` (conceptual shortcut for serial/console logging)  
- `log data <StringExpression> = <Expression>` (for datalogger-style logs)  
- `start log`  
- `stop log`

Most of these are **optional** and not intended for younger TTC participants,
but the pseudocode system supports them for completeness and for your more advanced projects.


## 5. Mappings

#




## 5A. MakeCode → TTC Pseudocode  
This section gives the **direct mapping** from MakeCode blocks to TTC pseudocode.  
It is written for instructors who need to explain MakeCode code in plain English,  
create quiz answers, or prepare worksheets.

All mappings are grouped by MakeCode category.

---

### 5A.1 BASIC
### **show number**
MakeCode block:  
`show number 0`  
TTC:  
`show number <Expression>`

---

### **show string / show text**
MakeCode:  
`show string "Hello!"`  
TTC:  
`show text "Hello!"`

---

### **show icon**
MakeCode:  
`show icon IconNames.Heart`  
TTC:  
`show icon heart`

---

### **show leds**
MakeCode:  
Custom LED grid (5×5)  
TTC:
```
show leds
    0 1 0 1 0
    ...
end leds
```

---

### **pause**
MakeCode:  
`pause (ms)`  
TTC:  
`pause <Expression> ms`

---

### **forever**
MakeCode:  
`forever:`  
TTC:
```
FOREVER
    ...
END FOREVER
```

---

### 5A.2 INPUT
### **on button pressed**
MakeCode:  
`on button A pressed`  
TTC:
```
WHEN [button A is pressed] DO
    ...
END WHEN
```

---

### **button is pressed (value)**
MakeCode:  
`button A is pressed`  
TTC:  
`[button A is pressed]`

---

### **on shake / gesture**
MakeCode:  
`on shake`  
TTC:
```
WHEN [shake gesture happens] DO
    ...
END WHEN
```

---

### **acceleration / tilt**
MakeCode:  
`acceleration (mg)`  
TTC:  
`[acceleration x]`, `[acceleration y]`, `[acceleration z]`

---

### **light level**
MakeCode:  
`light level`  
TTC:  
`[light level]`

---

### **temperature**
MakeCode:  
`temperature`  
TTC:  
`[temperature]`

---

### 5A.3 LED
### **plot**
MakeCode:  
`plot x y`  
TTC:  
`plot <x> <y>`

---

### **unplot**
MakeCode:  
`unplot x y`  
TTC:  
`unplot <x> <y>`

---

### **toggle**
MakeCode:  
`toggle x y`  
TTC:  
`toggle <x> <y>`

---

### **brightness**
MakeCode:  
`set brightness 128`  
TTC:  
`set brightness <Expression>`

MakeCode:  
`brightness`  
TTC:  
`[brightness]`

---

### **bar graph**
MakeCode:  
`plot bar graph of X up to Y`  
TTC:  
`plot bar graph <Expression> up to <Expression>`

---

### 5A.4 MUSIC
### **play tone**
MakeCode:  
`play tone Middle C for 1 beat`  
TTC:  
`play tone C4 for 1 beat`

---

### **play tone Hz**
MakeCode:  
`play tone 440 for 1 beat`  
TTC:  
`play tone 440 Hz for 1 beat`

---

### **melody**
MakeCode:  
`play melody "C D E" once`  
TTC:  
`play melody "C D E" once`

MakeCode:  
`start melody repeating`  
TTC:  
`loop melody "..."`

---

### **tempo**
MakeCode:  
`set tempo 120 bpm`  
TTC:  
`set tempo to 120 bpm`

---

### **volume (v2)**
MakeCode:  
`set volume 100`  
TTC:  
`set volume to 100`

---

### 5A.5 IMAGES
### **show icon**
Matches Basic section:
`show icon heart`

---

### **scroll image**
MakeCode:  
`scroll image myImage at 200 ms`  
TTC:  
`scroll image myImage at speed 200`

---

### **show image at offset**
MakeCode:  
`show image myImage offset 2`  
TTC:  
`show image myImage at offset 2`

---

### **create image**
MakeCode:  
`images.createImage("...")`  
TTC:
```
MAKE IMAGE name AS
    ...
END IMAGE
```

---

### 5A.6 GAME
### **score**
MakeCode:  
`set score 0`  
→ `set score to 0`

`change score by 1`  
→ `change score by 1`

`score` (reporter)  
→ `[score]`

---

### **life**
`set life 3` → `set life to 3`  
`change life by -1` → `change life by -1`  
`life` → `[life]`

---

### **countdown**
`start countdown 10`  
→ `start countdown 10 s`

`countdown`  
→ `[countdown]`

---

### **game over**
`game over` → `game over`  
`game over(true)` → `game over with win`  
`game over(false)` → `game over with lose`

---

### 5A.7 RADIO
### **set group**
MakeCode:  
`radio.setGroup(1)`  
TTC:  
`set radio group to 1`

---

### **send number**
`radio.sendNumber(5)`  
→ `radio send number 5`

### **send string**
`radio.sendString("hi")`  
→ `radio send text "hi"`

### **on received number**
MakeCode:
```
radio.onReceivedNumber(function (receivedNumber) {
    ...
})
```
TTC:
```
WHEN [radio receives number] DO
    ...
END WHEN
```

**System values:**

MakeCode: `receivedNumber`  
TTC: `[received packet number]`

---

### 5A.8 PINS
### **digital write**
`pins.digitalWritePin(P0, 1)`  
→ `set digital pin P0 to 1`

### **digital read**
`pins.digitalReadPin(P1)`  
→ `[digital reading from P1]`

---

### **analog write**
`pins.analogWritePin(P0, 1023)`  
→ `set analog pin P0 to 1023`

### **analog read**
`pins.analogReadPin(P2)`  
→ `[analog reading from P2]`

---

### **servo**
`pins.servoWritePin(P1, 90)`  
→ `set servo P1 angle to 90`

---

### 5A.9 SERIAL
### **serial write**
`serial.writeLine("hello")`  
→ `serial write line "hello"`

---

### **serial read**
`serial.readLine()`  
→ `SET variable TO serial read line`

---

### **on data received**
MakeCode:
```
serial.onDataReceived("
", function () { ... })
```
TTC:
```
WHEN [serial data received "
"] DO
    ...
END WHEN
```

---

### 5A.10 BLUETOOTH
Exact mapping depends on services enabled; core examples:

`bluetooth.startUartService()`  
→ `enable bluetooth uart service`

`bluetooth.connected()`  
→ `[bluetooth connected]`

---

### 5A.11 TEXT (STRINGS)
### **join text**
MakeCode:  
`"Score:" + score`  
TTC:  
`"Score:" + to_text(score)`

---

### **length of**
MakeCode:  
`text.length`  
TTC:  
`[length of text]`

---

### 5A.12 LISTS / ARRAYS
### **create list**
MakeCode:
`let list = [1, 2, 3]`  
TTC:
`MAKE LIST list WITH 1, 2, 3`

---

### **push**
MakeCode:  
`list.push(5)`  
TTC:  
`append 5 TO list`

---

### **get item**
MakeCode:  
`list[0]`  
TTC:  
`list[0]`

---

### **set item**
MakeCode:
`list[1] = 10`  
TTC:  
`SET list[1] TO 10`

---

### **length**
MakeCode:
`list.length`  
TTC:
`[length of list]`

---

### 5A.13 SPRITES
### **create sprite**
MakeCode:
```
sprites.create(img`
    ...
`, SpriteKind.Player)
```
TTC:
```
MAKE SPRITE mySprite OF KIND player WITH IMAGE
    ...
END IMAGE
```

---

### **set position**
`sprite.x = 50`  
→ `set x of sprite to 50`

`sprite.y = 80`  
→ `set y of sprite to 80`

---

### **change velocity**
`sprite.vx = 50` → `set vx of sprite to 50`  
`sprite.vy = -20` → `set vy of sprite to -20`

---

### **overlaps**
MakeCode:
```
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, ...)
```
TTC:
```
WHEN player overlaps enemy DO
    ...
END WHEN
```

**System values:**

`otherSprite` → `[other sprite]`  
`sprite` → `[current sprite]`

---

### 5A.14 TILEMAP (Arcade)
### **on tile overlap**
MakeCode:
```
scene.onOverlapTile(sprite, tile, function() {})
```

TTC:
```
WHEN <sprite kind> overlaps <tile> DO
    ...
END WHEN
```

### **tilemap system values**
`location` → `[current tile]`

---

### 5A.15 ADVANCED
### **bitwise**
MakeCode:  
`bitwise AND`, `OR`, etc.  
TTC:
`bit_and(a, b)`, `bit_or(a, b)`, etc.

---

### **raise event**
MakeCode:
```
control.raiseEvent(100, 7)
```
TTC:
`raise event 100 value 7`

---

### **background**
MakeCode:
```
control.inBackground(function(){ ... })
```
TTC:
```
IN BACKGROUND
    ...
END BACKGROUND
```

---

This completes **all mappings from MakeCode → TTC pseudocode**.



### 5B. TTC Pseudocode → MakeCode  
This section gives the **reverse mapping**:  
Given a TTC pseudocode line (used in quizzes, examples, worksheets),  
which **exact MakeCode block** does it correspond to?

This helps with:
- marking answers
- generating MakeCode examples from TTC lessons
- debugging code written in TTC
- building automatic converters later

Mappings are grouped by category.

---

### 5B.1 BASIC
### **show number**
TTC:
```
show number score
```
MakeCode:  
**Basic → show number (0)**  
(value replaced with `score`)

---

### **show text**
TTC:
```
show text "HELLO"
```
MakeCode:  
**Basic → show string "HELLO"**

---

### **show icon**
TTC:
```
show icon heart
```
MakeCode:  
**Basic → show icon Heart**

---

### **custom LED image**
TTC:
```
show leds
    ...
end leds
```
MakeCode:  
**Basic → show leds** (5×5 editor)

---

### **pause**
TTC:
```
pause 200 ms
```
MakeCode:  
**Basic → pause (ms)**

---

### **FOREVER**
TTC:
```
FOREVER
    ...
END FOREVER
```
MakeCode:  
**Basic → forever** (loop)

---

### 5B.2 INPUT
### **WHEN button**
TTC:
```
WHEN [button A is pressed] DO
    ...
END WHEN
```
MakeCode:  
**Input → on button A pressed**

---

### **WHEN shake**
TTC:
```
WHEN [shake gesture happens] DO
```
MakeCode:  
**Input → on shake**

---

### **System values**
TTC:
`[light level]`  
→ MakeCode: **Input → light level**

TTC:
`[temperature]`  
→ MakeCode: **Input → temperature**

TTC:
`[acceleration x]`  
→ MakeCode: **Input → acceleration (mg)**

TTC:
`[time ms]`  
→ MakeCode: **Input → running time (ms)**

---

### 5B.3 LED
### **plot**
TTC:
```
plot 2 3
```
MakeCode:  
**LED → plot (x, y)**

---

### **unplot**
```
unplot 4 0
```
MakeCode:  
**LED → unplot (x, y)**

---

### **toggle**
```
toggle 1 1
```
MakeCode:  
**LED → toggle (x, y)**

---

### **set brightness**
```
set brightness 180
```
MakeCode:  
**LED → set brightness 0–255**

---

### **bar graph**
```
plot bar graph value up to max
```
MakeCode:  
**LED → plot bar graph of value up to max**

---

### 5B.4 MUSIC
### **play tone**
```
play tone C4 for 1 beat
```
MakeCode:  
**Music → play tone Middle C for 1 beat**

---

### **play frequency tone**
```
play tone 440 Hz for 1 beat
```
MakeCode:  
**Music → play tone 440 for 1 beat**

---

### **melody**
```
play melody "C D E" once
```
→ **Music → play melody "C D E" once**

```
loop melody "C D E"
```
→ **Music → start melody "C D E" repeating**

---

### **tempo**
```
set tempo to 120 bpm
```
→ MakeCode: **Music → set tempo 120 bpm**

---

### **volume (v2)**
```
set volume to 100
```
→ MakeCode: **Music → set volume 100**

---

### 5B.5 IMAGES
### **show big image / scroll**
```
scroll image mountain at speed 200
```
→ **Images → scroll image at ms**

---

### **show image offset**
```
show image banner at offset 2
```
→ **Images → show image offset 2**

---

### **custom image creation**
```
MAKE IMAGE heart AS
    ...
END IMAGE
```

The corresponding MakeCode is produced by:
**Images → create image (code editor panel)**  
(identical layout)

---

### 5B.6 GAME
### **score**
```
set score to 0
```
→ **Game → set score 0**

```
change score by 1
```
→ **Game → change score by 1**

```
[score]
```
→ **Game → score**

---

### **life**
Same mapping:
```
set life to 3
change life by -1
[life]
```

---

### **countdown**
```
start countdown 10 s
```
→ **Game → start countdown 10**

```
[countdown]
```
→ **Game → countdown**

---

### **game over**
```
game over
```
→ **Game → game over**

```
game over with win
```
→ **Game → game over(true)**

---

### 5B.7 RADIO
### **set group**
```
set radio group to 5
```
→ **Radio → set group 5**

---

### **send**
```
radio send number score
```
→ **Radio → send number score**

```
radio send text "hi"
```
→ **Radio → send string "hi"**

---

### **receive events**
```
WHEN [radio receives number] DO
```
→ **Radio → on received number**

System value:
`[received packet number]`  
→ MakeCode variable `receivedNumber`

---

### 5B.8 PINS
### **digital write**
```
set digital pin P1 to 1
```
→ **Pins → digital write pin P1 to 1**

---

### **digital read**
```
[digital reading from P1]
```
→ **Pins → digital read pin P1**

---

### **analog write**
```
set analog pin P0 to 1023
```
→ **Pins → analog write P0**

---

### **servo**
```
set servo P2 angle to 90
```
→ **Pins → servo write P2 to 90°**

---

### 5B.9 SERIAL
### **write**
```
serial write line "hello"
```
→ **Serial → write line "hello"**

```
serial write number score
```
→ **Serial → write number**

---

### **read**
```
SET msg TO serial read line
```
→ **Serial → read line**

---

### **event**
```
WHEN [serial data received "
"] DO
```
→ **Serial → on data received "
"**

---

### 5B.10 BLUETOOTH
### **uart service**
```
enable bluetooth uart service
```
→ **Bluetooth → start UART service**

---

### **connected**
```
[bluetooth connected]
```
→ **Bluetooth → bluetooth.connected()**

---

### 5B.11 TEXT
### **join text**
```
"Score: " + to_text(score)
```
→ **Text → join blocks** or **Arithmetic → text join**

---

### **length**
```
[length of name]
```
→ **Text → length of text**

---

### **substr / index**
Direct equivalents exist in **Text → substring**, **Text → char at**.

---

### 5B.12 LISTS
### **make list**
```
MAKE LIST nums WITH 1, 2, 3
```
→ **Arrays → create list with [1,2,3]**

---

### **append**
```
append 5 TO nums
```
→ **Arrays → list push 5**

---

### **get/set item**
```
nums[1]
```
→ **Arrays → get value at index**

```
SET nums[1] TO 10
```
→ **Arrays → set value at index**

---

### **length**
```
[length of nums]
```
→ **Arrays → length of list**

---

### 5B.13 SPRITES (Arcade)
### **create sprite**
```
MAKE SPRITE bird OF KIND player WITH IMAGE
    ...
END IMAGE
```
→ **Sprites → create sprite of kind Player**

---

### **movement**
```
set vx of bird to 30
```
→ **Sprites → set velocity (vx)**

```
change y of bird by -3
```
→ **Sprites → change Y by**

---

### **overlap event**
```
WHEN player overlaps enemy DO
```
→ **Sprites → on overlap SpriteKind.Player with SpriteKind.Enemy**

System values:
`[current sprite]` and `[other sprite]` map to the event parameters.

---

### **projectile**
```
MAKE PROJECTILE p FROM bird WITH VELOCITY 50, 0 WITH IMAGE
```
→ **Sprites → projectile from sprite with vx, vy**

---

### **flags**
```
set stay_in_screen of bird to on
```
→ **Sprites → set stay in screen true**

---

### 5B.14 TILEMAP (Arcade)
```
WHEN player overlaps tile grass DO
```
→ **Scene → on overlap tile**

```
[current tile]
```
→ MakeCode: **location** value from tilemap

---

### 5B.15 ADVANCED
### **background**
```
IN BACKGROUND
    ...
END BACKGROUND
```
→ **Loops → in background**

---

### **raise event**
```
raise event 5 value 9
```
→ **Control → raise event**

---

### **debug / log**
```
log data "temp" = temperature
```
→ **Datalogger → log data**

---

This completes the full **TTC → MakeCode** mapping.
