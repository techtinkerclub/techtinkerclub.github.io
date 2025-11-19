---
layout: single
title: ""
permalink: /teacher_notes/2025-26/autumn/week-10-notes/
week: 10
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

# Instructor Notes — Week 10

**Theme:** Arrays  
**Focus Concept:** Lists, indexing and multi‑object updates  
**Mini‑Project:** *Crashy Bird* (scrolling obstacle game built in stages)

---

## Learning Objectives

By the end of this session, participants should be able to:

- Explain that an **array/list** is one variable that stores many values in order.  
- Use a **position/index** to select a value from a list.  
- Describe how a game can use an array to track multiple obstacles.  
- Build and test a simple version of Crashy Bird that uses arrays for the pipes.  

---

## Session Flow (≈ 80 min)

1. **Starter & Recap (10 min)**  
   Quick recap of variables and random numbers. Introduce the idea of “a box with many slots” → arrays.

2. **Part A – Arrays with Words & Images (15–20 min)**  
   Build a simple random chooser with a list of text options.  
   Show Rock–Paper–Scissors using an array of images.

3. **Part B – Why Games Need Arrays (10 min)**  
   Whole‑class discussion using diagrams: many pipes / enemies → one list plus a loop.

4. **Part C – Crashy Bird Build (30–35 min)**  
   Build the game in stages: player movement → game loop → obstacle list → scrolling pipes → collisions.

5. **Reflection & Extensions (5–10 min)**  
   Discuss how arrays appear in other games. Offer challenges for fast finishers.

---

# Part A – Arrays with Words and Images

### Aim

Give children an intuitive feel for arrays before they see them inside a game.  
Two short projects:

1. **Random Activity Chooser** – list of strings.  
2. **Rock–Paper–Scissors** – list of images.

### Conceptual Focus

- One variable can contain **many values**.  
- Each value has a **position** in the list (index).  
- We can pick a random position and then read the value at that position.  

---

### Pseudocode (Blocks‑style)

#### A1. Random Activity Chooser

Children build this one.

```text
on start:
    make a list of activities:
        "PE with Joe"
        "watch a movie"
        "play a board game"
        "tidy our rooms"
        "learn a song"
        "bake a cake"

on button A pressed:
    pick a random position between 0 and last position in the list
    read the activity at that position
    show the chosen activity on the screen
```

#### A2. Rock–Paper–Scissors (Array Version)

You *show* this on the projector. Children may copy it if time allows, but it is mainly for understanding.

```text
on start:
    make a list of three images:
        rock picture
        paper picture
        scissors picture

on shake:
    pick a random position 0, 1 or 2
    read the image at that position
    show that image
```

---

### Teaching Steps (Part A)

1. Start with a spoken list (e.g. “pizza, pasta, salad…”) and ask:  
   “If I say number 0, which one is it? Number 2?”  
   This sets up the idea of **index positions**.

2. Move to the **Random Activity Chooser**. Build it live with the class.  
   Emphasise:
   - the list holds **all the options**,  
   - the program chooses a **position**, not the word directly.

3. Once most devices work, briefly show the **Rock–Paper–Scissors** version.  
   Highlight that the only real change is **what** is stored in the list (images instead of text).

4. Key sentence to repeat:  
   > “A list lets us keep many related things together and pick the one we want by position.”

---

# Part B – Arrays in Games

### Aim

Bridge from small demos to a full game. Children should see *why* arrays are essential in games like Crashy Bird.

### Conceptual Focus

- A game often has **many similar objects** (pipes, enemies, projectiles).  
- It is messy to give each one its own variable.  
- Instead, we put all of them in **one list** and use a **loop** to update them.

---

### Pseudocode (Conceptual)

This is *not* full code – just how the game thinks about obstacles.

```text
have a list called obstacles

every cycle of the game:
    for each obstacle in obstacles:
        move it one step left

    from time to time:
        create new obstacles on the right side
        add them into the list

    if any obstacle hits the player:
        game over
```

### Teaching Steps (Part B)

1. On the board, draw:
   - bird on the left,  
   - several columns of pipes moving from right to left.

2. Ask:  
   “If we had ten pipes, would you want ten separate variables? What about twenty?”  

3. Introduce the idea:  
   > “Instead of ten separate boxes, we use **one list** of pipes.”

4. Show the small pseudocode above and talk it through in plain English:
   - we go through the list and move everything,  
   - sometimes we add new pipes,  
   - we also check if any pipe hits the bird.

This prepares them for the full build.

---

# Part C – Crashy Bird Build

### Aim

Use arrays in a meaningful context: a scrolling‑obstacle game.  
The build should feel like a structured extension of previous game weeks (movement, loops, collisions), with arrays added in.

---

