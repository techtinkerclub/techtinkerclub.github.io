---
layout: single
title: "Instructor Notes — Week 5"
permalink: /teacher_notes/2025-26/autumn/week-5-notes/
week: 5
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

# Instructor Notes — Week 5

**Theme:** Inputs, Patterns, and Timing  
**Focus Concept:** Reading and reasoning about loops, timing, and events (PRIMM)  
**Mini‑Project:** Complex PRIMM demo (*sparkle + sweep*) and a **preview build** of *Barrel Jumper* (On Start only)

---

## Learning Objectives

By the end of this session, participants should be able to:

- Read and explain TTC‑style **pseudocode** for a multi‑step program.  
- Describe how **loops** and **nested loops** create patterns on the LED grid.  
- Explain how a program can use **system time** (`[milliseconds since start]`) to control how long something runs.  
- Understand the role of a **state variable** (like `btnlock`) in enabling or blocking other parts of a program.  
- Recognise the difference between **start‑up code** (ON START) and **event‑driven code** (button presses).

---

## Vocabulary Focus

You do not need to test these formally, but it helps to use them aloud:

- **event** – something the micro:bit reacts to (e.g. WHEN button A is pressed).  
- **loop** – a set of instructions that repeat.  
- **nested loop** – a loop inside another loop.  
- **variable** – a named storage place for a value that can change.  
- **state** – what “mode” the program is in (for example, locked or unlocked).  
- **sprite** – a movable object on the LED grid (used later in *Barrel Jumper*).  
- **system time** – the internal clock the micro:bit uses to measure milliseconds.

Try to model sentences like:

> “This loop repeats 6 times.”  
> “This variable keeps track of whether the buttons are locked.”  
> “System time tells us how long the animation has been running.”

---

## Session Flow (≈ 80 minutes)

1. **Starter (5–10 min)** – quick recap of loops and button events from previous weeks.  
2. **Part A – PRIMM Deep Dive (30–35 min)** – complex demo with countdown, random sparkle, nested sweep animation.  
3. **Part B – Rebuild PRIMM in blocks (15–20 min)** – participants recreate all or part of the program.  
4. **Part C – Barrel Jumper Preview (10–15 min)** – build only the **ON START** section of the game and talk through what comes next.  
5. **Wrap‑up (5–10 min)** – reflection questions and “what we’ll do in Week 6”.

Timing can flex slightly depending on how quickly participants get through the PRIMM Investigate step.

---

# Part A — PRIMM Deep Dive: Sparkle and Sweep Demo

We use a single program that ties together:

- a **countdown**  
- a **button lock** (`btnlock`)  
- a **random sparkle** effect on button A with a **10‑second timer**  
- a **sweeping fill + clear** pattern on button B using **nested loops**

The aim is to **read and reason** about the program together.

### Blocks version (MakeCode)

<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S62181-98265-95104-79112" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>
</div>

---

## A1 — TTC Pseudocode for the Full Demo

### ON START

```text
WHEN program starts DO
    SET btnlock TO 1

    SHOW ICON happy_face
    PAUSE 1000 ms
    CLEAR SCREEN

    SET counter TO 5
    REPEAT 6 TIMES
        SHOW NUMBER counter
        SET counter TO counter - 1
        PAUSE 500 ms
    END REPEAT

    SHOW ICON arrow_west
    SET btnlock TO 0
END WHEN
```

---

### Button A — Random Flicker with Time Limit

```text
WHEN button A is pressed DO
    SET timer TO [milliseconds since start]
    CLEAR SCREEN

    WHILE btnlock = 0 DO
        TOGGLE LED AT
            [random number from 0 to 4],
            [random number from 0 to 4]

        PAUSE 50 ms

        SET stoptimer TO [milliseconds since start]

        IF stoptimer > timer + 10000 THEN
            BREAK LOOP
        END IF
    END WHILE

    SHOW ICON arrow_east
END WHEN
```

---

### Button B — Sweep Fill and Sweep Clear

