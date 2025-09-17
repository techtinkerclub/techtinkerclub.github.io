---
title: "Week 4 — Variables & Thresholds: Smart Plant Protector"
permalink: /curriculum/week-4/
layout: single
classes: wide
toc: true
toc_label: "On this page"
description: "Use micro:bit temperature and light sensors with variables and thresholds to monitor plant comfort."
author_profile: false
sidebar:
  nav: "weeks"
---

## Overview

This week we build a **Smart Plant Protector** with the micro:bit.  
We’ll **read two sensors** (temperature & light), store them in **variables**, compare them to **thresholds**, and decide if the plant is **happy**, **too cold**, **too hot**, or **too dark**.

> **Why?** Greenhouses use sensors and thresholds to keep conditions right for growth. We’ll recreate a mini version with our micro:bits.

---

## Learning goals

- Use **variables** to store live sensor readings.  
- Use **thresholds** with `if…then…else` logic to trigger messages.  
- Combine two inputs (temperature & light) to make a single decision.  
- Test, tweak, and justify chosen thresholds.

---

## Key vocabulary

- **Logic** — the set of rules a computer follows to decide what to do. In coding we use conditionals (logic blocks like `if…then…else`) to check conditions and choose between actions. Logic can also use connectors such as **AND**, **OR**, and **NOT** to combine conditions.  
- **Variable** — a named box in memory that stores a value (e.g., a number from a sensor).  
- **Threshold** — a boundary value where behaviour changes (e.g., heating turns on below **18 °C**).

> We’ll reuse the **Week 2** definition of *Logic* for consistency.

---

## Equipment

- micro:bit (V1 or V2), USB cable, battery pack (optional)  
- A **torch** (for dark/bright testing) and your warm hands (for slightly warming the board)  
- Laptop with [MakeCode](https://makecode.microbit.org)

---

## Step-by-step (MakeCode blocks)

1) **Create variables**  
`temp`, `light`

2) **Read sensors** *(inside a `forever` loop)*  
- `set temp = temperature (°C)`  
- `set light = light level`

3) **Decide with thresholds**  
Start simple and tweak during testing:

- Temperature bands:
  - `< 15` → “Too cold!”
  - `> 25` → “Too hot!”
- Light:
  - `< 80` → “Too dark!”
- Else → “Happy plant :)”

4) **Show result** (strings or custom icons)

### Block-flow (pseudocode)


