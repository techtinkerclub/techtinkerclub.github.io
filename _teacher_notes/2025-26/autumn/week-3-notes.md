---
layout: single
title: ""
permalink: /teacher-notes/2025-26/autumn/week-3-notes/
week: 3
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

# Teacher Notes — Week 3  
{% include print-to-pdf.html %}

**Theme:** Conditionals — If / Else Decisions  
**Focus Concept:** Conditionals & Logic  
**Mini-Project:** Rock–Paper–Scissors Game  

---

## Learning Objectives
- Pupils understand what a **conditional** is and why it’s useful.  
- Pupils can predict, test, and modify programs using `if / else`.  
- Pupils link randomness and fairness to **Maths (probability)** and **Science (experiments with chance, fairness, data)**.  
- Pupils can create a working Rock–Paper–Scissors game on the micro:bit.  

---

## Detailed Lesson Plan (≈90 minutes)

**1) Starter — Heads/Tails PRIMM (15 min)**  
- **Predict:**  
  - Show blocks: `on button A pressed → set coin = pick random 0–1 → if coin = 0 show H else show T`.  
  - Ask: “What will happen when I press button A?”  
  - “What does `pick random 0 to 1` mean?”  
  - “Why do we need the `else` block?”  

- **Run:** Pupils test in simulator, then on micro:bits. Poll the class — who got heads? tails?  

- **Investigate:**  
  - Change range to `1–2` (why break?)  
  - Remove `else` (sometimes blank — why?)  
  - Extend range to `0–5` (what happens now?)  

- **Modify:**  
  - Replace H/T with icons 🙂/😢.  
  - Add sounds (high tone for heads, low tone for tails).  
  - Add a variable `score` → if heads then +1, else -1.  

- **Discussion:**  
  - “Is it fair? Why/why not?”  
  - “What do we mean by random?”  
  - Link to Maths (probability of 50/50 coin toss).  

---

**2) Teach / Model — Rock–Paper–Scissors (10 min)**  
- Show **decision grid** on slide/board:  
  - Rock vs Rock = Draw  
  - Rock vs Paper = Lose  
  - Rock vs Scissors = Win  
  (Repeat for Paper/Scissors)  

- Explain this is a **3-way decision**, so we need `if / else if / else`.  
- Compare to coin toss (2-way).  

---

**3) Guided Build (30 min)**  
- Step 1: Shake = computer’s choice (0=Rock, 1=Paper, 2=Scissors).  
- Step 2: Player chooses with buttons (A=Rock, B=Paper, A+B=Scissors).  
- Step 3: Use conditionals to compare and decide outcome.  
- Step 4: Show result (Win/Lose/Draw) with LED pattern or text.  
- Step 5: Add `score` variable (change by +1 if win).  

---

**4) Extensions & Challenges (20 min)**  
- Add sounds or animations for outcomes.  
- Add “Best of 3” mode.  
- Stretch: Use **radio** → 2-player Rock–Paper–Scissors across micro:bits.  

---

**5) Share & Reflect (15 min)**  
- Pupils test each other’s games.  
- Exit Qs:  
  - “What’s a conditional?”  
  - “Why do we need an `else`?”  
  - “How does randomness make the game fair?”  

---

## Differentiation
- **New coders:** give pre-built starter with computer random + display only. They just add player input and simple if/else.  
- **Experienced coders:** extend to radio multiplayer or add best-of-3 scoring system.  
- Encourage pair programming (driver/navigator roles).  

---

## Assessment
- Can pupils explain what a conditional is?  
- Did they correctly implement `if / else if / else`?  
- Can they debug when results don’t match the decision grid?  
- Do they use variables for score tracking?  

---

## Troubleshooting
- **Random not working:** check correct range (0–2 for 3 outcomes).  
- **Else skipped:** ensure all outcomes covered (final `else` catches remaining).  
- **Buttons not working:** confirm code inside `on button pressed`.  
- **Score not changing:** confirm variable updates are inside correct condition.  

---

## Materials & Setup
- BBC micro:bits + USB cables.  
- Chromebooks with internet access.  
- Slides with decision grid.  
- Printed extension challenges (optional).  

---

## Safety & Safeguarding Notes
- Usual safe handling of cables and devices.  
- Encourage teamwork and respect for equipment.  
- Allow quick brain breaks if frustration rises.  

---

## Reflection (for leader)
- Did pupils grasp difference between 2-way (coin) and 3-way (RPS) decisions?  
- Who needed extra scaffolding with variables?  
- Did anyone manage to use AND/OR logic? Track for future extension.  
