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

# Teacher Notes — Week 2  
{% include print-to-pdf.html %}
**Theme:** Events & Inputs  
**Focus Concept:** Inputs trigger code (events)  
**Mini-Project:** Digital Dice Roller  

---

## Learning Objectives
- Pupils understand what an **event** is (something that happens which triggers code).  
- Pupils can explain how inputs (button, shake) map to outputs.  
- Pupils can program a dice roller using `pick random 1–6`.  
- Pupils explore extension inputs (Button B, A+B, shake gesture) and outputs (LED patterns, text).  

---

## Detailed Lesson Plan (≈90 minutes)

**1) Starter & Recap (10 min)**  
- Ask pupils: *“What did we make last week? What’s an input? What’s an output?”*  
- Demonstrate a micro:bit reacting to inputs (Button A shows icon).  
- Introduce the word **event**: *“An event is something that happens — like pressing a button — that makes the program run a set of instructions.”*  

**2) Explore Events (10–15 min)**  
- Open MakeCode and show `on button A pressed`.  
- Add a simple output (smiley icon).  
- Pupils test with Button A and Button B.  
- Extension demo: `on shake` event → shows a surprised face.

**3) Guided Build — Dice Roller (25–30 min)**  
- Start new project: “Dice Roller”.  
- Inside `on button A pressed` → use `pick random 1–6` and `show number`.  
- Test on simulator, then flash to device.  
- Pupils test by pressing Button A to roll a digital dice.  

**4) Extension Challenges (20 min)**  
- **Button B:** roll 2 dice, display total.  
- **Shake gesture:** trigger dice roll.  
- **Dice face icons:** create LED patterns for numbers 1–6.  
- **Radio link (advanced):** send dice result to another micro:bit.

**5) Reflection & Wrap-Up (10–15 min)**  
- Pair share: show each other their dice programs.  
- Ask: *“What is an event? What input did you use? What output did you create?”*  
- Exit question: *“If you shake the micro:bit, what’s the event? What happens?”*  
- Tease Week 3: introducing **loops** to repeat actions.

---

## Differentiation
- **New coders:** focus only on Button A dice roller.  
- **Experienced coders:** add icons, multiple inputs, or radio.  
- Encourage pupils who finish early to help neighbours debug.

---

## Assessment
- Observe if pupils can:  
  - Identify
