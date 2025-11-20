---
layout: single
title: ""
permalink: /curriculum/2025-26/autumn/week-10/
week: 10
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

{% include back-to-autumn.html %}

## Week 10 — Arrays & Crashy Bird

**Focus Concept:** Arrays (lists) and coordinated game behaviour  
**Mini-Project:** *Crashy Bird* (built step-by-step)

<div class="notice--steam">
  <h2>Connections to STEAM Learning</h2>
  <ul>
    <li><strong>Computing:</strong> We used <strong>arrays</strong> to store multiple values and <strong>loops</strong> to update them efficiently.</li>
    <li><strong>Maths:</strong> We explored <strong>indices</strong>, ordering, and how to check if a number is a <strong>multiple</strong> of another by testing whether the <strong>remainder</strong> is zero.</li>
    <li><strong>Engineering &amp; Technology:</strong> We built a simple “game engine” where many objects update each cycle.</li>
    <li><strong>Art &amp; Design:</strong> Participants customised speed, timing patterns and visual effects.</li>
  </ul>
</div>

This week we explored **arrays**, an essential programming idea that lets us store and organise many related values at once.  
We began with small examples to understand how arrays work, then applied the concept step-by-step to build our own version of **Crashy Bird**, a scrolling obstacle game.

---

## Objectives
- Understand what an array/list is and why it is useful.  
- Select an item from a list using its **index**.  
- Recognise how arrays help games manage multiple moving objects.  
- Build a project using loops, movement and collision logic.

---

## Success Criteria
- I can explain that an array holds <strong>many items</strong> in a single variable.  
- I can describe what an <strong>index</strong> represents.  
- I can explain how games use arrays to track multiple obstacles.  
- I can build a project where many elements update each cycle.

---

## Key Vocabulary
- **Array / List** — a variable that stores many values in order.  
- **Element** — one item inside an array.  
- **Index** — the position of an element (starting from 0).  
- **Length** — how many elements the array contains.  
- **Iterate / Loop** — repeat instructions, often once for every element.  
- **Random** — chooses an unpredictable value.  
- **Remainder** — the amount left after dividing; remainder = 0 means a number is a *multiple*.  
- **Sprite** — a character or object on the LED grid.  
- **Collision** — when two sprites share the same position.  
- **Condition** — a true/false test that decides what happens next.

---

## Part A — Exploring Arrays

We created simple lists of choices and used a random **index** to select an item.  
This helped participants understand that:

- arrays hold multiple values  
- each value has a position (index)  
- programs use the index number to look up the item  

---

## Part B — Rock–Paper–Scissors with Arrays

We explored how arrays can also store **images**, not just words or numbers.  
Shaking the micro:bit chose a random index, and the program displayed the corresponding icon.

This helped prepare for Crashy Bird, where we use the same idea to choose a random **gap position**.

---

## Part C — Crashy Bird (Build & Test)

We built a scrolling obstacle game using an array to store all obstacle sprites.

### Steps:
1. Create a bird sprite that moves up/down with buttons.  
2. Make an empty array to store obstacles.  
3. Use a loop to move every obstacle left each cycle.  
4. Every few cycles, spawn new obstacles with one random gap.  
5. Remove obstacles as they leave the screen.  
6. Detect collisions between the bird and any obstacle.

### Maths Link  
We explored how to check “spawn every 3 cycles” using:  
**If (ticks remainder of 3) = 0 → spawn obstacles**  
A remainder of **0** means the number is a **multiple**, which is why this works.

### Try These Mini-Challenges
- Change how often obstacles appear.  
- Adjust game speed.  
- Add score or sound effects.  
- Make custom patterns.

---

## Resources
- **Crashy Bird (MakeCode Project):**  
  [Code](https://makecode.microbit.org/v1/projects/crashy-bird){:target="_blank" rel="noopener"}

- **MakeCode Arrays Overview:**  
  [Link](https://makecode.microbit.org/courses/csintro/arrays/overview){:target="_blank" rel="noopener"}

- **MakeCode Arrays Reference (Maker Edition):**  
  [Link](https://maker.makecode.com/reference/arrays){:target="_blank" rel="noopener"}

- **SkoolOfCode — Arrays Made Simple:**  
  [Link](https://skoolofcode.us/blog/hands-on-learning-arrays-made-simple-with-microbit-and-makecode/){:target="_blank" rel="noopener"}

- **MakeCode Editor:**  
  [Link](https://makecode.microbit.org){:target="_blank" rel="noopener"}

---

## Equipment
- BBC micro:bits + USB cables  
- Laptops / Chromebooks  

---

## Safety & Setup Notes
- Test frequently to catch early mistakes.  
- Handle USB cables carefully.  
- Encourage pair debugging (one reads, one tests).

---

{% include back-to-autumn.html %}
{% include instructor-notes-link.html week=10 %}