```text
WHEN button B is pressed DO
    CLEAR SCREEN

    WHILE btnlock = 0 DO

        FOR x FROM 0 TO 4 DO
            FOR y FROM 0 TO 4 DO
                PLOT LED AT (x, y)
                PAUSE 50 ms
            END FOR
        END FOR

        FOR y FROM 0 TO 4 DO
            FOR x FROM 0 TO 4 DO
                UNPLOT LED AT (x, y)
                PAUSE 50 ms
            END FOR
        END FOR

        BREAK LOOP
    END WHILE
END WHEN
```

---

## A2 — PRIMM Structure

You can explicitly label each stage to participants: **Predict → Run → Investigate → Modify → Make**.

### 1) Predict

Show **only the pseudocode**, not the micro:bit yet.

Guiding questions:

- “What do you think happens when the program starts?”  
- “What do you think `btnlock` is for?”  
- “What do you think button A will do?”  
- “What about button B?”

Encourage rough guesses — the goal is to get them *thinking* about structure.

---

### 2) Run

Now run the finished program on the micro:bit:

1. Show the happy face and the countdown 5 → 0.  
2. Watch the arrow pointing west.  
3. Press button A and observe the random sparkle.  
4. Press button B and watch the fill + clear pattern.  
5. Notice that both effects **stop after a while** (about 10 seconds).

Ask:

- “What did you notice?”  
- “Did anything surprise you?”  
- “Did your prediction match what happened?”

---

### 3) Investigate — Detailed Walkthrough

This is where you slow down and work through line by line.

#### ON START — Countdown and Button Lock

Key points to highlight:

- `SET btnlock TO 1` means **buttons are locked** at first.  
- The happy face + pause is just a friendly intro.  
- `counter` starts at 5 and the **REPEAT 6 TIMES** loop shows:

  - 5, then 4, then 3, then 2, then 1, then 0  

- After the loop ends, `btnlock` is set to 0 → **buttons now work**.

Good questions:

- “Why do we need 6 loops if we start at 5?”  
- “What would happen if we only repeated 5 times?”

You can sketch a small table on the board:

| loop number | shown | new counter |
|------------:|-------|-------------|
| 1           | 5     | 4           |
| 2           | 4     | 3           |
| 3           | 3     | 2           |
| 4           | 2     | 1           |
| 5           | 1     | 0           |
| 6           | 0     | -1          |

Explain that the program doesn’t “know” about 0 — it just repeats 6 times.

---

#### Button A — Random Flicker with Timer

Focus on the concept of **system time**:

- `[milliseconds since start]` is the micro:bit’s internal clock.  
- `timer` remembers the **time when the button was pressed**.  
- `stoptimer` is updated each loop.

We compare:

- `stoptimer` with `timer + 10000`  
- If more than 10 000 ms (10 seconds) have passed → `BREAK LOOP`.

Ask participants:

- “What would happen if the `IF` condition was removed?”  
- “What if we changed 10 000 to 5 000?”  
- “What if we removed the `PAUSE 50 ms`?”

Emphasise:

> “The WHILE loop itself doesn’t know when to stop. The IF + BREAK give it a way out.”

---

#### Button B — Sweep Pattern with Nested Loops

Explain visually using the board:

- First **FOR x** 0 → 4, inside that **FOR y** 0 → 4.  
- This visits every (x, y) pair in order.  
- The first pair of nested loops **plots** LEDs → fills the screen.  
- The second pair **unplots** LEDs → clears the screen.

Good questions:

- “Which loop controls columns, and which controls rows?”  
- “How many LEDs will be turned on in total before we start clearing?”  
- “What is the purpose of `BREAK LOOP` at the end?”

Reinforce that nested loops are powerful: a short bit of code can affect **many** LEDs in a structured way.

---

### 4) Modify

Offer small, safe modifications that participants can make:

- Change the **speed** of the sparkle (`PAUSE 50 ms` → `PAUSE 100 ms`).  
- Change the **total time** (`10000` → `5000`).  
- Change the **order** of the sweep loops (swap x and y) and see how the pattern feels different.  
- Change the **countdown start** (e.g. start at 3 instead of 5).

