
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

These commands control the micro:bit’s 5×5 LED display and simple looping.

**Display**

- `show number <Expression>`  
  Show a number on the 5×5 LED display.

- `show text <StringExpression>`  
  Scroll text across the display.

- `show icon <icon_name>`  
  Show a built-in icon, e.g. `heart`, `skull`, `duck`, `yes`, `no`, etc.

- `show icon arrow_<direction>`  
  Show an arrow icon. Direction can be:  
  `arrow_north`, `arrow_south`, `arrow_east`, `arrow_west`, `arrow_northeast`, `arrow_northwest`, `arrow_southeast`, `arrow_southwest`.

- `show leds` … `end leds`  
  Show a custom LED pattern (5×5), where 1 = ON, 0 = OFF.

  Example:
  ```text
  show leds
      0 0 1 0 0
      0 1 1 1 0
      1 1 1 1 1
      0 1 1 1 0
      0 0 1 0 0
  end leds
  ```

- `clear screen`  
  Turn off all LEDs.

**Timing and Forever**

- `pause <Expression> ms`  
  Wait for a number of milliseconds.

- `FOREVER` … `END FOREVER`  
  Repeat the inner commands forever.

---

### 4.2 INPUT

These commands and events react to buttons, gestures, pins and sensors.

**Button Events**

- `WHEN [button A is pressed] DO` … `END WHEN`  
- `WHEN [button B is pressed] DO` … `END WHEN`  
- `WHEN [buttons A and B are pressed] DO` … `END WHEN`

These fire when the corresponding button condition becomes true.

**Gesture Events**

- `WHEN [shake gesture happens] DO` … `END WHEN`  
- `WHEN [tilt left] DO` … `END WHEN`  
- `WHEN [tilt right] DO` … `END WHEN`  
- `WHEN [face up] DO` … `END WHEN`  
- `WHEN [face down] DO` … `END WHEN`  

(Teachers can pick the subset actually used.)

**Pin Events**

- `WHEN [pin P0 is pressed] DO` … `END WHEN`  
- `WHEN [pin P1 is pressed] DO` … `END WHEN`  
- `WHEN [pin P2 is pressed] DO` … `END WHEN`

**Sensor Reads**

System values (see Section 3) used inside commands and conditions:

- `[button A is pressed]`, `[button B is pressed]`  
- `[light level]`  
- `[temperature]`  
- `[sound level]` (v2 only)  
- `[acceleration x]`, `[acceleration y]`, `[acceleration z]`  
- `[compass heading]`  
- `[time ms]` / `[running time ms]`

**Configuration Commands**

- `calibrate compass`  
- `set accelerometer range <Expression> g`

---

### 4.3 LED

Pixel-level control of the micro:bit display.

- `plot <Expression> <Expression>`  
  Turn ON the LED at (x, y).

- `unplot <Expression> <Expression>`  
  Turn OFF the LED at (x, y).

- `toggle <Expression> <Expression>`  
  Flip the LED at (x, y) from ON to OFF or OFF to ON.

- `[pixel at <Expression> <Expression> is on]`  
  True if the LED at (x, y) is lit.

- `set brightness <Expression>`  
  Set display brightness (0–255).

- `[brightness]`  
  Current brightness level.

- `plot bar graph <Expression> up to <Expression>`  
  Show a vertical bar proportional to a value.

- `set display on` / `set display off`  
  Enable or disable the LED display.

- `stop animation`  
  Stop any running LED animations.

---

### 4.4 MUSIC

Tone, melody, tempo and volume.

**Tones & Rests**

- `play tone <note_name> for <Expression> beat`  
  Example: `play tone C4 for 1 beat`.

- `play tone <Expression> Hz for <Expression> beat`  
  Direct frequency version.

- `rest <Expression> beat`  
  Pause music for a number of beats.

**Melodies**

- `play melody "<pattern>" once`  
  Play once and continue when finished.

- `loop melody "<pattern>"`  
  Repeat melody until stopped.

- `stop melody`  
  Stop the current melody.

**Tempo**

- `set tempo to <Expression> bpm`  
- `change tempo by <Expression> bpm`  
- `[tempo bpm]` (optional system value)

**Volume (micro:bit v2)**

