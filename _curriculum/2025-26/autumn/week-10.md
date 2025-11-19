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
**Mini-Project:** *Crashy Bird* (game using arrays to manage obstacles)

<div class="notice--steam">
  <h2>Connections to STEAM Learning</h2>
  <ul>
    <li><strong>Computing:</strong> We learned how a single variable can hold <strong>many values</strong> using an <strong>array</strong>, and how loops use these values to update game behaviour.</li>
    <li><strong>Maths:</strong> We used <strong>index numbers</strong>, <strong>length</strong>, and <strong>random selection</strong> to choose and access elements in a list.</li>
    <li><strong>Engineering &amp; Technology:</strong> We analysed how a real game stores and updates multiple <strong>obstacles</strong> at once.</li>
    <li><strong>Art &amp; Design:</strong> Participants customised their games with their own movement speeds, patterns and events.</li>
  </ul>
</div>

This week we were introduced to **arrays**, a powerful tool in programming that lets us store many values in a single place.  
We began with simple lists of words and images, then explored how arrays make real games possible—especially when we want to manage several objects at once.  
Finally, we opened and customised the classic micro:bit game **Crashy Bird**, which uses an array to track all incoming obstacles.

---

## Objectives
- Understand what an **array/list** is and why we use it.  
- Use a random index to pick an element from a list.  
- Explore how arrays help games store multiple sprites.  
- Customise an existing project that uses arrays to update many obstacles.

---

## Success Criteria
- I can explain that an array holds <strong>many values</strong> inside one variable.  
- I can use <strong>index numbers</strong> (0, 1, 2…) to get an item from a list.  
- I can describe how Crashy Bird stores its obstacles using an array.  
- I can modify or extend a game that loops through a list.

---

## Key Vocabulary
- **Array / List** — a variable that stores many values  
- **Element** — a single item inside an array  
- **Index** — the position of an element (starting at 0)  
- **Length** — how many items are in the list  
- **Sprite** — a micro:bit LED character or object  
- **Loop** — repeats code for each element in a list  
- **Random** — picks an unpredictable index number  

---

## Part A — What Is an Array?
We started with a simple activity: creating a **random chooser**.  
Participants built a list of text options (e.g., “PE with Joe”, “bake a cake”) and used:

- `pick random 0 to length of array - 1`  
- `get value at index`  

This helped everyone understand how arrays store information and how we retrieve one item using its **index number**.

We also explored a short demo using a list of **images** (Rock–Paper–Scissors), showing that arrays can hold anything — not just words.

---

## Part B — Arrays in Games
Next, we looked at how games need to keep track of many objects at once.  
Rather than creating five or ten variables, a game uses **one array** and loops through every element.

We discussed why this matters in Crashy Bird:  
each pipe is stored inside a list of obstacles, and a loop updates all of them each time the game “ticks.”

> 💡 Key idea: arrays make it easy to manage lots of similar objects using one loop.

---

## Part C — Crashy Bird (Explore & Customise)
We opened the classic micro:bit game *Crashy Bird* and examined how it works:

- The obstacles (pipes) are stored in the `obstacles` array.  
- Each frame, a loop moves every pipe leftwards.  
- New pipes are added using `add value`.  
- Pipes that move off-screen are removed.  
- The game checks for collisions by comparing the bird’s position with every element in the list.

After exploring the code, participants customised their version by changing speed, gap size, events, or adding sound effects.

> 🧩 This reinforced how arrays, loops and conditions work together to create dynamic behaviour.

---

## Resources
- **Crashy Bird MakeCode Project:** [Link](https://makecode.microbit.org/v1/projects/crashy-bird){:target="_blank" rel="noopener"}  
- **Array Random Chooser Example:** *(Add your shared link here)*  
- **RPS Array Demo:** *(Add shared link if used)*  
- **MakeCode Arrays Overview:** [Link](https://makecode.microbit.org/courses/csintro/arrays/overview){:target="_blank" rel="noopener"}  
- **Maker MakeCode Arrays Reference:** [Link](https://maker.makecode.com/reference/arrays){:target="_blank" rel="noopener"}  
- **SkoolOfCode Arrays Guide:** [Link](https://skoolofcode.us/blog/hands-on-learning-arrays-made-simple-with-microbit-and-makecode/){:target="_blank" rel="noopener"}  
- **MakeCode Editor:** [Link](https://makecode.microbit.org){:target="_blank" rel="noopener"}

---

## Equipment
- BBC micro:bits + USB cables (or simulator)  
- Laptops / Chromebooks with internet access  

---

## Safety & Setup Notes
- Ensure each micro:bit is connected to the correct MakeCode tab.  
- Support younger participants when editing longer block scripts.  
- No radio use this week — projects run locally.

---

{% include back-to-autumn.html %}
{% include instructor-notes-link.html week=10 %}
