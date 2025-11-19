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
    <li><strong>Computing:</strong> We used arrays to store many values and loops to update them efficiently.</li>
    <li><strong>Maths:</strong> We used index numbers, ordering and random selection.</li>
    <li><strong>Engineering &amp; Technology:</strong> We built a cycling game engine with multiple moving parts.</li>
    <li><strong>Art &amp; Design:</strong> Participants customised gameplay speed, timing and patterns.</li>
  </ul>
</div>

This week we explored arrays, an essential programming idea that lets us store and organise many related values at once.  
We began with small examples to understand how arrays work, then applied the concept in stages to build our own version of Crashy Bird.

---

## Objectives
- Understand what an array/list is and why it is useful.  
- Learn how to select an item from a list using its position.  
- Recognise how arrays help games manage several objects at once.  
- Build a project using loops, movement and collision logic.

---

## Success Criteria
- I can explain that an array holds many items inside one variable.  
- I can describe what an index is.  
- I can show how a game uses arrays to track multiple obstacles.  
- I can build a project where several elements update each cycle.

---

## Key Vocabulary
- **Array / List** — a variable that stores many values in order.  
- **Element** — one item inside a list.  
- **Index** — the position of an element (starting at 0).  
- **Sprite** — a character or object on the LED grid.  
- **Loop** — repeats instructions, often for every element in a list.  
- **Collision** — when two sprites share the same position.  
- **Random** — chooses an unpredictable value.

---

## Part A — Exploring Arrays

We began with a simple activity where participants created a list of choices.  
Pressing a button selected one item at random.  
This showed how lists store multiple values and how index positions work.

---

## Part B — Rock–Paper–Scissors with Arrays

We explored how a list can store several images at once, and how a program can choose one by selecting its position (index).  
Participants predicted what would happen when shaking the micro:bit and tested the Rock–Paper–Scissors version live.

---

## Part C — Crashy Bird (Build & Test)

We built our own version of Crashy Bird in stages:

1. The bird moves up/down with buttons.  
2. An empty list stores obstacles.  
3. Each loop moves all obstacles left.  
4. Every few ticks, new obstacles spawn with one random gap.  
5. Old obstacles are removed.  
6. Collisions end the game.

### Try These Mini-Challenges
- Change spawn timing.  
- Adjust speed.  
- Add score or sound effects.

---

## Resources
- Crashy Bird: https://makecode.microbit.org/v1/projects/crashy-bird  
- Arrays Overview: https://makecode.microbit.org/courses/csintro/arrays/overview  
- MakeCode Editor: https://makecode.microbit.org

---

## Equipment
- BBC micro:bits + cables  
- Laptops / Chromebooks  

---

## Safety & Setup Notes
- Test frequently.  
- Handle USB cables carefully.

---

{% include back-to-autumn.html %}
{% include instructor-notes-link.html week=10 %}
