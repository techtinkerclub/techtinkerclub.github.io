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
**Mini-Project:** Rock–Paper–Scissors (random choice)  

---

## Learning Objectives
- Pupils understand and apply **if / else** decisions.  
- Pupils compare **2-way (coin toss)** and **3-way (RPS)** conditionals.  
- Pupils connect randomness and fairness to **Maths (probability)** and **Science (chance, experiments).**  
- Pupils create a working Rock–Paper–Scissors program.  

---

## Detailed Lesson Plan (≈90 minutes)

**1) Starter — Coin Toss PRIMM (15 min)**  
- **Predict:**  
  - Show code: `on button A → set coin = pick random 0–1 → if coin=0 show H else show T`.  
  - Ask: “What will happen? Why do we need `else`?”  
- **Run:** Test in simulator and on device.  
- **Investigate:**  
  - Change random range (1–2, 0–5).  
  - Remove `else`.  
- **Modify:** Add icons, sounds, or a score variable.  
- **Discussion:** What does “fair” mean? Why is this a fair game?  

---

**2) Teach / Model — Rock–Paper–Scissors (10 min)**  
- Show 3-choice version using `if / else if / else`.  
- Compare to coin toss: 3-way vs 2-way decision.  
- Reinforce idea: computer is **choosing at random**.  

---

**3) Guided Build (30 min)**  
- Shake event = pick random 0–2.  
- If 0 → Rock, if 1 → Paper, else → Scissors.  
- Show on LEDs with patterns/icons.  
- Test: Pupils play against micro:bit using hand signs.  

---

**4) Extensions & Challenges (20 min)**  
- Add variable `score`: +1 if player wins, -1 if micro:bit wins (entered manually with button A/B).  
- Add sound effects for Rock, Paper, Scissors.  
- Stretch: let player enter their move with A/B/A+B, then program shows win/lose/draw.  

---

**5) Share & Reflect (15 min)**  
- Pupils compare games and test fairness.  
- Quick exit ticket Qs:  
  - “What is a conditional?”  
  - “Why do we need an `else`?”  
  - “How is Rock–Paper–Scissors fair?”  

---

## Explaining Probability, Chance & Fairness
- **Probability** = how likely something is to happen. Coin toss = 1 out of 2 (50%).  
- **Chance** = everyday word for probability (“good chance of rain”).  
- **Fairness** = each outcome has equal chance. Coin is fair, loaded dice isn’t.  
- **Activity:** Pupils flip micro:bit coin 20 times, tally Heads/Tails, compare results → close to 50/50 but not exact.  

---

## Differentiation
- **New coders:** provide starter template, they fill in missing branches.  
- **Experienced coders:** add score variable or attempt “full game” (player input vs random).  

---

## Assessment
- Did pupils explain conditionals in their own words?  
- Can they write correct `if / else if / else`?  
- Did they debug missing or misordered conditions?  

---

## Troubleshooting
- **Random not working:** check correct range (0–2).  
- **No output sometimes:** missing `else`.  
- **Icons wrong:** check LED patterns.  

---

## Materials & Setup
- BBC micro:bits, USB cables.  
- Chromebooks with internet access.  
- Decision grid visual for Rock–Paper–Scissors.  

---

## Reflection (for leader)
- Did pupils grasp the jump from 2-way to 3-way conditionals?  
- Who successfully debugged their program?  
- Which groups managed the variable extension?  
