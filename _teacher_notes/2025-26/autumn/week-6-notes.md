---
layout: single
title: ""
permalink: /instructor-notes/2025-26/autumn/week-6-notes/
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

# Instructor Notes — Week 6
{% include print-to-pdf.html %}

**Theme:** Game Loops, Timing & Score  
**Focus Concept:** Using Loops and Variables to Control Game Mechanics  
**Mini-Project:** Barrel Jumper — building the playable version

---

## Learning Objectives
- Participants recall what a **loop** is and how it repeats code automatically.  
- Participants understand how **pause time** controls **game speed**.  
- Participants use a **forever loop** as a continuous **game engine**.  
- Participants use **variables** to manage `score` and `speed`.  
- Participants can explain how **coordinates** control sprite position.  
- Participants can link **speed** and **score** to make the game harder over time.  

---

## Recap (≈10 min)
Review the starting point from Week 5:
- We created sprites and basic movement with a single “jump” or “move” block.  
- This week we’ll make that movement continuous and turn it into a full mini-game.  

On the board:

> “A **forever loop** is the heartbeat of a game — it keeps running while we play.”

Ask:
> “What do we need to make the game more challenging each time we score?”

Expected answers: *Make it go faster, keep track of score, or stop when you crash.*

---

## Project — *Barrel Jumper* (≈65 min)
We build the playable game step-by-step, testing each change.

---

### Step 1 — Setup
```blocks
on start
    set jumper to create sprite at x: 0 y: 4
    set barrel to create sprite at x: 4 y: 4
    set score to 0
    set speed to 200
```

🟩 **Instructor Notes**
- `jumper` = player; `barrel` = obstacle.  
- The **x** coordinate controls left–right, **y** controls up–down.  
- `speed` is the pause between movements — smaller = faster.

---

### Step 2 — Jump Action
```blocks
on button B pressed
    repeat 4 times
        jumper change y by -1
        pause (100) ms
    repeat 4 times
        jumper change y by +1
        pause (100) ms
```

🟩 **Instructor Notes**
- Two identical loops: up then down.  
- Pause defines jump smoothness.  
- Try faster (50 ms) or slower (150 ms) jumps and compare.

💬 Ask: *“What happens if you delete one of the repeat loops?”*

---

### Step 3 — Main Game Loop
```blocks
forever
    barrel move by 1
    barrel if on edge, bounce
    pause (speed) ms
```

🟩 **Instructor Notes**
- This forever loop is the **game engine**.  
- `move by 1` slides the barrel each frame.  
- `if on edge, bounce` flips direction automatically.  
- Explain that smaller `speed` values make the game faster and harder.

💬 **Maths link:**  
1000 ms ÷ 200 ms = ≈ 5 updates per second.  
Reducing pause to 100 ms ≈ 10 updates per second.

---

### Step 4 — Add Scoring & Difficulty
```blocks
forever
    barrel move by 1
    barrel if on edge, bounce
    pause (speed) ms

    if jumper touching barrel then
        game over
        show string "Score:"
        show number score

    if barrel x = 0 then
        change score by 1
        change speed by -10
```

🟩 **Instructor Notes**
- “Touching” checks for collision between sprites.  
- When touching → **game over** ends program.  
- Each left-edge pass adds 1 point and increases speed (harder).  

💬 **Maths connection:**  
Start speed = 200 ms → after 5 points: 200 − (5 × 10) = 150 ms.

---

### Step 5 — Optional Extensions
Encourage confident participants to add:
- **Sound FX:** play tone when score increases.  
- **Limit speed:** stop at 60 ms minimum.  
- **Display score:** show number at the end.  
- **Random barrel start:** for more variation.  

---

## Vocabulary Focus
| Term | Child-friendly Definition |
|------|---------------------------|
| **Loop (forever)** | Repeats code again and again while the game runs. |
| **Variable** | A labelled box storing a value like score or speed. |
| **Increment** | Increase a variable by a fixed amount. |
| **Coordinate (x/y)** | A position on the LED grid (x = left/right, y = up/down). |
| **Condition** | A test that decides what happens next. |
| **Speed / Delay** | Pause time between updates; smaller = faster. |

---

## Differentiation
- **New coders:** build movement + basic loop.  
- **Confident:** add score and speed-up logic.  
- **Stretch:** experiment with sounds, speed limits, or randomisation.

---

## Assessment
- Can participants explain what the **forever loop** does?  
- Can they show where **score** and **speed** are used?  
- Can they predict what happens when `pause` decreases?  
- Can they identify why placing `set score to 0` inside the loop breaks the game?

---

## Common Mistakes
- Putting `set score to 0` **inside** the forever loop (resets score).  
- Forgetting to wrap movement code inside the loop.  
- Making `pause` too small → game runs too fast.  
- Using wrong coordinate (> 4 or < 0) so sprites disappear.

---

## Materials & Setup
- BBC micro:bits + USB cables  
- Chromebooks with internet access  
- Optional: headphones / speakers for sound

---

## Safety & Safeguarding
- Keep cables tidy and volume sensible.  
- Encourage turn-taking and peer support.

---

## Reflection (for leader)
- Who could explain how **speed** affects difficulty?  
- Who debugged independently?  
- Who experimented with extra features?  
- Note participants ready to mentor peers next session.

---
{% include back-to-autumn.html %}
```


<div class="notice--steam">
  <h2>Connections to STEAM Learning &amp; Real-World Links</h2>
  <ul>
    <li><strong>Computing:</strong> We will tune the <strong>game loop</strong> and <strong>difficulty scaling</strong> using variables and conditions.</li>
    <li><strong>Maths:</strong> We will explore <strong>scaling</strong> (speed vs score) and simple <strong>functions</strong> that link inputs to outputs.</li>
    <li><strong>Art &amp; Design:</strong> We will balance visuals and sound to give useful <strong>feedback</strong> without overload.</li>
    <li><strong>Engineering:</strong> We will improve <strong>usability</strong>—controls, clarity, and reset behaviour.</li>
    <li><em>Real world:</em> If time allows, we will connect this idea to everyday technology or careers.</li>
  </ul>
</div>


