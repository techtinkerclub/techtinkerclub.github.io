---
layout: single
title: ""
permalink: /teacher-notes/2025-26/autumn/week-8-notes/
week: 8
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

# Instructor Notes — Week 8
{% include print-to-pdf.html %}

**Theme:** Radio Messages & Multiplayer Logic  
**Focus Concept:** Transmitters, Receivers, and Message Routing  
**Mini-Projects:** *Pass the Ghost* (Part A) → *Duck Hot-Potato* (Part B)

---

## Learning Objectives
- Understand that a **radio wave** is an invisible signal carrying data through the air.  
- Describe how the micro:bit can act as both **transmitter** and **receiver**.  
- Set a **radio group** so only chosen devices share messages.  
- Use **IDs** and **selection** (`if` tests) to control which device responds.  
- Apply **variables**, **loops**, and **randomness** to create multiplayer behaviour.  
- Reflect on how networks and message routing work in real systems.

---

## Lesson Timing (≈ 80 min total)

| Segment | Time | Focus |
|----------|------|-------|
| Introduction & radio demo | 10 min | What is a radio wave? |
| Part A — Pass the Ghost | 25 min | Send / Receive logic |
| PRIMM discussion | 10 min | IDs, groups, conditions |
| Part B — Duck Hot-Potato | 35 min | Multiplayer game build |
| Play-test & reflection | 5 min | Debug & extend |

---

## Concept Recap

Write on the board:

> **Radio wave:** invisible signal carrying data through the air  
> **Transmitter:** sends the message  
> **Receiver:** listens for messages  
> **Group:** a channel where all members can hear each other  
> **ID:** number that identifies who a message is meant for

Prompt questions:
- What other things use radio waves? (TV, Wi-Fi, Bluetooth)  
- What happens if two people talk on the same channel at once? (*interference*)  
- Why might we use IDs in a network?

---

## Vocabulary Focus

| Term | Child-friendly definition |
|------|----------------------------|
| **Radio wave** | Invisible energy wave that carries messages through the air. |
| **Transmitter** | The sender of the message. |
| **Receiver** | The listener that picks up the signal. |
| **Antenna** | Part of a device that sends / receives radio waves. |
| **Frequency** | How fast the wave wiggles (vibrations per second). |
| **Amplitude** | Height of the wave — bigger = stronger signal. |
| **Interference** | When signals clash or mix, causing lost data. |
| **Radio Group** | A shared “room” where devices exchange messages. |
| **ID** | Number that tells which device a message is for. |
| **Variable** | A labelled box that stores a value. |
| **Condition** | A yes/no test deciding what happens next. |
| **Loop** | Repeats a block of code again and again. |

---

## Part A — *Pass the Ghost* (PRIMM Starter)

### Aim
Introduce **radio send/receive** and **ID-based selection** through a very small two-player activity.  
Each device changes only **one line** — its ID.

### Pseudocode

    on start:
        set radio group to 42
        set my ID (1 or 2)
        show my ID, then clear screen
        if my ID is 1 → start with ghost
            ghost = true
            show ghost icon

    on radio received (number):
        if number == my ID:
            ghost = true
            show ghost icon

    on shake:
        if ghost == true:
            ghost = false
            clear screen
            if my ID == 1 → target = 2
            else → target = 1
            send target over radio

---

### Teaching Flow

1. **Predict**  
   Ask: *What will happen when one player shakes?*  
   Who will see the ghost? Why only that player?

2. **Run**  
   Test in pairs. Both devices must share the same radio group and have unique IDs.

3. **Investigate**  
   - Change the group number — what happens?  
   - Swap IDs — who starts now?  
   - Add a pause after shaking — does that make it clearer?

4. **Modify**  
   - Replace shake with button A.  
   - Use a different icon.  
   - Add a short sound when receiving the ghost.

5. **Make**  
   - Extend to 3 players.  
   - Introduce a random target between 1 and N.

---

### Instructor Tips
- Keep player IDs written on paper next to each device to avoid duplication.  
- Re-explain **selection**:  
  > “If the number I hear matches my ID, I do something; otherwise I ignore it.”  
