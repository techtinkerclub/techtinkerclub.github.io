---
layout: single
title: ""
permalink: /curriculum/2025-26/autumn/week-8/
week: 8
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

{% include back-to-autumn.html %}
{% include teacher-notes-link.html week=8 %}

## Week 8 — Radio, IDs & Exploding Duck

**Focus Concept:** Radio messages and networked communication  
**Mini-Projects:** *Pass the Blink (radio starter)* → *Duck Hot-Potato (multiplayer game)*

This week’s session introduced how **micro:bits communicate wirelessly** using **radio waves** — invisible signals that carry messages through the air.  
We began with a short science discussion about **how radio works**, then used that knowledge to send messages between micro:bits, finishing with a fast-paced **multiplayer game**.

---

## Objectives
- Understand what **radio waves** are and how the micro:bit uses them to send information.  
- Learn about **transmitters**, **receivers**, and **radio groups**.  
- Give each device a unique **ID** so messages only reach the correct player.  
- Apply **selection** (`if` tests), **loops**, and **variables** in a real game context.  
- Collaborate in small groups to build and test a working multiplayer project.  

---

## Success Criteria
- I can explain what a **radio group** is and why all players must share the same one.  
- I can describe how a message travels from one micro:bit to another.  
- I can set an **ID** for my device and use it to identify messages meant for me.  
- I can work with others to play and improve the Duck Hot-Potato game.  

---

## Key Vocabulary
- **Radio wave** — an invisible wave that carries information through the air.  
- **Transmitter** — sends the signal.  
- **Receiver** — listens for incoming signals.  
- **Antenna** — part of the micro:bit that helps send and receive radio waves.  
- **Frequency** — how fast a wave vibrates (measured in hertz).  
- **Amplitude** — the wave’s height or strength.  
- **Interference** — when two signals clash or mix.  
- **Radio Group** — a shared “channel” or network all players join.  
- **ID** — a number that identifies a specific player or device.  
- **Variable** — a labelled box that stores data such as `score` or `timer`.  
- **Condition** — a true/false test that decides what happens next.  
- **Loop** — repeats instructions continuously (e.g. `forever`).  

---

## Part A — Radio Mini-Lesson & “Pass the Ghost”

We started with a short introduction to **radio waves** — how sound, Wi-Fi, and even micro:bits use the same principles to send information invisibly through the air.  
Participants explored how messages can be sent and received between devices using the **radio blocks** in MakeCode.

Our first mini-project, *Pass the Blink*, used two micro:bits:
- Pressing a button on one micro:bit sent a number over radio.  
- The other micro:bit received the number and flashed a heart icon.  
- Adding **IDs** meant only the intended device reacted to each message.

> 💡 *It’s like calling someone’s name in a playground — only that person answers.*

---

## Part B — Duck Hot-Potato

Next, participants applied what they’d learned to build a **multiplayer game**.  
In *Exploding Duck*, one micro:bit starts with a “duck.”  
Each time the duck is passed, a **radio message** sends it to another random player.  
Every duck comes with a **hidden timer (fuse)** — if it runs out while you’re still holding the duck, your micro:bit shows a skull, and you’re “out!”

Children worked in groups of 3–6, testing how quickly messages passed through the group and experimenting with different fuse lengths, speeds, and icons.

> 🔄 *This activity blended coding, science, and teamwork — showing how networks can create real-time multiplayer games.*

---

## Resources
- **MakeCode Editor:** [makecode.microbit.org](https://makecode.microbit.org){:target="_blank" rel="noopener"}  
- **BBC micro:bit Radio Guide:** [Reference](https://makecode.microbit.org/reference/radio){:target="_blank" rel="noopener"}  
- **BBC Bitesize – How Radio Waves Work (KS2):** [Link](https://www.bbc.co.uk/bitesize){:target="_blank" rel="noopener"}  

---

## Equipment
- BBC micro:bits + USB cables (or simulator)  
- Laptops / Chromebooks with internet access  
- Optional: speakers for sound effects  

---

## Safety & Setup Notes
- Keep cables tidy when moving around the room.  
- Use a **unique radio group** to avoid interference with other micro:bits nearby.  
- Test projects in pairs before connecting the whole group.  

---

{% include back-to-autumn.html %}
{% include teacher-notes-link.html week=8 %}
