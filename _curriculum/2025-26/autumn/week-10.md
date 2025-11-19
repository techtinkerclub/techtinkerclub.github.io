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
    <li><strong>Computing:</strong> We learned how a single variable can store <strong>many values</strong> using an <strong>array</strong>, and how loops process each value in turn.</li>
    <li><strong>Maths:</strong> We used <strong>index numbers</strong>, <strong>ordering</strong>, and <strong>random selection</strong> to manage list elements.</li>
    <li><strong>Engineering &amp; Technology:</strong> We built a game system with repeating cycles, movement rules and updating objects.</li>
    <li><strong>Art &amp; Design:</strong> Participants customised gameplay speed, timing and visual patterns to create their own style.</li>
  </ul>
</div>

This week we explored **arrays**, an essential idea in programming that lets us store and organise many related values at once.  
We began with small examples to understand how arrays work, then applied the concept in stages to build our own version of **Crashy Bird**, a scrolling obstacle game.

---

## Objectives
- Understand what an **array/list** is and why it is useful.  
- Learn how to select an item from a list using its **position**.  
- Recognise how arrays help games manage several objects at once.  
- Build a complete project using loops, movement and collision logic.

---

## Success Criteria
- I can explain that an array holds <strong>many items</strong> inside one variable.  
- I can describe what an <strong>index</strong> is.  
- I can show how a game uses arrays to track multiple obstacles.  
- I can build a project where several elements update each cycle.

---

## Key Vocabulary
- **Array / List** — a variable that stores many values in order.  
- **Element** — one item inside a list.  
- **Index** — the position of an element (starting at 0).  
- **Length** — the number of items in the list.  
- **Sprite** — a character or object on the LED grid.  
- **Loop** — repeats instructions, often for each element in a list.  
- **Random** — chooses an unpredictable value.

---

## Part A — Exploring Arrays

### What We Explored
We began with a simple activity where participants created a list of choices (for example: activities, foods or mini-games).  
Pressing a button selected one item at random.  
This showed how:

1. A list can hold several values at once.  
2. Each value has a position (its **index**).  
3. Choosing a random position picks a random item from the list.  

We then briefly looked at how arrays can also store **images**, not just words—helping everyone understand that arrays can hold many types of data.

> 💡 *Key idea: arrays help us organise sets of related information so we can access each item easily.*

---

## Part B — Arrays in Games

### What We Discussed
Before building the main project, we explored why games need arrays:

- A game often has many objects on the screen at once.  
- Each object needs to move or update every cycle.  
- Instead of making lots of separate variables, we store these objects in **one list**.  
- A loop can then update every item in the list.  

We looked at examples from familiar games (enemies, obstacles, projectiles) to see how this pattern appears everywhere in game design.

> 💡 *Arrays let us manage many objects using one structure instead of many separate variables.*

---

## Part C — Crashy Bird (Build & Test)

### What We Built (Step-by-Step)
We built our own version of *Crashy Bird* in stages:

1. **The Bird**  
   We created a player sprite and programmed simple controls to move it up and down.

2. **Scrolling Obstacles**  
   We introduced an empty list to store obstacles.  
   Each cycle, new obstacles were added, and existing ones were moved across the screen.

3. **Removing Old Obstacles**  
   When an obstacle moved off the edge, we removed it from the list to keep the game tidy.

4. **Collision Logic**  
   We checked if the bird’s position matched any obstacle.  
   If they touched → **Game Over**.

5. **Testing & Refining**  
   Participants tested their versions, fixed issues and customised elements such as speed, timing and effects.

> 🔄 *This project brought together arrays, loops, events and movement to create a complete game.*

### Try These Mini-Challenges
- Make obstacles appear more or less often.  
- Change the speed to make the game harder or easier.  
- Show a score based on how long the bird survives.  
- Add sound effects for movement or crashes.  
- Create “bonus” gaps or patterns.

---

## Resources
- **Crashy Bird Reference Project:** <https://makecode.microbit.org/v1/projects/crashy-bird>{:target="_blank" rel="noopener"}  
- **MakeCode Arrays Overview:** <https://makecode.microbit.org/courses/csintro/arrays/overview>{:target="_blank" rel="noopener"}  
- **Maker MakeCode Arrays Reference:** <https://maker.makecode.com/reference/arrays>{:target="_blank" rel="noopener"}  
- **SkoolOfCode – Arrays Made Simple:** <https://skoolofcode.us/blog/hands-on-learning-arrays-made-simple-with-microbit-and-makecode/>{:target="_blank" rel="noopener"}  
- **MakeCode Editor:** <https://makecode.microbit.org>{:target="_blank" rel="noopener"}  

---

## Equipment
- BBC micro:bits + USB cables  
- Laptops / Chromebooks with internet access  

---

## Safety & Setup Notes
- Test frequently to catch small bugs early.  
- Encourage careful handling of USB cables.  
- Allow space for participants to debug in pairs when needed.

---

{% include back-to-autumn.html %}
{% include instructor-notes-link.html week=10 %}
