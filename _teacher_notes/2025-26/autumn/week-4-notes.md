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
- Pupils apply variables + thresholds to **sensors** (light & temperature).  
- Pupils link coding to **science**: plants need the right light and warmth.  

---

## Detailed Lesson Plan (≈90 minutes)

### Part 1: PRIMM Starter — Multiplication Quiz with Thresholds (30 min)

**Predict (5 min)**  
Show pupils the code (do not run yet):  

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
- Change the threshold (e.g. 6 for harder, 20 for easier).  
- Switch to addition or subtraction.  
- Remove `break` deliberately to see what happens.  

---

**Make (5 min)**  
Extensions:  
- Add a score counter.  
- Add a message for “too big!” if numbers exceed the threshold.  
- Use `pick random` with a wider range (e.g. 1–200).  

---

### Part 2: Main Project — Smart Plant Monitor (55–60 min)

**Introduction (5 min)**  
Ask: *“What do plants need to grow well?”*  
- Pupils will usually say **light** and **water**, sometimes **temperature**.  
- Explain: *“Today we’ll use the micro:bit to check if a plant would be happy here in the classroom!”*  

---

**Step 1: Read variables (10 min)**  
Show how to get sensor values:  
- `light = light level`  
- `temp = temperature`  
Display them with `show number` to see real readings.  

---

**Step 2: Add thresholds (10 min)**  
Introduce thresholds for both sensors:  
- Light < 100 → “too dark” 🌙  
- Temp < 18 → “too cold” ❄️  
- Temp > 28 → “too hot” ☀️🔥  

Discuss: *“What happens if we move to a dark corner?”* / *“What if we warm the sensor with our hands?”*  

---

**Step 3: Combine with logic (15 min)**  
If light ≥ 100 AND temp between 18–28 → show 🌱😀 “Happy Plant.”  
Else → show warning icon depending on condition.  

Block structure:  
