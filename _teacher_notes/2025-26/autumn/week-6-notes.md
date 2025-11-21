---
layout: single
title: ""
permalink: /teacher_notes/2025-26/autumn/week-6-notes/
week: 6
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

# Instructor Notes — Week 6

**Theme:** Loops, Timing, and Game Logic  
**Focus Concept:** Using loops, conditions, and variables together in a complete game  
**Mini‑Project:** *Barrel Jumper* — from intro screen to full playable game (movement, scoring, and difficulty)

---

## Learning Objectives

By the end of this session, participants should be able to:

- Read and explain **TTC‑style pseudocode** for a small game.  
- Use **loops** (including `FOREVER` and `REPEAT`) to control game behaviour.  
- Describe how **sprites** move, bounce, and detect collisions on the LED grid.  
- Explain how **variables** (like `score` and `speed`) can track progress and change difficulty.  
- Connect the ideas from Week 5’s PRIMM demo (loops + timing) to a self‑built game.

---

## Vocabulary Focus

Revisit and extend vocabulary from Week 5:

- **loop** – a set of instructions that repeat.  
- **FOREVER loop** – a loop that never stops until the program ends.  
- **condition** – a yes/no question the program checks (used in IF).  
- **collision** – when two sprites touch (occupy the same LED).  
- **sprite** – a movable object on the LED grid.  
- **variable** – a named place where we store a value that can change.  
- **score** – a variable used to track how well the player is doing.  
- **difficulty** – how hard the game feels; here controlled by `speed`.

Model sentences like:

> “This FOREVER loop keeps the game running.”  
> “The condition checks whether the jumper is touching the barrel.”  
> “We change the speed variable to make the game harder over time.”

---

## Session Flow (≈ 80 minutes)

1. **Part A – Recap & loop warm‑up (15–20 min)** – quick recap of Week 5 PRIMM and a short loop‑reasoning warm‑up.  
2. **Part B – *Barrel Jumper* full build (50–55 min)** – from ON START to full game loop with scoring and collision.  
3. **Wrap‑up (5–10 min)** – reflection, show‑and‑tell, and ideas for extending the game.

You can flex timings depending on how quickly participants debug their games.

---

# Part A — Recap & Loop Reasoning Warm‑Up

The goal of Part A is to **reactivate Week 5 ideas** and put loops firmly back in participants’ heads before they build a game.

You are mainly drawing connections between:

- the **PRIMM sparkle + sweep** program from Week 5, and  
- the **FOREVER + REPEAT loops** they are about to use in *Barrel Jumper*.

---

## A1 — Verbal Recap of Week 5 (5–10 min)

Remind participants what they did in Week 5:

- They worked through a **PRIMM** activity that used:  
  - a countdown,  
  - a **button lock** (`btnlock`),  
  - a timed sparkle effect (using `[milliseconds since start]`),  
  - a sweeping fill/clear pattern using **nested loops**.  
- They practised:  
  - **PREDICTING** what a program would do,  
  - **RUNNING** it,  
  - **INVESTIGATING** line by line,  
  - **MODIFYING** small details (speed, time, patterns).  
- At the end, they saw the **start** of *Barrel Jumper* — the ON START block that made sprites and set up variables.

You might say:

> “Last week we looked inside a finished program and tried to understand how it worked.  
> This week we’ll use those same ideas — especially loops and timing — to finish our own game.”

Quick check questions (whole‑class, hands‑up or mini‑whiteboards):

- “What does a `FOREVER` loop do?”  
- “What is a sprite?”  
- “Why might a game need a score variable?”  
- “What did `btnlock` do in last week’s program?”

You don’t need long answers — just enough to see that basic concepts are still there.

---

## A2 — Short Loop Warm‑Up (optional mini‑task, 5–10 min)

If you have time, you can do a very quick loop “trace” on the board using TTC pseudocode, for example:

