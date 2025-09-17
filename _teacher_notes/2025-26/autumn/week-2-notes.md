---
layout: single
title: ""
permalink: /teacher-notes/2025-26/autumn/week-2-notes/
week: 2
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

# Instructor Notes — Week 2  
{% include print-to-pdf.html %}
**Theme:** Events & Inputs, conditionals  
**Focus Concept:** Event-driven programming (inputs trigger actions), intro to conditionals and variables  
**Mini-Project:** Digital Dice Roller  

---

## Learning Objectives
- Participants understand that **events** (button press, shake, logo touch) trigger specific code blocks.  
- Participants can identify inputs (buttons, light, motion) and outputs (LEDs, sound, text).  
- Participants can build a program where **input events trigger outputs**.  
- Participants can generate and display a random number (1–6) using the micro:bit.  

---

## Detailed Lesson Plan (≈90 minutes)

**1) Starter / Recap (10 min)**  
- Recap Week 1: “What is Input → Process → Output?”  
- Ask: “What did we use as an input last time? What was the output?”  
- Explain today’s theme

---

**2) Guided Exploration: Events & Inputs (25 min)**  
Use **example code and discussion from pages 14–17 of the CSF booklet**.  
- `on start` → happy face output.  
- `on button A pressed` → plays sound + animation.  
- `on button B pressed` → clears screen + scrolls “hello”.  
- `on button A+B pressed` → checks **light sensor** (<50 = moon, else = sun).  
- `on shake` → shows surprised face.  

Discussion points:  
- Each is triggered by a **different event**.  
- Connect to real world: light switches, keyboards, remote controls.  
- Emphasise *event-driven thinking*: “the program waits until something happens, then runs that piece of code.”

---

**3) Guided Build — Dice Roller (25–30 min)**  
- Block: `on button A pressed` → `show number (pick random 1–6)`.  
- Test in simulator, then flash to device.  
- Extension inside guided build: Button B rolls **two dice**.  

---

**4) Extensions & Challenges (15–20 min)**  
- Shake gesture = roll dice.  
- Show **dot patterns** instead of numbers.  
- Super challenge: use radio to send dice result to another micro:bit.  

---

**5) Reflection & Wrap-Up (10–15 min)**  
- Share builds: “Which event did you use? What output did you choose?”  
- Exit question: “What’s the difference between an **input**, an **event**, and an **output**?”  
- Preview Week 3: Loops & animations.

---

## Differentiation
- **New coders:** focus on button A dice roller; copy examples from booklet code.  
- **Experienced coders:** attempt dot-pattern dice or radio version.  
- Encourage peer-to-peer debugging and exploration.

---

## Assessment
- Participants can:  
  - Identify at least two types of inputs and outputs.  
  - Explain what an event does in code.  
  - Create a working dice roller with random numbers.  
  - Extend with an extra event (B or Shake).

---

## Troubleshooting
- **Random not working:** ensure `pick random` block is used.  
- **Shake not responding:** double-check `on shake` event.  
- **No light sensor behaviour:** test A+B code under different lighting.  
- **Micro:bit won’t flash:** check cable, port, WebUSB.

---

## Materials & Setup
- BBC micro:bits + USB cables (1 per child or pair).  
- Chromebooks with internet access.  
- Projector with MakeCode editor open for demos.  
- Optional: buzzers/speakers, spare cables.  

---

## Safety & Safeguarding Notes
- Remind participants not to throw micro:bits while testing shake.  
- Handle cables gently.  
- Monitor sharing and teamwork; avoid exclusion.  
- Collect and safely store devices at end.

---

## Reflection (for leader)
- Did participants connect input → event → output clearly?  
- Were they able to extend beyond button A?  