Encourage them to predict the effect **before** testing.

---

### 5) Make

Finally, invite participants to design their own variation:

- A custom countdown image sequence instead of numbers.  
- A sparkle that stops when both buttons are pressed together.  
- A fill pattern that draws a diagonal instead of column/row sweeps.

These “make” ideas can be simple; the important thing is that participants feel they can **change** the code on purpose.

---

# Part B — Barrel Jumper (Week 5 Preview Only)

In Week 5, we **only build the starting setup**:

- Intro picture (a simple frame / character).  
- Creating the **jumper** and **barrel** sprites.  
- Initial `speed` and `score`.  

The jump mechanic and the full forever loop (movement, scoring, game over) are built in **Week 6**.

### Blocks version (MakeCode)

<div class="makecode-embed">
<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S50863-44059-71252-00559" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>
</div>

---

## B1 — TTC Pseudocode (Week 5 Version)

### ON START (Game Setup Only)

```text
WHEN program starts DO
    SHOW PICTURE:
        . # # # .
        # . # . #
        # . # . #
        # . # . #
        . # # # .

    PAUSE 200 ms

    SET jumper TO NEW SPRITE AT (0, 4)
    SET barrel TO NEW SPRITE AT (4, 4)

    SET speed TO 200
    SET score TO 0
END WHEN
```

You can either draw the picture on the board or refer to it as “a frame / little character”.

At this stage, **do not** build:

- the jump,  
- barrel movement,  
- collision detection,  
- score changes,  
- speed changes.

Those belong to Week 6’s extended build.

---

## B2 — Instructor Notes for Barrel Jumper Intro

Key ideas to highlight:

- **Sprites and coordinates** –  
  - `(0, 4)` is bottom‑left.  
  - `(4, 4)` is bottom‑right.  
- **Variables for behaviour** –  
  - `speed` controls how fast things will move later.  
  - `score` will track progress in the future game.  

You can tell participants:

> “This week, we are just setting the stage.  
> Next week, we will make the barrel move and try to dodge it.”

Make sure they see the link:

- Today: reading and understanding a complex, pre‑written program (PRIMM).  
- Next week: applying those ideas to build and improve their own game.

---

# Differentiation

**Support:**

- Provide a printed or on‑screen version of the pseudocode with key lines highlighted.  
- Let some participants focus only on **ON START + Button A**, if the full program feels overwhelming.  
- Use physical grids (5×5 drawn on paper) so participants can trace LED patterns without staring at the screen.

**Extend:**

- Let confident participants design their own sweep patterns (different loop orders).  
- Invite them to change the sparkle so that it **slows down** or **speeds up** over time.  
- Ask them to design an alternative Barrel Jumper intro screen (different picture, same logic).

---

# Assessment & Evidence of Learning

Look for:

- Participants explaining what a loop does in their own words.  
- Participants describing the difference between **WHILE** and **REPEAT n TIMES**.  
- Participants correctly reasoning about the 10‑second timer (they may say “it keeps checking the time until 10 seconds have passed”).  
- Participants placing sprites correctly based on `(x, y)`.

Quick checks you can use:

- “Show me on the grid: where is (0, 4)? Where is (4, 4)?”  
- “What does this condition mean: `stoptimer > timer + 10000`?”

---

# Troubleshooting & Common Issues

- **Buttons do nothing:**  
  - Often `btnlock` never gets set to 0. Check ON START is running and the countdown finishes.  

- **Sparkle never stops:**  
  - The BREAK might be missing, or the comparison uses the wrong sign or number.  

- **Sweep pattern looks wrong:**  
  - Loops might be nested in the wrong order or the wrong variable used for x / y.

Encourage participants to **read the pseudocode out loud** when debugging.

---

# Reflection & Wrap‑Up

End with a short discussion:

- “Which part of today’s program felt most confusing at first?”  
- “How did the pseudocode help you understand what was going on?”  
- “Where did we use loops inside loops?”  
- “What are you most excited to add to Barrel Jumper next week?”

You can also invite a few participants to show their favourite modification or pattern.

---

{% include back-to-autumn.html %}