- Use this to connect to **message routing** (“like postal addresses”).  
- Encourage pupils to narrate aloud:  
  *“I sent 2 → that’s me! I received 2!”*

---

## Part B — *Duck Hot-Potato* (Multiplayer Build)

### Game Concept
- The “duck” behaves like a **hot-potato** — only one micro:bit holds it at a time.  
- When you **shake**, you pass it to another random player.  
- A hidden **timer (fuse)** counts down; if it runs out while you still hold it, you “die.”  
- Dead players automatically forward any ducks they receive so the game never freezes.

---

### Pseudocode Overview

    on start:
        set radio group (same for all)
        set total players = N
        set my ID
        set variables: hasDuck = false, dead = false
        show my ID, then clear screen
        if ID == 1 → starter
            hasDuck = true
            show duck icon

    on radio received (number):
        if number == my ID:
            if not dead:
                hasDuck = true
                show duck icon
                timer = random 0.5 – 1.5 seconds
                while timer > 0 and hasDuck == true:
                    decrease timer
                    short pause
                if hasDuck == true:
                    sendDuck()
                    dead = true
                    show skull icon
            else:
                forwardDuck()  // keeps duck moving

    on shake:
        if hasDuck == true and dead == false:
            sendDuck()

    function sendDuck():
        choose random target (not myself)
        hasDuck = false
        clear screen
        send target over radio

    function forwardDuck():
        choose random target (not myself)
        send target over radio

---

### Discussion Prompts
- Why choose a random target?  
- What happens if two players send at the same time?  
- How could we make the fuse shorter or longer?  
- Why must dead players still forward messages?

---

### Common Issues & Fixes

| Problem | Likely Cause | Fix |
|----------|--------------|-----|
| Duck gets stuck | Dead player never forwards | Ensure `forwardDuck()` runs when `dead == true`. |
| Everyone lights up | Duplicate IDs or wrong group | Give each device a unique ID and one shared group. |
| Messages lost | Too many rapid sends | Add a short pause inside loops. |
| Wrong player starts | Missing starter rule | Re-add `if ID == 1 → hasDuck = true`. |

---

## Differentiation
- **Beginners:** 2-player version, no randomness.  
- **Intermediate:** 3–4 players, random target, adjustable fuse time.  
- **Advanced:** Add sounds, lives, or restart button (A + B).  

---

## Assessment & Reflection
- Can participants explain who starts and how the duck moves?  
- Can they locate the line that checks the **ID**?  
- Can they describe the **random fuse**?  
- Observe teamwork and verbal reasoning during debugging.

Encourage short reflection:  
> “How is this like sending messages across the internet?”  
> “What might cause interference in real networks?”

---

## Cross-Curricular Links

| Subject | Connection |
|----------|-------------|
| **Science** | Radio waves, signal strength, interference. |
| **Maths** | Random numbers, countdowns, comparison operators. |
| **Design & Technology** | System design, input-process-output model. |
| **PSHE / Teamwork** | Communication, resilience, cooperation. |

---

## KS2 Computing Curriculum Mapping

| Strand | Evidence in Session |
|---------|---------------------|
| **Programming A — Sequence** | Ordered send/receive behaviour. |
| **Programming B — Repetition** | Countdown loop; repeating checks. |
| **Programming C — Variables** | `timer`, `hasDuck`, `dead`, `ID`. |
| **Programming D — Selection** | `if (number == ID)` and pass/death branches. |
| **Networks / Communication** | Radio groups, unique IDs, interference. |

---

## Materials & Setup
- BBC micro:bits + USB cables (or simulator)  
- Laptops / Chromebooks with internet  
- Test radio communication in pairs before the session  
- Optional speakers for sound effects  

---

## Safety & Safeguarding
- Keep cables clear during movement activities.  
- Monitor sound levels if tones are added.  
- Reinforce respectful teamwork and fair play during group testing.

---

{% include back-to-autumn.html %}