```text
SET x TO 0
REPEAT 4 TIMES
    SET x TO x + 2
END REPEAT
```

Ask:

- “What is x at the start?”  
- “What happens each time the loop runs?”  
- “What is x at the end?”

You can also link to *Barrel Jumper* by showing this pseudocode:

```text
FOREVER DO
    MOVE barrel BY 1 STEP
    PAUSE 200 ms
END FOREVER
```

Ask:

- “What part repeats here?”  
- “What would it feel like if we changed 200 ms to 100 ms?”  
- “Is there anything inside this loop that ever stops it?”

The aim is to remind them that:

- **REPEAT n TIMES** loops run a fixed number of times.  
- **FOREVER** loops never stop on their own.  
- Small changes in values (like pause times or step sizes) change the behaviour.

Once loops feel “fresh” again, move into the main build.

---

# Part B — *Barrel Jumper* Full Game Build

From this point on, the whole session focuses on building *Barrel Jumper* in stages.

You can either:

- rebuild everything live, or  
- provide a starter project with ON START already done (to save time).

For consistency with Week 5, the TTC pseudocode is given first, followed by verbose instructor notes for each step.

### Blocks version (MakeCode)

<div class="makecode-embed">
<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S50863-44059-71252-00559" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>
</div>

---

## B1 — ON START: Intro Screen, Sprites, and Variables

In Week 5 participants already saw an ON START section that:

- shows a simple picture,  
- creates sprites,  
- sets up variables.

In Week 6 you can either rebuild it or use it as a given base.

### TTC Pseudocode — ON START

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

### Instructor Notes — ON START

Key ideas to highlight:

- **Sprites and coordinates**
  - `(0, 4)` is bottom‑left → the jumper starts on the “ground” on the left.  
  - `(4, 4)` is bottom‑right → the barrel starts on the far right.

You can draw the 5×5 grid on the board and label the bottom row as `y = 4` so learners see that both sprites sit on the same “floor”.

- **Variables `speed` and `score`**
  - `speed` controls the **pause** time inside the FOREVER loop — smaller speed = shorter pause = a faster game.  
  - `score` will count how many times the player successfully survives a barrel pass.

Helpful questions:

- “What might happen if we started the jumper at the top instead of the bottom?”  
- “If we made `speed` 400 instead of 200, would the game feel easier or harder? Why?”

At the end of this step, participants should see:

- a short picture on start,  
- then a 5×5 grid with two sprites on the bottom row.

---

## B2 — Jump Control (Button B)

Now we give the player something to do: **jump over the barrel**.

### TTC Pseudocode — Jump

```text
WHEN button B is pressed DO
    REPEAT 4 TIMES
        CHANGE jumper y BY -1
        PAUSE 100 ms
    END REPEAT

    REPEAT 4 TIMES
        CHANGE jumper y BY +1
        PAUSE 100 ms
    END REPEAT
END WHEN
```

### Instructor Notes — Jump

Key concepts:

- `CHANGE jumper y BY -1` moves the sprite **up one row**.  
- `CHANGE jumper y BY +1` moves it **down one row**.  
- The two REPEAT loops create a full jump arc: up 4 steps, then down 4 steps.  
- The pauses make the motion visible instead of instant.

You can act this out physically:

- Ask one participant to “be the jumper”: take 4 steps forward (up), then 4 steps back (down).  
- Link each step to “one loop run” in the REPEAT.

Questions to explore:

- “What would happen if we only went up 2 times but down 4?” (Jumper would end up off the bottom of the grid.)  
- “What if we changed the PAUSE from 100 ms to 50 ms?” (Jump would be quicker and harder to time.)  
- “Could we make a double‑jump by repeating this whole block twice?”

At this point, they can press Button B and see the jumper “hop” even though the barrel is not moving yet.

---

## B3 — Barrel Movement & Bouncing (FOREVER Loop — Movement Only)

