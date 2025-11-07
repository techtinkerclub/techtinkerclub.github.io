---
layout: single
title: ""
permalink: /teacher_notes/2025-26/autumn/week-8-notes/
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

**Theme:** Radio Waves & Wireless Communication  
**Focus Concept:** Energy transfer through waves and radio messaging  
**Mini-Project:** *Pass the Ghost* (two-player radio activity)  

---

## Learning Objectives
- Explain in simple terms what a wave is and what it does.  
- Recognise examples of wave energy (sound, light, radio, microwaves).  
- Understand **amplitude**, **frequency**, and **wavelength** conceptually.  
- Describe how a micro:bit uses radio waves to send and receive numbers.  
- Apply selection (`if` tests) and variables to control messages.  
- Work collaboratively to debug and enhance a shared program.  

---

## Session Flow (≈ 80 min)

| Segment | Time | Focus |
|----------|------|-------|
| Wave Introduction | 20 min | Science demo and discussion |
| Radio link to micro:bit | 10 min | From theory to practice |
| Part A – Pass the Ghost (PRIMM) | 25 min | Code exploration and testing |
| Enhancement – Add Sounds / Icons | 10 min | Modification and creativity |
| Quiz Review | 15 min | Weeks 1–2 concept recap |

---

## Part A — Wave and Radio Exploration

### Starter Discussion
Ask:
- What do we mean by a “wave”?  
- Can you think of different kinds of waves?  
- What happens to a rope if you wiggle one end?  

Sketch or demonstrate how amplitude and frequency change the shape of a wave.  

**Key points**
- Waves carry energy but not matter.  
- Sound waves need air; radio waves do not.  
- Higher frequency = more energy.  
- Different frequencies = different uses (radio, Wi-Fi, microwave, X-ray).  
- Humans hear roughly 20 Hz–20 kHz.  

Link this to the micro:bit radio feature — a tiny transmitter and receiver sending numbers instead of sound.

---

## Part B — *Pass the Ghost* (PRIMM Starter)

### Aim
Show how data travels between devices using radio messages and IDs.

### Pseudocode

    on start:
        set radio group to shared number
        set my ID (1 or 2)
        show my ID briefly
        clear screen
        if ID == 1 → start holding ghost
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
            if ID == 1 → target = 2
            else → target = 1
            send target over radio

---

### Teaching Steps

1. **Predict** – What will happen when Player 1 shakes? Why only one micro:bit reacts?  
2. **Run** – Test in pairs on same radio group; verify unique IDs.  
3. **Investigate** – Change group numbers or swap IDs to see effects.  
4. **Modify** – Add different icons or short melodies when receiving.  
5. **Make** – Let learners create themes (e.g. “pass the alien”) or extend to three players.

---

### Instructor Tips
- Keep player IDs visible on the desk to avoid confusion.  
- Highlight the `if` test logic — selection based on the message’s number.  
- Encourage pairs to narrate events aloud to show understanding.  
- Remind them that radio range depends on distance and obstacles.  

---

## Part C — Add Sounds and Replay

After a working version is tested:
- Add a **sound** when the ghost arrives (using tone or melody blocks).  
- Play again in pairs or small groups and compare timing and response.  
- Discuss how the sound travels through air while the message travels through radio waves.

---

## Part D — Quiz Recap (Weeks 1–2)

Spend final 15–20 minutes on a short quiz review:  
- Inputs and outputs  
- Loops and conditions  
- Variables and events  

Encourage peer discussion and self-checking before revealing answers.

---

## Assessment & Reflection
- Can learners explain the difference between sound waves and radio waves?  
- Can they identify where the radio message is sent and received in their program?  
- Do they use correct vocabulary (amplitude, frequency, transmitter, receiver)?  
- Observe collaboration and debugging approaches.  

> Reflect: “How did we turn an invisible wave into something we could see and hear on the micro:bit?”

---

## Common Misconceptions & Fixes

| Misconception | Clarification |
|----------------|---------------|
| Radio waves are sound | Radio waves are electromagnetic; sound needs air. |
| Amplitude = speed | Amplitude is height (strength), not speed. |
| All devices receive all messages | They only respond if the ID matches. |

---

## Differentiation
- **Beginners:** follow guided steps and use 2 players.  
- **Confident:** add sound effects or different icons.  
- **Stretch:** extend to 3+ players with random target logic.  

---

## Cross-Curricular Links

| Subject | Connection |
|----------|-------------|
| **Science** | Waves, energy transfer, radio communication. |
| **Maths** | Frequency as “times per second”; random numbers. |
| **Design & Technology** | Understanding networks and control systems. |
| **PSHE / Teamwork** | Cooperation and clear communication. |

---

## KS2 Computing Curriculum Mapping

| Strand | Evidence in Session |
|---------|---------------------|
| Programming A — Sequence | Ordered radio events. |
| Programming B — Repetition | Loops and repeated testing. |
| Programming C — Variables | `ghost`, `ID`, `target`. |
| Programming D — Selection | `if number == ID` logic. |
| Networks / Communication | Radio groups, IDs, message passing. |

---

## Materials & Setup
- BBC micro:bits + USB cables (or simulator)  
- Laptops / Chromebooks with MakeCode  
- Speakers or headphones for sound testing  
- Visual aids for wave illustrations  

---

## Safety & Safeguarding
- Keep cables tidy while testing.  
- Avoid loud volume when using tones.   
- Encourage kind communication and turn-taking in pairs.  

---

{% include back-to-autumn.html %}


<div class="notice--steam">
  <h2>Connections to STEAM Learning &amp; Real-World Links</h2>
  <ul>
    <li><strong>Computing:</strong> We will exchange data using the <strong>micro:bit radio</strong> and explore how groups and channels work.</li>
    <li><strong>Science:</strong> We will link our project to how <strong>signals</strong> and communication happen in everyday devices.</li>
    <li><strong>Maths:</strong> We will consider <strong>timing</strong>, ordering, and <strong>ranking</strong>—for example, who buzzes first.</li>
    <li><strong>Engineering &amp; Technology:</strong> We will design a fair communication system with clear <strong>feedback</strong> and reliable resets.</li>
    <li><em>Real world:</em> If time allows, we will connect this idea to everyday technology or careers.</li>
  </ul>
</div>


