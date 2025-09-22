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
**Focus Concept:** Variables, Thresholds, Sensors  
**Mini-Project:** Smart Plant Monitor

---

## Learning Objectives
- Pupils understand that a **variable** stores a value that can change.  
- Pupils can read sensor values (light, temperature) from the micro:bit.  
- Pupils can compare sensor values with a **threshold** to trigger actions.  
- Pupils make a micro:bit monitor that warns if a “plant” is too dark or cold.

---

## Detailed Lesson Plan (≈90 minutes)

**1) Starter (10 min)**  
- Show a plant (real or picture). Ask: *“What does it need to grow?”* (light, warmth).  
- Link to sensors: the micro:bit can measure these things.  
- Quick demo: display `temperature` on screen using `show number`.  

**2) Teach: Variables & Thresholds (15 min)**  
- Analogy: variable = a labelled box storing a number.  
- Threshold = a line in the sand (“If it’s colder than 15°C → show warning”).  
- Use simple block example:  
  - `set temp = temperature (°C)`  
  - `if temp < 15 then show snowflake`.

**3) PRIMM Example (20 min)**  
- **Predict:** Show a short program that checks light level. Pupils predict output.  
- **Run:** Try it on the micro:bit.  
- **Investigate:** Where is the variable? Where’s the threshold?  
- **Modify:** Change the threshold.  
- **Make:** Extend to include both light and temperature.

**4) Main Build (30 min)**  
- Pupils create a “plant monitor” that:  
  - Reads light level into variable `light`.  
  - Reads temperature into variable `temp`.  
  - If `light < 100` → show ☀️ missing icon.  
  - If `temp < 15` → show ❄️ icon.  
  - Otherwise, show ✅ happy plant.  

**5) Reflection & Wrap-Up (15 min)**  
- Share monitors with the group.  
- Discuss: *“Why do we need thresholds in real systems?”* (e.g. thermostats, fridges).  
- Tease Week 5: linking inputs to outputs in creative ways (music, motors, etc).

---

## Differentiation
- **New coders:** provide starter template with variables already created.  
- **Confident coders:** add more conditions (e.g. too hot, too bright).  
- Challenge: log values over time.

---

## Assessment
- Observe if pupils can:  
  - Identify variables in the code.  
  - Adjust thresholds correctly.  
  - Debug simple mistakes (wrong comparison, missing block).

---

## Troubleshooting
- **Sensor values not updating:** remind them to put code in `forever` loop.  
- **LEDs not showing symbols:** check that conditions don’t overlap.  

---

## Materials & Setup
- Micro:bits + USB cables.  
- Chromebooks with MakeCode access.  
- Optional: projector for live demo.  

---

## Science & Cross-Curricular Links
- **Science (KS2):** Plants need light and warmth.  
- **Maths:** Thresholds = inequalities (<, >).  
- **Computing:** Sensors, variables, conditionals.

---

## Reflection (for leader)
- Did pupils grasp the idea of thresholds easily?  
- Note if any found the dual-sensor logic confusing.  
- Record extension ideas (e.g. soil moisture with external sensor for future).
