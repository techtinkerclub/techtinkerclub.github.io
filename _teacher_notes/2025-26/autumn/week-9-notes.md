---
layout: single
title: ""
permalink: /teacher_notes/2025-26/autumn/week-9-notes/
week: 9
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

# Instructor Notes — Week 9
{% include print-to-pdf.html %}

**Theme:** Synchronisation & Local Communication  
**Focus Concept:** Firefly behaviour and wireless radio messaging  
**Mini-Project:** *Exploding Ducks* (multiplayer radio game)

---

## Learning Objectives
- Explain how **fireflies synchronise** their flashes using simple, local rules.  
- Understand how **radio messages** allow micro:bits to coordinate behaviour.  
- Use **events**, **variables**, **conditions**, and **random values** in a radio program.  
- Apply the **PRIMM** approach to predict, investigate, and modify a radio system.  
- Work collaboratively to test, debug, and extend a multiplayer game.

---

## Session Flow (≈ 80 min)

| Segment | Time | Focus |
|----------|------|-------|
| Fireflies & Synchronisation | 20 min | Science + computing concept |
| PRIMM Discussion | 10 min | Predict, Run, Investigate, Modify, Make |
| Part A – Fireflies Simulation | 20 min | Radio synchronisation demo |
| Part B – Exploding Ducks Game | 25 min | Build and play |
| Reflection & Wrap-Up | 5 min | Discussion and clean-up |

---

## Part A — Fireflies & Synchronisation

### Starter Discussion
Ask:
- “Have you ever seen fireflies or videos of them flashing together?”  
- “Do you think they have a leader or a signal that tells them when to flash?”  
- “How could they stay in sync if each one acts on its own?”

### Key Idea — Local Rules → Global Pattern
Each firefly has its own **timer** that counts up to a “flash moment.”  
When a firefly sees a nearby flash, it **resets or speeds up** its own timer slightly.  
Over many cycles, all the timers naturally **align**.

**Simplified explanation**
1. Each firefly starts flashing at random times.  
2. When one flashes, nearby ones adjust their rhythm a little earlier.  
3. Because every flash influences its neighbours, small differences fade out.  
4. Eventually, everyone’s timer lines up — the group flashes together.  

**Analogy:**  
Think of a group of people clapping along to music. At first it’s messy,  
but when each person listens and adjusts slightly to match others, they end up clapping in rhythm.

---

