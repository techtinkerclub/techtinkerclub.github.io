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
Press A: sometimes numbers appear, sometimes not.  
Press B: shows the result of multiplication.  

Highlight:  
- The threshold acts as a **filter**.  
- Only easy (small) questions are chosen.  

---

**Investigate (5 min)**  
Guide discussion:  
- Where are the variables? (*they store the numbers and result*).  
- What does the threshold do? (*it sets a limit for what’s allowed*).  
- Why use ≤ ? (*we only want small numbers to practice with*).  

---

**Modify (10 min)**  
Challenges:  
- Change the threshold (e.g. 6 for harder questions, 20 for easier).  
- Switch from multiplication to addition or subtraction.  
- Make it always show the numbers, but only solve if ≤ threshold.  

---

**Make (5 min)**  
Extension ideas:  
- Add a score counter for correct answers.  
- Change icons or add a message for “Too big!” when numbers are > threshold.  
- Use `pick random` with a different range.  

**Learning outcome:** pupils see clearly that **variables hold values**, and **thresholds decide when to act**.  

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