- `set volume to <Expression>`  
- `change volume by <Expression>`  
- `[volume]`  

**Global Stop**

- `stop all sounds`  
  Stop tones, melodies, sound effects.

**Sound Effects (optional, v2)**

- `play sound <identifier>`  
- `play sound <identifier> until done`  

---

### 4.5 IMAGES

Creating and using custom images.

**Built-in Icons & Arrows**

- `show icon <icon_name>`  
- `show icon arrow_<direction>`

**Custom 5×5 Images**

- `MAKE IMAGE <identifier> AS`  
  `...`  
  `END IMAGE`

Example:
```text
MAKE IMAGE heart AS
    0 1 0 1 0
    1 1 1 1 1
    1 1 1 1 1
    0 1 1 1 0
    0 0 1 0 0
END IMAGE
```

Then:

- `show icon heart`

**Big Images and Scrolling**

- `MAKE BIG IMAGE <identifier> AS` … `END BIG IMAGE`  
  (for wide scrolling patterns)

- `scroll image <identifier> at speed <Expression>`  

- `show image <identifier> at offset <Expression>`

---

### 4.6 GAME (NON-SPRITE)

Score, life, countdown and simple game flow.

**Score**

- `set score to <Expression>`  
- `change score by <Expression>`  
- `[score]`

**Life**

- `set life to <Expression>`  
- `change life by <Expression>`  
- `[life]`

**Countdown**

- `start countdown <Expression> s`  
- `[countdown]`  

Children can use `[countdown]` in conditions.

**Game Over & Messages**

- `game over`  
- `game over with win` / `game over with lose` (optional)  

- `game splash <StringExpression>`  
  Show a modal message (start of game).

- `game show long text <StringExpression>`  
  Show a longer message.

---

### 4.7 RADIO

Wireless communication between micro:bits.

**Configuration**

- `set radio group to <Expression>`  
- `set radio transmit power to <Expression>`  
- `set radio transmit serial number on`  
- `set radio transmit serial number off`

**Sending**

- `radio send number <Expression>`  
- `radio send text <StringExpression>`  
- `radio send value <StringExpression> = <Expression>` (optional)

**Receiving (events)**

- `WHEN [radio receives number] DO` … `END WHEN`  
- `WHEN [radio receives text] DO` … `END WHEN`  
- `WHEN [radio receives value] DO` … `END WHEN`

**System values while handling packets**

- `[received packet number]`  
- `[received text]`  
- `[received value name]`  
- `[received value number]`  
- `[received signal strength]`  
- `[received serial number]`

---

### 4.8 PINS

Digital, analog, servo, and advanced IO.

**Digital**

- `set digital pin Px to <Expression>`  
- `[digital reading from Px]`  

Where `Px` is `P0`, `P1`, `P2`, etc.

**Analog**

- `set analog pin Px to <Expression>`  
- `[analog reading from Px]`  

- `set analog period of Px to <Expression> us` (advanced)

**Servo**

- `set servo Px angle to <Expression>`  
- `set servo Px pulse to <Expression> us` (advanced)

**Pull Resistors**

- `set pull of Px to up`  
- `set pull of Px to down`  
- `set pull of Px to none`

**Analog Pitch on a Pin**

- `play analog pitch <Expression> Hz on Px for <Expression> ms`  

**I²C (Advanced)**

- `i2c write <Expression> to <Expression>`  
- `SET value TO i2c read number from <Expression>`

**SPI (Advanced)**

- `spi write <Expression>`  
- `set spi pins to P<MOSI> P<MISO> P<SCK>`  
- `set spi frequency to <Expression>`  
- `set spi format to <bits> bits <mode>`

---

### 4.9 SERIAL

USB or pin-based serial communication.

**Write**

- `serial write line <StringExpression>`  
- `serial write number <Expression>`  
- `serial write value <StringExpression> = <Expression>`  
- `serial write text <StringExpression>`

**Read**

- `SET var TO serial read line`  
- `SET var TO serial read until <StringExpression>`

**Redirect & Baud Rate**

- `serial redirect to usb`  
- `serial redirect TX=P0 RX=P1 at <Expression> baud`  
- `serial set baud rate to <Expression>`

**Events**

- `WHEN [serial data received <StringExpression>] DO` … `END WHEN`

