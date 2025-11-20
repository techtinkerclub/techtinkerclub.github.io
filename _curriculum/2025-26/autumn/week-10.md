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
    <li><strong>Maths:</strong> We explored <strong>indices</strong>, ordering, and the idea of checking when a number is a <strong>multiple</strong> of another by testing if the <strong>remainder</strong> is 0.</li>
    <li><strong>Engineering &amp; Technology:</strong> We built a cycling game engine where many objects update each cycle.</li>
    <li><strong>Art &amp; Design:</strong> Participants customised speed, timing patterns and visual effects.</li>
  </ul>
</div>

This week we explored **arrays**, an essential programming idea that lets us store and organise many related values at once.  
We began with small examples to understand how arrays work, then applied the concept in stages to build our own version of **Crashy Bird**, a scrolling obstacle game.

---

## Objectives
- Understand what an array/list is and why it is useful.  
- Select an item from a list using its **index**.  
- Recognise how arrays help games manage multiple moving objects.  
- Build a project using loops, movement and collision logic.

---

## Success Criteria
- I can explain that an array holds <strong>many items</strong> in a single variable.  
- I can describe what an <strong>index</strong> is.  
- I can explain how games use arrays to track multiple obstacles.  
- I can write a project where many elements update each cycle.

---

## Key Vocabulary
- **Array / List** — a variable that stores many values in order.  
- **Element** — one item inside a list.  
- **Index** — the position of an element (starting from 0).  
- **Loop** — repeats instructions, often once for each element.  
- **Collision** — when two sprites share the same position.  
- **Random** — chooses an unpredictable value.  
- **Remainder** — what is left after dividing two numbers; used to check for multiples.

---

## Part A — Exploring Arrays

We created simple lists of choices. Pressing a button picked a random **index** and showed the item stored in that position.  
This helped participants understand:

- arrays store many values together  
- each value has an index  
- the program can use that index to select an item  

---

## Part B — Rock–Paper–Scissors with Arrays

We explored how arrays can also store **images**, not just words or numbers.  
Shaking the micro:bit selected a random index and displayed the corresponding icon.

This also prepared us for Crashy Bird, where we later choose a random **gap position** in an obstacle row.

---

## Part C — Crashy Bird (Build & Test)

We built a scrolling obstacle game using an array of obstacle sprites.

### Steps:
1. Create a bird sprite that moves up/down with buttons.  
2. Create an empty array to store obstacles.  
3. Use a loop to move every obstacle left each cycle.  
4. Every few cycles, spawn new obstacles with one random gap.  
5. Remove old obstacles that leave the screen.  
6. Detect collisions between the bird and any obstacle.  

### Maths Connection  
We discussed how to check if a number is a **multiple** of another:  
If **remainder of (number ÷ divisor) = 0**, the number is a multiple.  
Participants used this to control how often new obstacles appeared.

### Try These Mini-Challenges
- Create different timing patterns.  
- Change game speed.  
- Add score or sound effects.  

---

## Resources
- **MakeCode Editor:**  [Link](<https://makecode.microbit.org>){:target="_blank" rel="noopener"}  
- **Crashy Bird reference project:**  [Link](<https://makecode.microbit.org/v1/projects/crashy-bird>){:target="_blank" rel="noopener"}  
- **MakeCode Arrays Overview:**  [Link](<https://makecode.microbit.org/courses/csintro/arrays/overview>){:target="_blank" rel="noopener"}  
- **Maker MakeCode — Arrays Reference:**  [Link](<https://maker.makecode.com/reference/arrays>){:target="_blank" rel="noopener"}  
- **Arrays in micro:bit:**  [Video](https://youtu.be/ei4RhkIyhSk?si=VZvxMrqtP8eZ8DgG>){:target="_blank" rel="noopener"}

---

## Equipment
- BBC micro:bits + USB cables  
- Laptops / Chromebooks with internet  

---

## Safety & Setup Notes
- Test code frequently to catch early mistakes.  
- Handle USB cables carefully.  
- Encourage pair debugging (one reads, one tests).

---

{% include back-to-autumn.html %}
{% include instructor-notes-link.html week=10 %}
