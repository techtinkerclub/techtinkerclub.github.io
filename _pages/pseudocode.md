---
layout: single
title: "Tech Tinker Club — Microbit Pseudocode Reference"
permalink: /tools/microbit-pseudocode-reference/
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

# Tech Tinker Club — Microbit Pseudocode Specification (v2)

This document is the **authoritative reference** for Tech Tinker Club pseudocode
used to describe MakeCode programs for the BBC micro:bit (and micro:bit v2).

It is designed for:

- children aged 8–11 (KS2),
- instructors and parents supporting them,
- and for use in quizzes, worksheets, lesson notes, and teacher resources.

The aim is that **every MakeCode block has a clear TTC pseudocode form**.

---

## 1. Pseudocode Style

### 1.1 Keywords

All **pseudocode keywords** are written in UPPERCASE:

- `WHEN`, `IF`, `THEN`, `ELSE`, `END IF`
- `REPEAT`, `END REPEAT`
- `WHILE`, `END WHILE`
- `FOR`, `END FOR`
- `FOREVER`, `END FOREVER`
- `EVERY`, `END EVERY`
- `SET`, `TO`, `CHANGE`
- `TRUE`, `FALSE`
- `GAME OVER`, etc.

Blocks that behave like *events* are written with `WHEN … DO … END WHEN`.

---

### 1.2 Variables

Variables are:

- all **lowercase**,
- words separated by **underscores** if needed.

Examples:

- `score`
- `bird_y`
- `light_level`
- `best_time`
- `obstacles`
- `player_lives`

Assignments use:

```text
SET score TO 0
CHANGE score BY 1
```

---

### 1.3 System Values (Sensors, State, Random)

Values provided by the micro:bit itself (sensors, buttons, random, etc.) are written
in **square brackets**:

```text
[button A is pressed]
[light level]
[temperature]
[acceleration X]
[random number from 0 to 10]
[sound level]
[compass heading]
[runtime ms]
```

These are **not** variables you create; they are readings from the device or system.

They can be used inside conditions and expressions:

```text
IF [light level] < 50 THEN
    show text "Too dark!"
END IF

SET guess TO [random number from 0 to 10]
```

---

### 1.4 Expressions

Anywhere you see `<Expression>` or `<TextExpression>` in this document, it means:
“anything that behaves like a number (or text) in that place”, e.g.

- `score + 1`
- `length of name`
- `[light level] * 2`
- `number from text input_text`

---

### 1.5 Events

Event handlers have the general form:

```text
WHEN [some event happens] DO
    ...
END WHEN
```

Examples:

```text
WHEN [button A is pressed] DO
    CHANGE score BY 1
END WHEN

WHEN [shake gesture] DO
    GAME OVER
END WHEN
```

---

### 1.6 Indentation

Indentation is for readability only; it does not change meaning, but children are
encouraged to indent code inside blocks:

```text
IF score > 10 THEN
    show icon happy
ELSE
    show icon sad
END IF
```

---

## 2. Control Structures

These are the basic shapes we use in TTC pseudocode.

### 2.1 IF / ELSE

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

---

### 2.2 Fixed Repetition

```text
REPEAT <count> TIMES
    ...
END REPEAT
```

---

### 2.3 While Loop

```text
WHILE <condition> DO
    ...
END WHILE
```

---

### 2.4 For Index Loop

```text
FOR index FROM <start> TO <end> DO
    ...
END FOR
```

---

### 2.5 For Each Loop

```text
FOR EACH element IN <list_name> DO
    ...
END FOR
```

---

### 2.6 Forever Loop

```text
FOREVER
    ...
END FOREVER
```

---

### 2.7 Timed Loop

```text
EVERY <time_ms> ms DO
    ...
END EVERY
```

---

### 2.8 Break / Continue (Advanced)

```text
BREAK
```

```text
CONTINUE
```

Used inside loops to exit early or skip to the next iteration.

---

## 3. System Values (Overview)

The micro:bit provides many built-in values. They are always written in **square brackets**.

Examples:

- Buttons: `[button A is pressed]`, `[button B is pressed]`
- Gestures: `[shake gesture]`
- Sensors: `[light level]`, `[temperature]`, `[sound level]`
- Accelerometer: `[acceleration X]`, `[acceleration Y]`, `[acceleration Z]`
- Compass: `[compass heading]`, `[magnetic force X]`, etc.
- Rotation: `[rotation pitch]`, `[rotation roll]`, `[rotation yaw]`
- Time: `[runtime ms]`, `[runtime micros]`, `[time ms]`
- Game: `SCORE`, `GAME IS OVER`, `GAME IS PAUSED`
- Radio: `[received packet number]`, `[received text]`, etc.
- Music: `[volume]`, `[tempo bpm]`, `[beat ms]`

Each category below explains the relevant system values in more detail.

---

## 4. MakeCode to TTC Pseudocode Mapping

This chapter maps each **toolbox category** in the MakeCode editor to TTC pseudocode.

The section numbers follow the toolbox:

- **4.1 Basic**
- **4.2 Inputs**
- **4.3 Music**
- **4.4 LED**
- **4.5 Radio**
- **4.6 Bluetooth**
- **4.7 Loops**
- **4.8 Logic**
- **4.9 Variables**
- **4.10 Maths**
- **4.11 Functions**
- **4.12 Arrays**
- **4.13 Text**
- **4.14 Game**
- **4.15 Images**
- **4.16 Pins**
- **4.17 Serial**
- **4.18 Control**

Each block listed follows this pattern:

- MakeCode block text
- TTC pseudocode form(s)
- Short explanation where useful

---

### 4.1 BASIC

This mirrors the **Basic** category in MakeCode.

#### 4.1.1 Start and Forever

**on start**

```text
ON START
    ...
END ON START
```

Runs once when the program begins.

You may also simply list commands at the top and say they belong in `on start`.

---

**forever**

```text
FOREVER
    ...
END FOREVER
```

Main game loop; runs again and again.  
(See also 4.7 Loops and timing notes in Appendix A.)

---

#### 4.1.2 Display & Text

**show number**

```text
show number <Expression>
```

---

**show text** (MakeCode: *show string*)

```text
show text "<message>"
show text <TextExpression>
```

---

**show icon**

```text
show icon heart
show icon happy
show icon sad
show icon skull
```

(Any built-in icon name.)

---

**show leds**

```text
show leds
    0 0 0 0 0
    0 1 0 1 0
    0 0 1 0 0
    0 1 0 1 0
    0 0 0 0 0
end leds
```

---

**show arrow**

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

These are special cases of `show icon`.

---

**clear screen**

```text
clear screen
```

---

#### 4.1.3 Timing

**pause (ms)**

```text
pause <Expression> ms
```

Used inside events, `on start`, or `FOREVER`.

---

### 4.2 INPUTS

Mirrors the **Input** category (including **More…** and micro:bit v2 blocks).

#### 4.2.1 Events

```text
WHEN [button A is pressed] DO
    ...
END WHEN

WHEN [button B is pressed] DO
    ...
END WHEN

WHEN [shake gesture] DO
    ...
END WHEN

WHEN [pin P0 is pressed] DO
    ...
END WHEN

WHEN [pin P0 is released] DO
    ...
END WHEN

WHEN [loud sound] DO
    ...
END WHEN

WHEN [logo is pressed] DO
    ...
END WHEN
```

---

#### 4.2.2 Values

Buttons and logo:

```text
[button A is pressed]
[button B is pressed]
[pin P0 is pressed]
[logo is pressed]
```

Movement and tilt:

```text
[shake gesture]
[acceleration X]
[acceleration Y]
[acceleration Z]
[rotation pitch]
[rotation roll]
[rotation yaw]
```

Environment:

```text
[light level]
[temperature]
[sound level]
[compass heading]
[magnetic force X]
[magnetic force Y]
[magnetic force Z]
```

Time:

```text
[runtime ms]
[runtime micros]
```

Advanced configuration:

```text
set accelerometer range to <g_value>
set loud sound threshold to <number>
calibrate compass
```

---

### 4.3 MUSIC

Mirrors the **Music** category, including micro:bit v2 sound.

#### 4.3.1 Melody

```text
play melody "<pattern>" once
play melody "<pattern>" until done
play melody "<pattern>" in background
stop melody
```

---

#### 4.3.2 Tone and Rest

```text
play tone C4 for 1 beat
play tone <frequency> Hz for <beats> beat
start tone C4
start tone <frequency> Hz
rest <beats> beat
stop all sounds
```

---

#### 4.3.3 Volume and Tempo

