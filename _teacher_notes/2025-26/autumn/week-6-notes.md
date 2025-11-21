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

## Recap from Week 5 — PRIMM and Loops (5–10 min)

Start by briefly reminding participants what they did last week:

- They worked through a **PRIMM** activity with:  
  - a countdown,  
  - a **button lock** (`btnlock`),  
  - a timed sparkle effect,  
  - a sweeping fill/clear pattern using **nested loops**.  
- They practised **predicting** what a program would do, then **running**, **investigating**, and **modifying** it.  
- They also saw the **beginning** of the Barrel Jumper project — just the **ON START** setup for sprites, speed, and score.

You might say:

> “Last week we spent a lot of time looking *inside* someone else’s code and understanding how it worked.  
> This week, we’ll use the same ideas — loops, conditions, variables — to finish our own game.”

Check a few key ideas with quick questions:

- “What does a `FOREVER` loop do?”  
- “What is a sprite?”  
- “Why might a game need a score variable?”

No need to go into deep detail here — the main goal is to reconnect loops and events in their minds.

---

## Session Flow (≈ 80 minutes)

1. **Recap & warm‑up (10 min)** – quick Q&A about loops, sprites, and the Week 5 PRIMM demo.  
2. **Part A – Rebuild the ON START section (10–15 min)** – intro picture, sprites, `speed`, and `score`.  
3. **Part B – Add the jump control (10–15 min)** – Button B moves the jumper up and down.  
4. **Part C – Add barrel movement & bouncing (15–20 min)** – FOREVER loop for the obstacle.  
5. **Part D – Add scoring and difficulty (10–15 min)** – tracking score and making the game faster.  
6. **Part E – Add collision and game over (5–10 min)** – detecting when the jumper hits the barrel.  
7. **Wrap‑up (5–10 min)** – reflection, show‑and‑tell, and ideas for next time.

You can flex timings depending on how quickly participants debug their games.

---
### Blocks version (MakeCode)

<div class="makecode-embed">
<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S50863-44059-71252-00559" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>
</div>

# Part A — ON START: Intro Screen, Sprites, and Variables

In Week 5 participants already saw the idea of an ON START section that:

- shows a simple picture,  
- creates sprites,  
- sets up variables.

In Week 6, you can either:

- quickly rebuild it from scratch together, or  
- provide a starter project that already has ON START complete.

---

## A1 — TTC Pseudocode: ON START

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

### Instructor Notes

Key points to emphasise:

- **Sprites and coordinates:**  
  - `(0, 4)` is bottom‑left → the jumper starts on the “ground”.  
  - `(4, 4)` is bottom‑right → the barrel starts on the opposite side.

- **Variables:**  
  - `speed` decides how long the game waits between barrel movements.  
  - `score` will count how many times the barrel passes safely.

You can ask:

- “What might happen if we started the jumper at the top instead?”  
- “What would a bigger `speed` value do to the game?”

---

# Part B — Jump Control (Button B)

Now we add a way for the player to jump over the barrel.

The idea: when Button B is pressed, the jumper moves **up** several steps, then **down** again.

---

## B1 — TTC Pseudocode: Button B

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

### Instructor Notes

Key ideas:

- Changing `y` by **−1** moves the sprite **up**; changing `y` by **+1** moves it **down**.  
- The two REPEAT loops give a smooth jump arc: up 4 steps, then down 4 steps.  
- The pauses make the animation visible.

Questions to explore:

- “What would happen if we only went up 2 times but down 4?”  
- “What if we made the PAUSE `50 ms` instead of `100 ms`?”  
- “Could we make a double‑jump by repeating this pattern twice?”

Participants should now have a micro:bit that shows the intro picture and can “jump” on Button B, even though nothing moves yet.

---

# Part C — Barrel Movement and Bouncing (FOREVER Loop)

Now we give the barrel life. It should:

- move across the row,  
- bounce off each edge,  
- keep going as long as the game runs.

This is where the **FOREVER loop** becomes the game’s “engine”.

---

## C1 — TTC Pseudocode: Basic Game Loop (Movement Only)

```text
FOREVER DO
    MOVE barrel BY 1 STEP

    IF barrel IS ON EDGE THEN
        BOUNCE barrel
    END IF

    PAUSE speed ms
END FOREVER
```

### Instructor Notes

Explain that:

- The FOREVER loop repeats again and again until the program ends.  
- `MOVE barrel BY 1 STEP` moves the sprite in its current direction.  
- `BOUNCE` reverses direction when the barrel hits an edge.  
- `PAUSE speed ms` controls how quickly the barrel moves.

