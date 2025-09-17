---

layout: single
title: ""
permalink: /teacher-notes/2025-26/autumn/week-3-notes/
week: 3
robots: noindex
toc: true
toc\_sticky: true
sidebar: false
header:
overlay\_image: /assets/images/banner.png
show\_overlay\_excerpt: false
show\_overlay\_text: false
--------------------------

# Teacher Notes — Week 3

{% include print-to-pdf.html %}

**Theme:** Conditionals (if / else)
**Focus Concept:** Decisions & basic logic
**Mini-Project:** Rock–Paper–Scissors (micro\:bit chooses at random)

---

## Learning Objectives

* Pupils understand that computers make **decisions** using **conditionals** (`if … else`).
* Pupils can **predict, run, investigate, modify, and make** programs using PRIMM.
* Pupils relate **randomness, probability, and fairness** to simple programs (coin toss; RPS).
* Pupils build a program that uses an **if / else-if / else chain** to choose Rock/Paper/Scissors.

---

## PRIMM Structure (use explicitly)

### 1) Predict — Coin Toss Starter

Show this on the projector (don’t run it yet):

```blocks
on button A pressed
    show icon (small animation – optional)
    set coin to pick random 0 to 1
    if coin = 0 then
        show string "H"
    else
        show string "T"
```

Prompt pupils:

* What will happen when I press **A**?
* Why are there **two** possible outcomes?
* What does `pick random 0 to 1` mean?
* What does the condition `if coin = 0` control?

---

### 2) Run

* Pupils flash and run the program; press **A** several times.
* Quick poll: “Who got H? Who got T?” Why are results different each time?

---

### 3) Investigate

* Draw the decision flow on the board:
  **IF** coin = 0 → “H” **ELSE** → “T”.
* Discussion prompts:

  * What happens if we change to `pick random 1 to 2` but keep `if coin = 0`?
  * What happens if we **remove the `else`**?
  * Why is a coin toss considered **fair**?

---

### 4) Modify

Quick tweaks (5–7 min):

* Swap “H/T” for LED icons or emojis.
* Add sounds (high tone for heads, low tone for tails).
* Challenge: turn into a **dice roller** (`pick random 1–6`).

---

### 5) Make — Main Project (Rock–Paper–Scissors, 3-way decision)

Transition: *“Coin toss is a **2-way** decision. Rock–Paper–Scissors has **three** choices, so we’ll use an **if / else-if / else** chain.”*

Suggested build:

1. **Event:** `on shake`
2. **Process:** `set hand = pick random 0 to 2`
3. **Decide:**

   * `if hand = 0` → show Rock icon
   * `else if hand = 1` → show Paper icon
   * `else` → show Scissors icon

> Pupils then play their hand with **real gestures**, comparing to the micro\:bit’s choice.
> Extension: scoring with a variable.

---

## Detailed Lesson Plan (≈90 minutes)

* **Starter (10 min):** link to real-life coin toss.
* **Predict + Run (10–12 min):** coin toss PRIMM starter.
* **Investigate + Modify (15–18 min):** explore and tweak coin toss.
* **Make (30 min):** build Rock–Paper–Scissors.
* **Reflect (15 min):** share, discuss fairness, exit questions.

---

## Probability, Chance & Fairness (teacher script)

* **Probability** = how likely something is. Coin toss → 1 out of 2 (50%).
* **Chance** = everyday word for probability.
* **Fairness** = all outcomes equally likely.
* In code, `pick random` makes games fair if we test all outcomes correctly.
* *Mini-activity:* run coin toss 20 times, tally class results — close to 50/50 but not exact.

---

## Vocabulary

* **Conditional** — an instruction that checks a condition and chooses what to do (if/else).
* **Logic** — rules in decisions (later: AND/OR/NOT).
* **Random** — an unpredictable value chosen by the computer.
* **Variable** — a named box of memory that can change.
* **Fairness / Probability** — equal chance of outcomes.

---

## Extensions

* Add a **score variable** (A = win, B = loss, A+B = draw).
* Best of 5 rounds.
* Add animations and sounds.

---

## Differentiation

* **Support:** provide template with icons.
* **Core:** build 3-branch conditionals.
* **Stretch:** add scoring or tally system.

---

## Assessment

* Explain: *What is a conditional?*
* Spot the bug: missing final `else`.
* Reason: *Why is coin toss a fair game?*
* Predict: What happens if only 0 and 1 are tested but random is 0–2?

---

## Troubleshooting

* Same result every time → random outside the event.
* Nothing shows → missing `else`.
* Wrong icons → mapping error.
* USB issues → swap cable/port, reconnect.

---

## Materials & Setup

* BBC micro\:bits + USB cables.
* Chromebooks with MakeCode ready.
* Projector for demo.
* Optional: printed decision grids, tally sheets.

---

## Safety & Behaviour

* Gentle handling of devices.
* Pair programming norms.
* Fair play during testing.

---

## Reflection (for leader)

* Did pupils articulate **if/else** clearly?
* Who needed more scaffolding for 3-branch logic?
* Are we ready to move to **variables** in Week 4?