```text
set volume to <Expression>
[volume]

set tempo to <bpm>
change tempo by <bpm>
[tempo bpm]
[beat ms]
```

---

#### 4.3.4 Sound Effects (micro:bit v2)

```text
play sound giggle
play sound giggle until done
play sound <effect_name>
play sound <effect_name> until done
[sound is playing]

set built_in_speaker to on
set built_in_speaker to off
```

(Any sound expression can be treated as `<effect_name>`.)

---

### 4.4 LED

Mirrors the **Led** category (including **More…**).

#### 4.4.1 Main LED Controls

```text
plot <x> <y>
unplot <x> <y>
toggle <x> <y>
[pixel at <x> <y> is on]
plot bar graph <value> up to <max_value>
```

---

#### 4.4.2 Brightness & Display

```text
plot <x> <y> brightness <brightness_value>
[brightness of pixel <x> <y>]
[brightness]
set brightness <Expression>

set display enabled to on
set display enabled to off
stop animation

set display mode to black_and_white
set display mode to greyscale
```

---

### 4.5 RADIO

Mirrors the **Radio** category (including **More…**).

#### 4.5.1 Group

```text
set radio group to <number>
```

---

#### 4.5.2 Send

```text
radio send number <Expression>
radio send value "<name>" = <Expression>
radio send text "<message>"
radio send text <TextExpression>
```

---

#### 4.5.3 Receive

Events:

```text
WHEN [radio receives number] DO
    ...
END WHEN

WHEN [radio receives value] DO
    ...
END WHEN

WHEN [radio receives text] DO
    ...
END WHEN
```

Values:

```text
[received packet number]
[received text]
[received value name]
[received value number]
[received signal strength]
[received serial number]
```

---

#### 4.5.4 Advanced Radio

```text
set radio transmit power to <level>
set radio transmit serial number on
set radio transmit serial number off
set radio frequency band to <band_number>
radio raise event from <source> with value <value>
```

---

### 4.6 BLUETOOTH

Mirrors the **Bluetooth** category (standard MakeCode; exact set may vary by version).

Pseudocode treats Bluetooth **enable/disable** and **services** in a general form:

```text
bluetooth set enabled to TRUE
bluetooth set enabled to FALSE

bluetooth advertise <service_name>
bluetooth stop advertising
```

For classroom work, Bluetooth is usually either **enabled once** at startup or left off.
Exact service blocks (e.g. UART, iBeacon) can be described in words for advanced groups.

---

### 4.7 LOOPS

Mirrors the **Loops** category.

```text
REPEAT <count> TIMES
    ...
END REPEAT

WHILE <condition> DO
    ...
END WHILE

FOR index FROM <start> TO <end> DO
    ...
END FOR

FOR EACH element IN <list_name> DO
    ...
END FOR

EVERY <time_ms> ms DO
    ...
END EVERY

BREAK
CONTINUE
```

`FOREVER` is documented in **4.1 Basic**.

---

### 4.8 LOGIC

Mirrors the **Logic** category.

#### 4.8.1 IF / IF–ELSE

```text
IF <condition> THEN
    ...
END IF

IF <condition> THEN
    ...
ELSE
    ...
END IF
```

---

#### 4.8.2 Comparisons

```text
<Expression> = <Expression>
<Expression> < <Expression>
<Expression> > <Expression>
<Expression> <= <Expression>
<Expression> >= <Expression>
<Expression> != <Expression>
```

---

#### 4.8.3 Boolean Operators

```text
<condition> AND <condition>
<condition> OR <condition>
NOT <condition>
```

---

#### 4.8.4 Boolean Constants

```text
TRUE
FALSE
```

---

### 4.9 VARIABLES

Mirrors the **Variables** category.

Creation is handled verbally (“make a variable called …”). In pseudocode we just use:

```text
SET score TO 0
CHANGE score BY 1
SET bird_y TO 2
SET obstacles TO []
```

This corresponds to MakeCode’s:

- `set score to 0`
- `change score by 1`

We do not introduce extra syntax beyond `SET` and `CHANGE`.

---

### 4.10 MATHS

Mirrors the **Math** category.

#### 4.10.1 Arithmetic

```text
<Expression> + <Expression>
<Expression> - <Expression>
<Expression> * <Expression>
<Expression> / <Expression>
```

---

#### 4.10.2 Remainder

```text
remainder of <Expression> divided by <Expression>
```

---

#### 4.10.3 Random