## Pseudocode (Blocks‑style)

This is the **full behaviour** of the game, written in the same style as Week 9’s pseudocode.  
You can keep it on a slide while you build.

```text
on start:
    create player (bird) on the left
    set bird to blink so it is easy to see
    create an empty list called obstacles
    reset a counter called ticks to 0

on button A pressed:
    move bird one step up

on button B pressed:
    move bird one step down

forever:
    -- 1. tidy up obstacles that left the screen --
    while there is at least one obstacle
          and the first obstacle is at the left edge:
        delete that obstacle from the screen
        remove it from the list

    -- 2. move all obstacles one step left --
    for each obstacle in the list:
        move obstacle one step left

    -- 3. sometimes create a new column of pipes --
    if ticks is a multiple of 3 (or similar timing):
        choose one random row to be the gap
        for each row from top to bottom:
            if this row is not the gap:
                create a new pipe at the right edge in this row
                add the new pipe to the list

    -- 4. check for collisions with the bird --
    for each obstacle in the list:
        if obstacle is in the same position as the bird:
            end the game

    -- 5. advance game time --
    increase ticks by 1
    pause for a short time (game speed)
```

---

## Teaching Steps (Part C)

1. **Stage 1 – Bird Movement (recap of earlier weeks)**  
   - Make sure everyone can move a sprite up/down with buttons.  
   - Keep this step short: it is familiar and builds confidence.

2. **Stage 2 – Add the Empty List and Ticks Counter**  
   - Introduce the idea of “a list that will hold all pipes”.  
   - Explain that `ticks` is just a counter that lets us say “every few cycles”.

3. **Stage 3 – Moving Existing Obstacles**  
   - Add the loop that moves each obstacle one step left.  
   - Test even with an empty list – no errors should occur.

4. **Stage 4 – Spawning New Pipes**  
   - Add the timing rule (e.g. when ticks is a multiple of 3).  
   - Choose a random row as the gap.  
   - Create pipes in all the other rows and add them to the list.  
   - Test that pipes appear and scroll.

5. **Stage 5 – Cleaning Up Old Pipes**  
   - Show what happens if you *never* remove pipes (list grows forever).  
   - Then add the “while first obstacle is off‑screen → remove it” logic.  
   - Test again and point out how the game stays tidy.

6. **Stage 6 – Collision Detection**  
   - Add the loop that compares each obstacle’s position with the bird.  
   - If they match, the game ends.  
   - Test deliberately flying into a pipe.

7. **Stage 7 – Polishing & Customising**  
   - Let participants change the speed, gap timing, or add sound.  
   - Encourage them to try small changes and re‑test.

---

## Instructor Tips

- Keep the **array idea** alive all the way through: one list, many pipes.  
- Say out loud what each loop is doing in ordinary language.  
- Frequently pause and ask learners to predict what will happen *before* running the code.  
- When things break, ask: “Which stage do you think is misbehaving – movement, spawning, removal, or collision?”

---

## Common Misconceptions & Fixes

- **“Arrays start at 1.”**  
  Remind them that the first position is 0. Show the list visually with numbered boxes.

- **“The list only holds one pipe at a time.”**  
  Use the debugger or print the length of the list to show multiple entries.

- **“Removing obstacles is optional.”**  
  Demonstrate what happens if you never remove them: the list gets huge and the game slows down.

- **“Collision should check only one obstacle.”**  
  Reinforce that we must check every obstacle in the list, not just the first one.

---

## Differentiation

**Support:**

- Provide a partially completed project with bird movement and basic spawning already in place.  
- Let less‑confident learners focus on adjusting speed and gap spacing rather than writing every loop themselves.

**Extend:**

- Add a score that increases as long as the player survives.  
- Increase difficulty over time by speeding up the pipes or shrinking the gap.  
- Add sound effects when the bird flaps or crashes.  
- Create special patterns: double gaps, long walls, etc.

---

## Assessment & Reflection

Questions you can ask at the end:

- “In your own words, what is an array?”  
- “Why is an array useful in Crashy Bird?”  
- “What would be harder if we tried to manage each pipe separately?”  
- “Where in your game do you loop through a list and update everything?”

Learners who can answer these questions and make small changes to the game have met the goals for the week.

---

## Materials & Setup

- BBC micro:bits and USB cables (or batteries for unplugged play).  
- Laptops / Chromebooks with access to MakeCode.  
- Projector or large display for live coding and diagrams.  
- Whiteboard for drawing lists and game diagrams.

---

## Safety & Safeguarding

- Manage cables and devices to avoid tripping hazards.  
- Encourage calm movement in the room – the game is virtual, not physical.  
- As always, follow school/organisation policies for supervision and online access.

---

{% include back-to-autumn.html %}
