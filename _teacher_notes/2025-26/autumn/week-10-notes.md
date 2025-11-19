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

**Theme:** Arrays & Game Behaviour  
**Focus Concept:** Lists, indexing and multi-object updates  
**Mini-Project:** *Crashy Bird* (scrolling obstacle game built in stages)

---

## Learning Objectives

By the end of the session, participants should be able to:

- Explain in simple language what an **array/list** is.  
- Describe how a program can select an item by its **position** in a list.  
- Recognise why games use arrays to manage multiple objects that behave similarly.  
- Help build a game where several obstacles are stored in a list and updated together.  
- Use debugging strategies when movement or collisions do not work as expected.

---

## Session Flow (≈ 80 min)

| Segment | Time | Focus |
| ------ | ---- | ----- |
| Welcome & Setup | 5 min | Devices connected, quick recap of variables & loops |
| Part A – Arrays Intro (Choices Demo) | 15 min | What a list is, positions, random selection |
| Part B – Arrays in Games (Unplugged) | 10 min | Why games need arrays; diagrams and discussion |
| Part C – Crashy Bird Build | 40 min | Player movement, obstacle list, scrolling, collisions |
| Reflection & Tidy Up | 10 min | Recap, questions, save projects |

---

## Part A — Arrays & Choices

### Aim

Introduce arrays as “one variable that can remember many values” using a simple, fun choices demo before moving into games.

### Conceptual Focus

- **Collection:** a list groups related items together.  
- **Index:** each item has a position number (0, 1, 2, …).  
- **Random selection:** we can choose an item by picking a random index.  

### Pseudocode (Blocks-style)

```text
on start:
    create a list of options (words or icons)
    show a friendly icon so participants know it is ready

on button A pressed:
    pick a random index from 0 up to the last position in the list
    read the item at that position
    show or say the chosen item
```

### Teaching Steps

1. **Start from a human example.**  
   On the board, write 5–6 activities in a column (e.g. “watch a movie”, “play a game”, “bake a cake”). Number them 0, 1, 2, 3, 4, 5.  
   Ask: “If I say number 3, which activity is that?” Emphasise that we used the **position**, not the word itself.

2. **Name the structure.**  
   Introduce the term **array** or **list**:  
   > “An array is one variable that stores many values in order. Each value has a position number called its index.”

3. **Connect to the micro:bit version.**  
   Explain that on the micro:bit we will:  
   - store our activities in a list,  
   - choose a random index,  
   - display the item at that position when a button is pressed.

4. **Build together, then let them customise.**  
   As a whole group, step through the pseudocode. Once one version works, let participants change the options to their own ideas (favourite games, foods, exercises, etc.).

5. **Highlight the key behaviour.**  
   Ask a few participants to explain in their own words what is happening when they press the button:  
   - “The program picks a random position.”  
   - “It looks up the item in the list at that position.”  
   - “It shows that item.”

### Instructor Tips

- Keep the first list short (4–6 items) to avoid scrolling overload on the display.  
- Avoid technical detail about how random numbers are generated; focus on the concept of *unpredictable choice*.  
- If some groups finish quickly, challenge them to add a second button that always chooses the first or last item in the list.

---

## Part B — Arrays in Games (Unplugged Discussion)

### Aim

Help participants see why arrays are essential in games before they start building Crashy Bird.

### Conceptual Focus

- **Many similar objects:** enemies, obstacles, projectiles.  
- **Shared behaviour:** each object follows the same rules (move, check collision, disappear).  
- **One list:** makes it possible to update all objects in a loop instead of writing separate code for each one.

### Teaching Steps

1. **Draw the game world.**  
   On the board, sketch the bird on the left and several columns of pipes on the right moving leftward. Label the pipes “obstacles”.

2. **Ask guiding questions.**  
   - “If we had only one pipe, how would we move it?”  
   - “What if we want ten pipes?”  
   - “Would we really want ten separate variables and ten copies of the same movement rule?”

3. **Introduce the array solution.**  
   Explain that we instead:  
   - keep all pipes in **one list of obstacles**,  
   - use a loop that says “for each obstacle, move it one step”.

4. **Connect to the earlier demo.**  
   Link back to the choices project:  
   > “Earlier we picked one item from a list. Now we’ll use a list so the game can keep track of *many* items and update all of them.”

5. **Preview the build stages.**  
   Quickly outline what they are about to implement:  
   - Bird movement,  
   - Game loop,  
   - List of obstacles,  
   - Moving obstacles,  
   - Removing old ones,  
   - Adding new ones,  
   - Checking collisions.

---

## Part C — Crashy Bird (Build & Test)

### Aim

Build a full scrolling game where the player avoids pipes. Use arrays to keep track of all current obstacles.

### Conceptual Focus

- **Game loop:** repeated updates create animation.  
- **Obstacle list:** one list storing all pipes.  
- **Iteration:** applying the same movement rule to each obstacle.  
- **Lifecycle:** create → move → possibly remove → check collision.

---

### Pseudocode (Blocks-style)

The pseudocode below mirrors the structure of the final game but avoids exact code or block names.