```text
[random number from <a> to <b>]
[random true or false]
```

---

#### 4.10.4 Min, Max, Constrain, Map

```text
min of <Expression> and <Expression>
max of <Expression> and <Expression>

constrain <value> between <low> and <high>

map <value> from <low1>..<high1> to <low2>..<high2>
```

---

#### 4.10.5 Absolute, Root, Rounding

```text
absolute of <Expression>
square root of <Expression>
round <Expression>
```

*(Optionally, for older learners: `floor`, `ceiling`, `truncate`.)*

---

#### 4.10.6 Constants and Advanced (Optional)

```text
pi
e

<Expression> to the power of <Expression>
sine of <Expression>
cosine of <Expression>
tangent of <Expression>
arcsine of <Expression>
arccosine of <Expression>
arctangent of <Expression>
```

These are not all blocks in MakeCode, but may be useful in advanced contexts.

---

### 4.11 FUNCTIONS

Mirrors the **Functions** category.

#### 4.11.1 Define a Function

MakeCode: `function doSomething()`

```text
FUNCTION name (optional_parameters)
    ...
END FUNCTION
```

For KS2 we usually omit parameters:

```text
FUNCTION reset_game
    SET score TO 0
    SET life TO 3
END FUNCTION
```

---

#### 4.11.2 Call a Function

```text
CALL reset_game
```

If you prefer, you can omit `CALL` and just write:

```text
reset_game()
```

Both forms map to the same idea as the “call function” block.

---

### 4.12 ARRAYS

Mirrors the **Arrays** category.

#### 4.12.1 Create

```text
SET list TO [0, 1, 2]
SET text_list TO ["a", "b", "c"]
SET list TO []
```

---

#### 4.12.2 Read

```text
length of list
list[<index>]
get item at <index> from list
get and remove item at <index> from list
get and remove first item from list
get and remove last item from list
get random item from list
```

---

#### 4.12.3 Modify

```text
SET list[<index>] TO <Expression>
append <Expression> TO list
remove first item from list
remove last item from list
insert <Expression> AT BEGINNING OF list
insert <Expression> AT <index> IN list
remove item AT <index> FROM list
```

---

#### 4.12.4 Operations

```text
index of <value> in list
reverse list
```

Indexes start at 0.

---

### 4.13 TEXT

Mirrors the **Text** category.

#### 4.13.1 Basic Text

```text
""
"Hello"
"Crashy Bird"
length of <TextExpression>
join <TextExpression1> and <TextExpression2>
```

---

#### 4.13.2 Conversions

```text
number from text <TextExpression>
text from number <Expression>
```

---

#### 4.13.3 Splitting, Searching, Substrings

```text
split <text> at <separator>
<text> includes <search_text>
index of <search_text> in <text>
<text> is empty
substring of <text> from <start_index> length <length>
compare <text1> to <text2>
char from <text> at <index>
char code from <text> at <index>
text from char code <number>
```

---

### 4.14 GAME

Mirrors the **Game** category.

Sprites:

```text
SET sprite TO CREATE SPRITE AT (x, y)
DELETE sprite
sprite IS DELETED
MOVE sprite BY <steps>
TURN sprite RIGHT BY <degrees>
TURN sprite LEFT BY <degrees>
CHANGE sprite X BY <value>
CHANGE sprite Y BY <value>
SET sprite X TO <value>
SET sprite Y TO <value>
X POSITION OF sprite
Y POSITION OF sprite
sprite IS TOUCHING other_sprite
sprite IS TOUCHING EDGE
IF sprite IS TOUCHING EDGE THEN
    BOUNCE sprite
END IF
```

Lives and score:

```text
REMOVE LIFE <value>
ADD LIFE <value>
SET LIFE TO <value>

SET SCORE TO <value>
CHANGE SCORE BY <value>
SCORE
```

Countdown and game state:

```text
START COUNTDOWN <milliseconds>
GAME OVER
GAME IS OVER
GAME IS PAUSED
GAME IS RUNNING
GAME PAUSE
GAME RESUME
```

---

### 4.15 IMAGES

Mirrors the **Images** category.

```text
SHOW IMAGE <image> AT OFFSET <offset>
SCROLL IMAGE <image> WITH OFFSET <offset> INTERVAL <milliseconds>

SET my_image TO CREATE IMAGE:
    row1
    row2
    row3
    row4
    row5

SET my_big_image TO CREATE BIG IMAGE:
    row1
    row2
    row3
    row4
    row5

ICON <icon_name>
ARROW <direction>
```