### Visual Demo
1. Show the [**Fireflies interactive simulation**](https://ncase.me/fireflies/).  
   - Turn coupling strength up and down to show faster or slower synchronisation.  
2. Load the [**MakeCode Fireflies project**](https://makecode.microbit.org/projects/fireflies).  
   - Let pupils predict what will happen as the “delay” or “brightness” changes.

---

### Pseudocode (Fireflies behaviour)

    on start:
        set radio group
        light_on = false
        timer = random number between 1 and max_time

    forever:
        wait 1 tick
        increase timer by 1
        if timer > max_time:
            flash light
            send "flash" message by radio
            reset timer to 0

    on radio received "flash":
        if light_on == false:
            shorten timer slightly (fire sooner)
            // imitates reacting to neighbour’s flash

**Explanation:**  
Every firefly does the same thing, but because they all react to each other’s “flash” message,  
they end up firing in sync — just like computer networks aligning their internal clocks.

---

### Teaching Steps
1. **Predict** – Ask pupils to guess what happens if there are fewer neighbours or slower reactions.  
2. **Run** – Try it in MakeCode simulator or with 3–4 real micro:bits.  
3. **Investigate** – Change the reaction strength or delay.  
4. **Modify** – Add colour, icons, or sound.  
5. **Make** – Let each group build a small “colony” and observe if they sync.

---

## Part B — *Exploding Ducks* (Multiplayer Radio Game)

### Aim
Use the same **radio communication** ideas from the fireflies to design a game  
where players must **react quickly** before a random timer runs out.

Each device behaves like a “duck.”  
One duck starts with a hidden timer (the “fuse”).  
Players can **shake** their micro:bit to pass the duck to another player before it explodes.

---

### Conceptual Focus
- **Event-driven:** actions occur when an event happens (receive, shake).  
- **State-based:** each device knows whether it *has* the duck or not.  
- **Randomised timing:** fuse length adds unpredictability.  
- **Selection:** `if` tests decide what happens next.

---

### Pseudocode (Blocks-style)

    on start:
        set radio group to shared number
        set total_players
        set my_ID (1..players)
        show my ID briefly
        clear screen
        if ID == 1 → start with duck

    on radio received (number):
        if number == my_ID:
            if alive:
                has_duck = true
                start timer with random length
                show duck icon
            else:
                // already exploded → forward immediately
                forward_duck()

    on shake:
        if has_duck and alive:
            send duck to random player
            clear screen
            stop timer

    forever:
        if has_duck:
            reduce timer by small step
            if timer reaches 0:
                alive = false
                show skull icon
                forward_duck()

    function forward_duck():
        choose random target ≠ my_ID
        send target number over radio

---

### Teaching Steps
1. **Predict** – “What will happen when the duck explodes?”  
   “What if two players have the same ID?”  
2. **Run** – Start with two players, then expand to 4–6.  
3. **Investigate** – Change fuse length or add delays.  
4. **Modify** – Add icons, sounds, or score counters.  
5. **Make** – Play full-class rounds; observe timing and fairness.

---

### Instructor Tips
- Use **unique IDs** (write on sticky notes).  
- Keep **one shared radio group** (e.g. 42).  
- Encourage calm shaking — not throwing!  
- If a duck gets “stuck,” check for typos in IDs or radio group numbers.  
- Demonstrate how events let the micro:bit *listen* while the timer runs in the background.

---

## Assessment & Reflection
- Can learners describe how devices coordinate without a leader?  
- Do they understand that radio passes *data*, not sound?  
- Can they identify the variables controlling the game (ID, timer, has_duck)?  
- Are they able to reason about conditions: “if I have the duck, do this; else do nothing”?  

> Reflect: “How are the ducks like fireflies?  Both share simple signals that make the group act together.”

---

## Common Misconceptions & Fixes

| Misconception | Clarification |
|----------------|---------------|
| Fireflies have a leader | Synchronisation happens automatically through local adjustment. |
| Random = unfair | Random values make games exciting but still balanced over time. |
| Radio = sound | The radio block sends data packets, not audio waves. |
| Timer pauses other actions | The timer runs alongside other events; the micro:bit keeps listening. |

---

## Differentiation
- **Beginners:** build using a starter scaffold; fewer players.  
- **Confident:** adjust timer range or add explosion sound.  
- **Stretch:** track rounds or create elimination mode.

---

## Cross-Curricular Links

| Subject | Connection |
|----------|-------------|
| **Science** | Animal communication, light signals, wave behaviour. |
| **Maths** | Random numbers, countdown timing, variables. |
| **Design & Technology** | System design and debugging. |
| **PSHE / Teamwork** | Cooperation, fairness, quick reactions. |

---

## KS2 Computing Curriculum Mapping

| Strand | Evidence in Session |
|---------|---------------------|
| Programming A – Sequence | Ordered event flow (receive → react → send). |
| Programming B – Repetition | Continuous countdown in `forever`. |
| Programming C – Variables | `has_duck`, `timer`, `ID`. |
| Programming D – Selection | `if` tests for game states. |
| Networks / Communication | Radio group and message passing. |

---

## Materials & Setup
- BBC micro:bits + USB cables (or simulator)  
- Laptops / Chromebooks with MakeCode  
- Batteries for untethered play  
- Whiteboard for illustrating synchronisation concept  

---

## Safety & Safeguarding
- Keep cables clear before game play.  
- Reduce transmit power if rooms overlap.  
- Supervise movement and prevent device collisions.  
- Reinforce respectful teamwork and turn-taking.

---

{% include back-to-autumn.html %}

<div class="notice--steam">
  <h2>Connections to STEAM Learning &amp; Real-World Links</h2>
  <ul>
    <li><strong>Computing:</strong> Wireless communication, variables, randomisation, and event-driven programming.</li>
    <li><strong>Science:</strong> Biological synchronisation (fireflies) and radio signals.</li>
    <li><strong>Maths:</strong> Counting, timing, and random probability.</li>
    <li><strong>Engineering &amp; Technology:</strong> Designing reliable networked systems.</li>
    <li><em>Real world:</em> Firefly algorithms inspire real swarm-robot and sensor-network research.</li>
  </ul>
</div>