The barrel needs continuous movement to turn this into a game. This is the first time in this unit that the **FOREVER loop** is used to drive game behaviour.

### TTC Pseudocode — Basic Game Loop

```text
FOREVER DO
    MOVE barrel BY 1 STEP

    IF barrel IS ON EDGE THEN
        BOUNCE barrel
    END IF

    PAUSE speed ms
END FOREVER
```

### Instructor Notes — Movement Loop

Explain clearly what happens in order:

1. **MOVE barrel BY 1 STEP**  
   - The barrel moves one LED in its current direction.  
   - At the start this will be from right to left (depending on how the sprite was created).

2. **IF barrel IS ON EDGE THEN BOUNCE**  
   - When the barrel reaches either left or right edge, it flips direction.  
   - This makes it go back and forth across the bottom row.

3. **PAUSE speed ms**  
   - This pause controls the game’s rhythm.  
   - Changing `speed` changes how quickly the barrel moves.

Link this back to the warm‑up:

> “Just like in our small FOREVER examples, the loop never stops.  
> It keeps moving the barrel, bouncing, and waiting, again and again.”

Prompts for reasoning:

- “If we halve the `speed`, what happens to the difficulty?”  
- “What if we removed the PAUSE completely — would it still feel playable?”  
- “Does anything inside this loop ever stop it?” (Answer: No — that happens later with GAME OVER.)

Once this step is complete, participants can test:

- The barrel slides left and right on the bottom row.  
- The jumper can jump, but hits don’t matter yet — no scoring or game over.

---

## B4 — Scoring and Difficulty (Score + Speed)

Now we add a simple form of **progress** and **difficulty increase**.

Each time the barrel reaches the left edge (`x = 0`), we:

- assume the jumper has successfully avoided it,  
- increase `score` by 1,  
- decrease `speed` to make the next pass a bit faster.

### TTC Pseudocode — Add Score and Speed Change

This logic extends the FOREVER loop. After the pause, add:

```text
    IF [x position of barrel] = 0 THEN
        CHANGE score BY 1
        CHANGE speed BY -10
    END IF
```

So the loop becomes:

```text
FOREVER DO
    MOVE barrel BY 1 STEP

    IF barrel IS ON EDGE THEN
        BOUNCE barrel
    END IF

    PAUSE speed ms

    IF [x position of barrel] = 0 THEN
        CHANGE score BY 1
        CHANGE speed BY -10
    END IF
END FOREVER
```

### Instructor Notes — Score & Speed

Talk through what happens over time:

- On the **first pass**, speed = 200 ms.  
- When the barrel reaches `x = 0`, score becomes 1 and speed becomes 190.  
- Next pass: barrel moves slightly faster.  
- Over multiple passes, the game ramps up in difficulty as speed gets smaller.

Good discussion questions:

- “What might happen if we used −20 instead of −10?”  
- “Can speed ever go below 0? What would that do?”  
- “Is it fair if the game gets too fast too quickly?”

Encourage participants to **predict** and then **test** different values.  
This is a nice place to connect coding to **game design** and **balancing difficulty**.

---

## B5 — Collision and Game Over

Finally, we make the game end when the jumper hits the barrel and show the final score.

### TTC Pseudocode — Collision & Game Over

Add this block inside the FOREVER loop, **after** the movement and pause:

```text
    IF jumper IS TOUCHING barrel THEN
        GAME OVER
        SHOW TEXT "Score:"
        SHOW NUMBER score
        STOP PROGRAM
    END IF
```

A full version of the loop now looks like:

```text
FOREVER DO
    MOVE barrel BY 1 STEP

    IF barrel IS ON EDGE THEN
        BOUNCE barrel
    END IF

    PAUSE speed ms

    IF jumper IS TOUCHING barrel THEN
        GAME OVER
        SHOW TEXT "Score:"
        SHOW NUMBER score
        STOP PROGRAM
    END IF

    IF [x position of barrel] = 0 THEN
        CHANGE score BY 1
        CHANGE speed BY -10
    END IF
END FOREVER
```