---

### 4.16 PINS

Mirrors the **Pins** category (including **More…**).

Digital:

```text
[digital reading from P0]
SET digital pin P0 TO <0_or_1>
```

Analog:

```text
[analog reading from P0]
SET analog pin P0 TO <value_0_to_1023>
SET analog period of P0 TO <microseconds>
map <value> from <low1>..<high1> to <low2>..<high2>
```

Audio and servo:

```text
SET audio pin TO P0
SET audio pin enabled TO TRUE/FALSE

SET servo on P0 TO angle <degrees>
SET servo pulse on P0 TO <microseconds>
```

More / pull / events / I2C / SPI:

```text
SET pull of P0 TO up/down/none
SET P0 TO EMIT EDGE EVENTS
SET pitch pin TO P0

WHEN [pin P0 is pulsed high/low] DO
    ...
END WHEN
[pulse duration us]
pulse in us on P0 pulsed high/low

i2c read number at address <addr> format <format> repeated <TRUE_or_FALSE>
i2c write number <value> to address <addr> format <format> repeated <TRUE_or_FALSE>

SET spi frequency TO <value>
SET spi format TO <bits> bits MODE <mode>
spi write <value>
SET spi pins TO MOSI <pin> MISO <pin> SCK <pin>
```

---

### 4.17 SERIAL

Mirrors the **Serial** category.

Write:

```text
serial write line <TextExpression>
serial write number <Expression>
serial write value <TextExpression> = <Expression>
serial write string <TextExpression>
serial write numbers <array_variable>
```

Read:

```text
SET text TO serial read line
SET text TO serial read until <delimiter>
SET text TO serial read string

WHEN [serial data received <delimiter>] DO
    ...
END WHEN
```

Redirect and advanced:

```text
serial redirect TX <pin_tx> RX <pin_rx> baud <baud_rate>
serial redirect to USB

serial set tx buffer size TO <size>
serial set rx buffer size TO <size>
serial write buffer <buffer_variable>
SET buffer_variable TO serial read buffer
serial set write line padding TO <value>
serial set baud rate TO <baud_rate>
```

---

### 4.18 CONTROL

Mirrors the **Control** category.

Events and background:

```text
WAIT FOR EVENT FROM <source> WITH VALUE <value>

RUN IN BACKGROUND:
    ...
END BACKGROUND
```

Time and reset:

```text
[time ms]
wait <microseconds> us
RESET DEVICE
```

Events:

```text
RAISE EVENT FROM <source> WITH VALUE <value>

WHEN [event from <source> with value <value>] DO
    ...
END WHEN

[event timestamp]
[event value]
```

---

## Appendix A — Advanced Notes for Instructors

This appendix contains guidance for adults using the spec with children.

### A.1 Time and Loops

- `FOREVER` + `pause` vs `EVERY`:
  - Use `FOREVER` + `pause` for simple game loops.
  - Use `EVERY` when you want a clean “tick” separate from other logic.
- Avoid nested `FOREVER` blocks.

### A.2 Randomness

- Always explain that random blocks produce **numbers**, not text or sprites directly.
- For arrays, emphasise:  
  “Choose a random index, then use that index to read from the array.”

### A.3 Arrays and Indexing

- First element is always index **0**.
- Use number lines or box diagrams on the board to reinforce this.
- Encourage children to trace through examples manually.

### A.4 Events vs Polling

- Highlight the difference between:
  - reacting to `WHEN [button A is pressed] DO …`
  - and checking `[button A is pressed]` inside `FOREVER`.
- For radio, input and serial, prefer events when available.

### A.5 Error Patterns to Watch For

- Off-by-one errors in loops and random ranges.
- Forgetting to update arrays when sprites are deleted.
- Comparing only x or only y in collisions.
- Mixing up assignment (`SET score TO 0`) with comparison (`score = 0`).

### A.6 Suggested Progression

- Start with:
  - Basic, Input, LED.
- Then add:
  - Music, simple Loops, Variables.
- Then:
  - Arrays, Text, Game, Radio.
- Finally (optional for older KS2 / KS3):
  - Control, Serial, Pins, complex Maths.

---

*End of Tech Tinker Club Microbit Pseudocode Specification (v2).*