Good prompts:

- “If we halve the `speed`, what happens to the game difficulty?”  
- “What would happen if we removed the PAUSE altogether?”

At this stage, participants can see the barrel moving and bouncing while they test the jump timing, even though there is no scoring or game over yet.

---

# Part D — Scoring and Difficulty (Score + Speed)

Now we reward the player for surviving. Each time the barrel passes across the screen (reaching `x = 0`), we:

- increase `score` by 1  
- reduce `speed` slightly to make the game harder

---

## D1 — TTC Pseudocode: Adding Score and Speed Change

Extend the FOREVER loop with this extra block near the end:

```text
    IF [x position of barrel] = 0 THEN
        CHANGE score BY 1
        CHANGE speed BY -10
    END IF
```

So the full loop becomes:

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

### Instructor Notes

Explain what this section does:

- **`[x position of barrel] = 0`** means the barrel has reached the left edge.  
- Each time this happens, we assume the jumper has successfully dodged it and:  
  - increase `score` by 1,  
  - reduce `speed` so the barrel moves faster next time.

Discussion ideas:

- “What might happen if we reduce speed by a bigger amount (for example, −20)?”  
- “Could the speed ever become too small or even negative? What would that feel like?”

You can encourage participants to experiment with different difficulty curves.

---

# Part E — Collision and Game Over

Finally, we end the game when the barrel hits the jumper.  
We also show the final score.

---

## E1 — TTC Pseudocode: Collision Check and Game Over

Add this to the FOREVER loop **after** the barrel moves and pauses (order matters):

```text
    IF jumper IS TOUCHING barrel THEN
        GAME OVER
        SHOW TEXT "Score:"
        SHOW NUMBER score
        STOP PROGRAM
    END IF
```

### Full Game Loop (All Together)

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

### Instructor Notes

Key ideas:

- The **collision check** must come **after** the barrel movement and pause so we are checking the current positions.  
- `STOP PROGRAM` here just means “nothing else will change after showing the score”.

Ask participants:

- “What happens if we put the score update above the collision check?”  
- “Do you think the score should increase when we crash, or only when we survive a full pass?”

This is a good opportunity to let them make small design decisions and justify them.

---

## Differentiation

**Support:**

- Give a partially completed program with:  
  - ON START done,  
  - jump built,  
  - FOREVER loop skeleton ready,  
  and let participants fill in only missing pieces (e.g., collision or scoring).  
- Provide a printed version of the pseudocode so they can tick off each line as they implement it.

**Extend:**

- Allow confident participants to:  
  - add sound effects (jump / crash),  
  - add lives (3 hearts → decrement on each hit),  
  - add a “level” variable based on score thresholds,  
  - show a different message if they reach a very high score.

---

## Assessment & Evidence of Learning

Look for:

- Participants who can explain **why** the FOREVER loop is needed.  
- Participants who can describe what `speed` and `score` are doing in the game.  
- Participants who adjust values (like `speed` or the score increment) and can predict what will happen before testing.

Quick formative checks:

- “Explain in your own words what happens inside the FOREVER loop.”  
- “Point to where the game decides that it is over.”  
- “Show me where the difficulty increases.”

Make brief notes about participants who are ready to:  
- help others debug,  
- suggest their own small enhancements,  
- reason about code without immediately running it.

---

## Troubleshooting & Common Issues

- **Game is too fast / too slow**  
  - Check the starting value of `speed`.  
  - Check that `CHANGE speed BY -10` is not accidentally `+10`.

- **Score never changes**  
  - Check the condition is `[x position of barrel] = 0`.  
  - Confirm it is inside the FOREVER loop, not outside.

- **Game never ends**  
  - Collision check may be missing or placed incorrectly.  
  - Check that the condition uses `jumper IS TOUCHING barrel`.

- **Barrel disappears or behaves oddly**  
  - Ensure `MOVE` and `BOUNCE` are always applied to **barrel**, not to `jumper`.  
  - Check that there is only one barrel sprite.

Encourage participants to read their code out loud following the pseudocode.

---

## Reflection & Wrap‑Up

Finish with a short conversation or mini‑plenary:

- “What part of the game logic was hardest to understand at first?”  
- “How did loops help us keep the code short?”  
- “Where do we use variables to control how the game feels?”  
- “If you had more time, what would you add to Barrel Jumper?”

You can invite a few participants to show their version of the game and explain one change they made (e.g. different speed curve, different picture, extra sounds).

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