```text
on start:
    create the player character on the left
    create an empty list to store obstacles
    set a counter to track time steps

on button A pressed:
    move the player one step up

on button B pressed:
    move the player one step down

forever:
    move every obstacle one step left
    remove any obstacle that has moved off the left edge

    if the time counter reaches a chosen interval:
        choose one random row that will stay empty (the gap)
        for each row on the screen:
            if this row is not the gap:
                create a new obstacle at the right side in this row
                add this obstacle to the list

    for each obstacle in the list:
        if the obstacle is in the same position as the player:
            end the game

    increase the time counter by one
    pause for a short time to control the game speed
```

---

### Teaching Steps

1. **Stage 1 – Player movement**  
   - Create the player sprite on the left middle row.  
   - Add button events to move up and down.  
   - Test: player should move only within the screen.

2. **Stage 2 – Game loop and time counter**  
   - Introduce a repeating loop that will handle movement and timing.  
   - Add a simple counter that increases each time the loop runs.  
   - Test: display the counter briefly so participants can see it changing, then remove that display once understood.

3. **Stage 3 – Empty obstacle list**  
   - Create an empty list for obstacles.  
   - Explain that every new pipe will be added to this list.  
   - No visible change yet – this is setting up the structure.

4. **Stage 4 – Moving existing obstacles**  
   - Inside the game loop, add a step that goes through all obstacles and moves each one left by one column.  
   - Test using a temporary manual obstacle (create one pipe and add it to the list).  
   - Confirm that each loop step moves it left until it disappears off-screen.

5. **Stage 5 – Removing obstacles that leave the screen**  
   - Add logic that checks the obstacles at the front of the list.  
   - If one has moved off the left edge, remove it from the list.  
   - Emphasise that this keeps the list tidy and prevents the game from slowly filling with invisible pipes.  
   - Test by watching that the number of obstacles does not grow without limit.

6. **Stage 6 – Creating new pipes with a gap**  
   - Use the time counter to create new columns of pipes at regular intervals (for example, every few cycles).  
   - Each time we create new obstacles, first choose one random row to remain empty (the gap the bird can fly through).  
   - For each row: if it is not the chosen gap, create a pipe at the right edge and add it to the list.  
   - Test repeatedly, checking that each new column has exactly one empty row and that the columns scroll smoothly.

7. **Stage 7 – Collision detection**  
   - Add a step in the loop that checks every obstacle against the player.  
   - If any obstacle shares both the same column and row as the player, trigger game over.  
   - Test by deliberately flying into a pipe.

8. **Stage 8 – Polish and customisation**  
   - Allow time for participants to adjust speed, spacing, or add sound effects.  
   - More advanced participants can add a score that counts how long they survive or how many columns they pass.

---

### Instructor Tips

- Build in **small, testable steps**. Do not jump straight from an empty screen to the full game.  
- Use plenty of board sketches showing how obstacles move and where they are stored in the list.  
- When debugging, encourage participants to speak in terms of lists and cycles:  
  - “What happens to each obstacle each cycle?”  
  - “When do we add new ones?”  
  - “When do we remove them?”  
- If several children get stuck at the same stage, pause the group and live-debug on the projector.

---

## Assessment & Reflection

Prompt questions:

- “What is an array / list in your own words?”  
- “Why does Crashy Bird need a list of obstacles instead of separate variables?”  
- “What happens to each obstacle during one game loop?”  
- “How does the game know when the bird has crashed?”  

Ask a few participants to walk through one complete loop:  
create pipes → move pipes → remove old ones → check collisions → repeat.

---

## Common Misconceptions & Fixes

- **Arrays start at 1.**  
  Remind that indices start at 0. Use the drawer analogy with labels 0–4.

- **Only one pipe exists at a time.**  
  Show on the board that the list may hold many obstacles at once; the loop visits each one.

- **Removing pipes is “bad” or unsafe.**  
  Explain that removal is necessary to stop the list growing forever and to keep memory free.

- **Collision checks only one obstacle.**  
  Emphasise that the collision check happens inside a loop over all obstacles.

---

## Differentiation

**Support:**

- Provide a partially built project with the bird and game loop already working.  
- For some participants, focus the session just on seeing how new pipes appear and move left.  
- Allow them to work mainly on adjusting game speed or gap frequency.

**Extend:**

- Add a score that increases each loop while the player is alive.  
- Increase difficulty gradually by speeding up the game or reducing the gap.  
- Add special “bonus” gaps or different types of obstacles.  
- Challenge advanced participants to explain their logic to a partner.

---

## Cross-Curricular Links

- **Maths:** sequences, counting from zero, simple probability via random choices.  
- **Science/Engineering:** systems that follow rules every cycle (control systems, simulations).  
- **Art & Design:** designing fair but challenging game levels and feedback.

---

## KS2 Computing Curriculum Mapping

- Design, write and debug programs that accomplish specific goals.  
- Use sequence, selection and repetition in programs.  
- Work with variables and various forms of input and output.  
- Use logical reasoning to explain how some simple algorithms work and to detect and correct errors.

---

## Materials & Setup

- BBC micro:bits with batteries or USB power.  
- Laptops / Chromebooks with internet access.  
- Projector or large display for live demos.  
- Whiteboard and pens for arrays diagrams and game sketches.

---

## Safety & Safeguarding

- Check cables to avoid trip hazards during any movement around the room.  
- Ensure participants stay seated while testing handheld devices.  
- Follow school safeguarding procedures for supervision and device use.

---

{% include back-to-autumn.html %}
