---
layout: single
title: ""
permalink: /curriculum/2025-26/autumn/week-11/
week: 11
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

{% include back-to-autumn.html %}

## Week 11 — Ultrasonic Sensors & Echolocation

**Focus Concept:** Using input sensors + mapping to control output behaviour  
**Mini-Project:** *Echolocation Beeper* (closer = faster beeps, farther = slower beeps)

<div class="notice--steam">
  <h2>Connections to STEAM Learning</h2>
  <ul>
    <li><strong>Computing:</strong> We used an <strong>ultrasonic sensor</strong> as an input device, applied <strong>mapping</strong> to scale values, and used a MakeCode <strong>extension</strong> to simplify sensor control.</li>
    <li><strong>Science:</strong> We linked our project to <strong>echolocation</strong> in bats and dolphins, exploring how sound waves reflect off objects.</li>
    <li><strong>Maths:</strong> We worked with measurements (cm), <strong>comparisons</strong>, and converted one range of values into another using <strong>mapping</strong>.</li>
    <li><strong>Engineering & Technology:</strong> We built a working system using the micro:bit, a <strong>terminal block expansion board</strong>, a breadboard and an ultrasonic sensor.</li>
  </ul>
</div>

This week we explored how computers can “sense” distance using sound, just like animals that use **echolocation**.  
We learned how an ultrasonic sensor sends out a tiny ultrasonic “ping”, listens for the echo, and estimates distance based on how long the echo takes to return.

We first wired the sensor on **P0** (TRIG) and **P1** (ECHO) to understand the raw timing code behind the scenes.  
Later, when switching to the MakeCode extension, we deliberately moved the sensor to **P13** and **P14**. This showed that extensions can use **any** suitable pins — we are not limited to just P0 and P1 — and that choosing pins is part of designing a physical computing system.

With everything connected, we turned every micro:bit into a small “bat”: it beeps more quickly when something is close, and slowly when things are far away.  
To do this, we also introduced two important ideas: **mapping**, and **extensions**.

---

## Objectives
- Understand, in simple terms, how <strong>echolocation</strong> helps animals and sensors detect distance.  
- Wire an <strong>ultrasonic sensor</strong> using the expansion board and breadboard.  
- Read distance values from the sensor in MakeCode using an <strong>extension block</strong>.  
- Use <strong>mapping</strong> to convert distance ranges into suitable pause times.  
- Build an <strong>echolocation beeper</strong> where the beeping rate changes based on how close an object is.  
- Practise <strong>loops</strong>, <strong>conditional logic</strong> and <strong>input/output</strong> behaviour.

---

## Success Criteria
- I can explain how the ultrasonic sensor measures distance using echo time.  
- I can wire TRIG and ECHO pins correctly using the terminal block shield.  
- I can use an <strong>extension</strong> to simplify my code and read distance in centimetres.  
- I can use <strong>mapping</strong> to scale a distance into a delay.  
- I can control the speed of beeping based on how near or far an object is.  
- I can test and improve my program when the response doesn’t match what I expected.

---

## Key Vocabulary
- **Echolocation** — finding where things are by sending sound and listening for the echo (used by bats, dolphins, and ultrasonic sensors).  
- **Ultrasonic sensor** — an input device that sends out high-pitched sound and listens for the echo to estimate distance.  
- **TRIG / ECHO** — the two key pins on an ultrasonic sensor: one <em>sends</em> the pulse (TRIG) and one <em>receives</em> the echo (ECHO).  
- **Extension** — an add-on pack in MakeCode that gives us extra blocks for special hardware (like the ultrasonic sensor).  
- **Extension block** — a block that comes from an extension and performs a more complex action behind the scenes.  
- **Mapping** — converting a value from one range into another (e.g. distance 5–50 cm → pause 100–800 ms).  
- **Input device** — something that sends information <em>into</em> the micro:bit (buttons, sensors).  
- **Output** — something the micro:bit does (sounds, lights, messages).

---

## Part A — Echolocation & Real-World Sensing
We began with a discussion about animals that use **echolocation**, such as bats and dolphins.  
Children explored how sending a sound and listening for the reflection helps creatures navigate in the dark or underwater. We linked this to sonar used in ships and submarines.

We handled the ultrasonic sensor and identified the two “eyes”:  
- one sends the sound pulse,  
- the other listens for the echo.  

This allowed us to clearly understand how our micro:bit would measure distance.

---

## Part B — Wiring & Understanding the Sensor
Using the Keyestudio terminal block shield and a breadboard, children wired:

- **VCC → 3V**  
- **GND → GND**  
- **TRIG → P0** (for the raw demo)  
- **ECHO → P1** (for the raw demo)

We demonstrated the “behind the scenes” code that sends a 10-microsecond trigger pulse and measures the echo time with `pulseIn()`, explaining why dividing by **58** gives a distance in centimetres.

After this low-level demonstration, we added a MakeCode **extension** to make the program clearer.  
To emphasise that extensions are flexible, we **chose different pins** this time:

- **TRIG → P13**  
- **ECHO → P14**

This showed that extensions can work with **any** suitable pins, not just P0/P1, and that choosing pins is part of designing real systems.

---

## Part C — Echolocation Beeper (Build & Play)
For our main activity, we turned each micro:bit into a “bat”.  
Using the extension to read distance and a **mapping** block, children created a system where:

- **Close object → very fast beeps**  
- **Medium distance → medium-speed beeps**  
- **Far away → slow beeps**  

Mapping allowed us to convert one range (10–300 cm) into another range (e.g. 100–1000 ms), creating smooth and realistic behaviour.

---

## Resources
- **MakeCode Editor:**  
  <https://makecode.microbit.org>{:target="_blank" rel="noopener"}
- **Ultrasonic Distance Extension:**  
  Added through the **Extensions** menu in MakeCode  
- **Example Echolocation Beeper Project:**  
  (Link added once final class code is saved)
- **Videos on Echolocation:**  
  Linked alongside this page (bats, dolphins, sonar).

---

## Equipment
- BBC micro:bits + USB cables  
- Laptops / Chromebooks with internet access  
- Keyestudio micro:bit terminal blocks shield  
- Ultrasonic sensors (HC-SR04 or similar)  
- Breadboards and jumper wires  
- Optional: small objects for distance testing

---

## Safety & Setup Notes
- Double-check power and ground wiring before switching on.  
- Keep wires tidy to avoid disconnections while testing.  
- If using sound, keep volume reasonable in the classroom.  
- Support children in testing, observing and adjusting their code based on what the sensor reads.

---

{% include back-to-autumn.html %}
{% include instructor-notes-link.html week=11 %}
