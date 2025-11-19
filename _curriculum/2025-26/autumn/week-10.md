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

**Focus Concept:** Arrays (lists) and indexed data  
**Mini-Project:** *Crashy Bird* (built step-by-step)

<div class="notice--steam">
  <h2>Connections to STEAM Learning</h2>
  <ul>
    <li><strong>Computing:</strong> We learned how a single variable can hold <strong>many values</strong> using an <strong>array</strong>, and how loops process each element.</li>
    <li><strong>Maths:</strong> We used <strong>index numbers</strong>, <strong>length</strong>, and <strong>random selection</strong> to control which item is chosen from a list.</li>
    <li><strong>Engineering &amp; Technology:</strong> We built a complete game system where multiple <strong>obstacles</strong> must be created, moved and removed using consistent rules.</li>
    <li><strong>Art &amp; Design:</strong> Participants customised their game with their own timings, speeds and visual patterns.</li>
  </ul>
</div>

This week we were introduced to **arrays**, a powerful tool for storing several values inside a single variable.  
We began with a simple example to understand how arrays work, then used the same idea to build the scrolling obstacle system for our main project — **Crashy Bird**.

---

## Objectives
- Understand what an **array/list** is and why we use it.  
- Use a **random index** to select an element from an array.  
- Build a game that uses arrays to manage several sprites at once.  
- Practise loops, conditions, events and variables in a structured game project.

---

## Success Criteria
- I can explain that an array stores <strong>many values</strong> in order.  
- I can get an element using its <strong>index</strong> (0, 1, 2…).  
- I can describe how the game stores its obstacles in an array.  
- I can build and test a game that updates multiple elements using a loop.

---

## Key Vocabulary
- **Array / List** — a variable that stores many values in order.  
- **Element** — a single item in an array.  
- **Index** — the position of an element (starting at 0).  
- **Length** — how many items are in the array.  
- **Sprite** — a micro:bit LED character or object.  
- **Loop** — repeats instructions, often for each item in an array.  
- **Random** — chooses an unpredictable value (commonly used to select an index).

---

## Part A — What Is an Array?
We began by creating a simple **random chooser** project.  
Participants made a list of words (e.g., “watch a movie”, “play a board game”, “bake a cake”) and used:

- `pick random 0 to length of array - 1`  
- `get value at index`  

This helped everyone understand how a list stores several values, and how we select just one using its **index number**.

We also briefly saw how an array can store **images** instead of words, reinforcing that arrays can hold different types of data.

---

## Part B — Why Games Need Arrays
Next, we discussed how games often need to manage several objects at once:

- multiple enemies  
- multiple projectiles  
- multiple obstacles  
- multiple notes or sounds  

Instead of creating many separate variables, programmers use **one array** and a loop that updates each element.

> 💡 Key idea: arrays let us keep track of many things using a single variable.

---

## Part C — Crashy Bird (Build & Test)
We built the *Crashy Bird* game step-by-step.

Together, participants:

- created a **bird sprite** that moves up/down on button presses  
- added a variable `ticks` to track timing  
- created an empty **array of obstacles**  
- used `add value` to push new pipes into the list  
- used `for element of array` loops to move each obstacle left  
- removed obstacles that move off-screen  
- added a **collision check** using the bird’s position  
- tested and debugged as the game developed

Participants then customised their version by adjusting speed, timing, gap size or adding sound effects.

> 🧩 This reinforced how arrays, loops and conditions work together to create dynamic game behaviour.

---

## Resources
- **Crashy Bird (reference code):** <https://makecode.microbit.org/v1/projects/crashy-bird>{:target="_blank" rel="noopener"}  
- **Array Random Chooser Example:** *(Add your shared link here)*  
- **MakeCode Arrays Overview:** <https://makecode.microbit.org/courses/csintro/arrays/overview>{:target="_blank" rel="noopener"}  
- **Maker MakeCode Arrays Reference:** <https://maker.makecode.com/reference/arrays>{:target="_blank" rel="noopener"}  
- **SkoolOfCode Arrays Guide:** <https://skoolofcode.us/blog/hands-on-learning-arrays-made-simple-with-microbit-and-makecode/>{:target="_blank" rel="noopener"}  
- **MakeCode Editor:** <https://makecode.microbit.org>{:target="_blank" rel="noopener"}

---

## Equipment
- BBC micro:bits + USB cables (or simulator)  
- Laptops / Chromebooks with internet access  

---

## Safety & Setup Notes
- Provide support for younger participants when editing longer scripts.  
- Encourage testing often so errors can be spotted early.  
- Ensure cables remain tidy during programming.

---

{% include back-to-autumn.html %}
{% include instructor-notes-link.html week=10 %}