### Instructor Notes — Collision & Order of Checks

Key points:

- **Collision must be checked after movement and pause.**  
  That way, we are checking the **current** positions of the sprites, not the old ones.

- `jumper IS TOUCHING barrel` uses the game engine’s built‑in collision check for sprites sharing the same LED.

- `STOP PROGRAM` means that after showing the score, nothing else in the FOREVER loop will run again.

Helpful questions:

- “What happens if we put the score update above the collision check?”  
  (Children can reason about whether a crash should still earn a point.)  
- “Do you think we should show the score *before* GAME OVER, or after, or both?”  
- “Should the player see their best score somewhere?” (Extension idea.)

Once this step is in place, participants have a **fully playable game**:

- The barrel moves and bounces.  
- The jumper can jump.  
- Score increases on successful passes.  
- The game ends with a score display when a collision happens.

---

## B6 — Differentiation, Troubleshooting, and Extensions

You can keep this brief in delivery, but it is useful to have in your notes.

### Support

- Give a partially completed project with:  
  - ON START done,  
  - jump built,  
  - FOREVER loop skeleton in place,  
  and let less‑confident participants focus just on **score** or **collision**.

- Provide printed pseudocode with checkboxes so they can tick off each line as they add blocks.

- Encourage them to read their code out loud in TTC style:

  > “FOREVER do… move barrel… if on edge then bounce… pause…”

### Extend

For confident participants:

- Add **sound effects** for jump and crash.  
- Add **lives** (e.g. 3 hearts) instead of an instant game over.  
- Introduce a **“level”** variable that increases every few points and changes behaviour (for example, less speed reduction or faster jumps).  
- Change the picture, add an intro “title screen”, or display the best score across runs.

### Common Issues & Fixes

- **Game is too fast / too slow**  
  - Check the starting value of `speed`.  
  - Check that `CHANGE speed BY -10` is not accidentally `+10`.

- **Score never changes**  
  - Ensure the `[x position of barrel] = 0` check is **inside** the FOREVER loop.  
  - Check that it really is the barrel’s x‑position, not the jumper’s.

- **Game never ends**  
  - Collision check might be missing, or may be outside the FOREVER loop.  
  - Confirm the condition is `jumper IS TOUCHING barrel`.

- **Barrel disappears or behaves strangely**  
  - Ensure all MOVE and BOUNCE blocks refer to **barrel**, not `jumper`.  
  - Check that you only create one barrel sprite.

---

## Reflection & Wrap‑Up

Finish with a short conversation or mini‑plenary:

- “What part of the game logic was hardest to understand at first?”  
- “How did loops help us keep the game short but powerful?”  
- “Where do we use variables to control how the game feels?”  
- “If you had more time, what would you add to *Barrel Jumper*?”

Invite a few participants to show their version of the game and describe **one deliberate change** they made (for example, different speed curve, extra sounds, or a new picture).

---

<div class="notice--steam">
  <h2>Connections to STEAM Learning &amp; Real‑World Links</h2>
  <ul>
    <li><strong>Computing:</strong> Participants see how loops, conditions, and variables combine to create an interactive system that reacts in real time.</li>
    <li><strong>Maths:</strong> They reason about numbers, simple arithmetic on variables (like changing speed and score), and informal ideas of <strong>rates</strong> and <strong>scaling</strong>.</li>
    <li><strong>Art &amp; Design:</strong> They make choices about icons, timing, and feedback to keep the game readable and enjoyable.</li>
    <li><strong>Engineering:</strong> They iteratively improve the “user experience” of the game — controls, clarity, and difficulty.</li>
    <li><em>Real world:</em> You can connect this to real games and apps, where designers tweak variables to keep things challenging but fair.</li>
  </ul>
</div>

{% include back-to-autumn.html %}