**Optional Helpers**

- `serial read text`  
- `serial read buffer`  
- `serial write buffer <identifier>`  
- `serial set write line padding to <Expression>`

---

### 4.10 BLUETOOTH (OPTIONAL / ADVANCED)

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

### 4.11 TEXT (STRINGS)

Working with text values.

**Literals and Join**

- `"HELLO"`  
- `"Score: " + to_text(score)`

**Conversions**

- `to_text(<Expression>)`  
- `parse_int(<StringExpression>)`

**Length**

- `[length of <StringExpression>]`

**Substrings and Characters**

- `substr(<StringExpression>, <start>, <length>)`  
- `char_at(<StringExpression>, <index>)`

**Comparison**

- `compare(<StringExpression>, <StringExpression>)`  
  Returns 0 if equal, negative/positive otherwise.

**Optional Helpers**

- `index_of(text, search)`  
- `replace(text, old, new)`  
- `split(text, delimiter)`  
- `join(list, delimiter)`  
- `upper(text)`  
- `lower(text)`

---

### 4.12 ARRAYS / LISTS

Creating and manipulating lists.

**Create**

- `MAKE LIST <identifier> WITH <item1>, <item2>, ...`  
- `MAKE LIST <identifier> EMPTY`

**Add / Remove**

- `append <Expression> TO <list>`  
- `insert <Expression> AT <Expression> IN <list>`  
- `remove item AT <Expression> FROM <list>`  
- `remove last item FROM <list>` (if used)

**Get / Set**

- `<list>[<index>]`  
- `SET <list>[<index>] TO <Expression>`

**Length & Search**

- `[length of <list>]`  
- `index_of(<list>, <Expression>)`

**Order & Extremes**

- `reverse <list>`  
- `sort <list> ascending`  
- `sort <list> descending`  
- `[min of <list>]`  
- `[max of <list>]`

**Optional**

- `slice(<list>, <start>, <end>)`  
- `[sum of <list>]`  
- `[average of <list>]`  
- `FOR EACH item IN <list> DO` … `END FOR EACH`

---

### 4.13 SPRITES (ARCADE)

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

### 4.14 TIMING

Built on top of `pause` and system time.

**Basic**

- `pause <Expression> ms`  
- `[time ms]`  

**Forever Loop**

- `FOREVER` … `END FOREVER`

**Optional Timing Helpers**

These are conceptual TTC constructs that can be implemented using `pause` + `[time ms]`:

- `EVERY <Expression> ms DO` … `END EVERY`  
- `AFTER <Expression> ms DO` … `END AFTER`  
- `EVERY FRAME DO` … `END FRAME` (Arcade-style)

---

### 4.15 ADVANCED / EXPERIMENTAL

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


### 4.16 MATHS FUNCTIONS

This section lists all maths operations available in TTC pseudocode, matching MakeCode’s Math blocks.

#### A) Arithmetic Operators
Used inside expressions:
```
<Expression> + <Expression>
<Expression> - <Expression>
<Expression> * <Expression>
<Expression> / <Expression>
```

#### B) Remainder (Modulo)
```
remainder of <Expression> divided by <Expression>
```

#### C) Random Numbers
```
[random number from <a> to <b>]
```

#### D) Comparison Operators
```
<Expression> < <Expression>
<Expression> > <Expression>
<Expression> <= <Expression>
<Expression> >= <Expression>
<Expression> == <Expression>
<Expression> != <Expression>
```

#### E) Boolean Operators
```
<condition> AND <condition>
<condition> OR <condition>
NOT <condition>
```

#### F) Single-Value Functions
```
absolute of <Expression>
square root of <Expression>
negative of <Expression>
square of <Expression>
cube of <Expression>
round <Expression>
floor <Expression>
ceiling <Expression>
truncate <Expression>
```

#### G) Multi-Value Functions
```
max of <Expression> and <Expression>
min of <Expression> and <Expression>
```

#### H) Powers
```
<Expression> to the power of <Expression>
```

#### I) Trigonometry (Optional)
```
sine of <Expression>
cosine of <Expression>
tangent of <Expression>
arcsine of <Expression>
arccosine of <Expression>
arctangent of <Expression>
```

#### J) Constants (Optional)
```
pi
e
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
