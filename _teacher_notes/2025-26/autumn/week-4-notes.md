---
layout: single
title: ""
permalink: /teacher-notes/2025-26/autumn/week-4-notes/
week: 4
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

# Teacher Notes — Week 4  
{% include print-to-pdf.html %}

**Theme:** Variables & Thresholds  
**Focus Concept:** Using and comparing variables, applying thresholds to control outputs  
**Mini-Project:** 🌱 Smart Plant Monitor (light + temperature sensors)  

---

## Learning Objectives
- Pupils understand what a **variable** is and how it stores values.  
- Pupils use **thresholds** to decide if a variable is “too high” or “too low.”  
- Pupils explore how `while true` loops work and why `break` is used.  
- Pupils apply variables + thresholds to real-world sensors (light & temperature).  
- Pupils link coding to **science**: plants need the right light and warmth.  

---

#### Vocabulary Focus
- **Variable**  
  - A **variable** is like a labelled box in the computer’s memory.  
  - It stores a value that can change (e.g. a sensor reading, a score).  
  - In our program, `temp` and `light` are variables that hold numbers from sensors.  
  - Analogy: *like writing a number on a sticky note — you can erase it and write a new one any time.*  

- **Loop**  
  - A **loop** repeats instructions automatically.  
  - `forever` is a type of loop that never ends.  
  - `while true` is also a loop, but we can stop it using `break`.  
  - Analogy: *like a song on repeat — it plays again and again until you press stop.*  

💡 **Teaching tip:**  
- Show the difference between `on start` (runs once), `forever` (runs forever), and `while true` (runs forever unless broken).  
- Ask pupils: *“Why would we want the computer to repeat things? What happens if it doesn’t?”*

---

## Detailed Lesson Plan (≈90 minutes)

### Part 1: PRIMM Starter — Multiplication Quiz with Thresholds (30 min)

**Predict (5 min)**  
Show pupils the code (do not run yet): *Simple times tables quiz* [MakeCode Code]([https://makecode.microbit.org](https://makecode.microbit.org/S35102-48591-68172-69236)){:target="_blank" rel="noopener"}

- Variables: `first number`, `second number`, `result`, `threshold`.  
- On A → picks 2 random numbers, but only if both are ≤ threshold.  
- On B → shows the multiplication result.  

Ask:  
- *“What do you think will happen when we press A?”*  
- *“Why do you think there’s a threshold set at 12?”*  
- *“When will it show us numbers, and when will it not?”*  

---

**Run (5 min)**  
Press A: pupils see pairs of numbers appear.  
Press B: shows the result of multiplication.  

---

**Investigate (10 min)**  
Focus on two important pieces of logic:  

#### 1. `while true`  
- A **loop** that repeats forever.  
- Because “true” is *always true*, the loop keeps running again and again.  
- Each time round, it picks new random numbers.  
- That’s why it *looks like numbers always appear* — the loop is running super fast until it finds ones that fit the rule.  

#### 2. `break`  
- `break` means **“stop this loop right now.”**  
- Without `break`, the loop would keep flashing endless random numbers.  
- With `break`, as soon as good numbers are found (≤ threshold), the program **stops looping** and shows them.  

💡 **Analogy to use with children:**  
- Imagine you’re picking raffle tickets out of a bag.  
- You only want tickets under 12.  
- If you pick one that’s too big → put it back, try again. (*This is the loop.*)  
- When you finally pick a good one → shout it out and stop. (*This is the break.*)  

Questions to ask pupils:  
- *“What would happen if we removed the break?”*  
- *“Why is the loop needed if we already pick random numbers?”*  
- *“Could the program ever run forever without finding a result?”* (No, because eventually random numbers will fall under 12.)  

---

**Modify (5–7 min)**  
Challenges:  
- Change the threshold (e.g. 6 for easier, 20 for harder).  
- Switch to addition or subtraction.  
- Remove `break` deliberately to see what happens.  

---

**Make (5 min)**  
Extensions:  
- Add a score counter.  
- Add an icon or sound if numbers exceed the threshold.  
- Use `pick random` with a wider range (e.g. 1–200).  

---

### Part 2: Main Project — Smart Plant Monitor (55–60 min)

**Introduction (5 min)**  
Ask: *“What do plants need to grow well?”*  
- Pupils will usually say **light** and **water**, sometimes **temperature**.  
- Explain: *“Today we’ll use the micro:bit to check if a plant would be happy here in the classroom!”*  

---

**Step 1: Read variables (10 min)**  
- Create variable `light = light level`.  
- Create variable `temp = temperature`.  
- Show them with `show number` to check real readings.  

Discussion:  
- What is a **sensor**? (a device that measures the world around us).  
- What is a **variable** doing here? (storing the sensor reading so we can use it).  

---

**Step 2: Add thresholds (10 min)**  
Introduce thresholds:  
- Light < 100 → “too dark” 🌙  
- Temp < 18 → “too cold” ❄️  
- Temp > 28 → “too hot” ☀️🔥  

Discuss: *“What happens if we cover the micro:bit?”* / *“What if we warm it with our hands?”*  

---

**Step 3: Combine with logic (15 min)**  
If light ≥ 100 AND temp between 18–28 → show 🌱😀 “Happy Plant.”  
Else → show warning icon depending on condition.  


---

**Step 4: Extension Challenges (10–15 min)**  
- Add sound (happy jingle / sad tone).  
- Count how many times the plant was “unhappy” (alert counter).  
- Show both readings (light + temp) before verdict.  
- Design custom LED plant icons.  

---

**Wrap-Up (5 min)**  
- Quick share: “Show me your Happy Plant!”  
- Reflection: *“What variable did we use? What threshold? What happened when…”*  
- Science link: real plants need **light and warmth** — we just simulated checking it.  

---

## Differentiation
- **Beginners:** scaffold with a starter template (variables created, thresholds suggested).  
- **Confident coders:** add more conditions (too hot, too bright), or sound.  
- **Cross-curricular:** maths (inequalities, number comparisons), science (plant growth needs).  

---

## Assessment
- Can pupils explain what a variable is?  
- Can they describe what a threshold does?  
- Did they use both light and temperature in their monitor?  

---

## Troubleshooting
- **Sensors not changing:** remind them values won’t shift quickly; test with torches or hands.  
- **Icons not showing:** check the order of `if/else if/else`.  
- **Always shows one icon:** threshold values may be set too high/low.  

---

## Materials & Setup
- BBC micro:bits (1 per child/pair).  
- USB cables.  
- Chromebooks with MakeCode.  
- Optional: torches, desk lamps, hand warmers, ice packs.  

---

## Safety & Safeguarding Notes
- Handle USB cables safely.  
- No water near electronics.  
- Share devices fairly.  

---

## Reflection (for leader)
- Did pupils clearly understand **variables vs thresholds**?  
- Did the PRIMM starter (maths quiz) help them before moving into sensors?  
- Note pupils who extended with AND/OR logic successfully.  
