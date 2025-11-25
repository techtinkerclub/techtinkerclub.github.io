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

**Focus Concept:** Using input sensors + mapping & constraining to control output behaviour  
**Mini-Project:** *Echolocation Beeper* (closer = faster beeps, farther = slower beeps)

<div class="notice--steam">
  <h2>Connections to STEAM Learning</h2>
  <ul>
    <li><strong>Computing:</strong> We used an <strong>ultrasonic sensor</strong> to read real-world values, introduced two important maths functions — <strong>mapping</strong> (converting ranges) and <strong>constrain</strong> (keeping values safe), and used a MakeCode <strong>extension</strong> to simplify hardware control.</li>
    <li><strong>Science:</strong> We linked our project to <strong>echolocation</strong> in bats and dolphins, exploring how sound waves reflect off surfaces.</li>
    <li><strong>Maths:</strong> We worked with measurements (cm), <strong>comparisons</strong>, <strong>range conversions</strong> using <strong>mapping</strong>, and learned why we sometimes need to <strong>constrain</strong> noisy sensor values.</li>
    <li><strong>Engineering & Technology:</strong> We built a working sensing system using the micro:bit, a <strong>terminal block expansion board</strong>, a breadboard and an ultrasonic sensor.</li>
  </ul>
</div>

This week we explored how computers can “sense” distance using sound, just like animals that use **echolocation**.  
We learned how an ultrasonic sensor sends out a tiny ultrasonic “ping”, listens for the echo, and estimates distance based on how long the echo takes to return.

We first wired the sensor on **P0** (TRIG) and **P1** (ECHO) to understand the raw timing code behind the scenes.  
Later, when switching to the MakeCode extension, we deliberately moved the sensor to **P13** and **P14**. This showed that extensions can use **any** suitable pins — we are not limited to just P0 and P1 — and that choosing pins is part of designing a physical computing system.

With everything connected, we turned every micro:bit into a small “bat”: it beeps more quickly when something is close and slowly when things are far away.  
To do this, we introduced two essential maths tools:

- **mapping** — converting one range (10–300 cm) into another (100–1000 ms)  
- **constrain** — keeping sensor values inside a predictable range before mapping

These help keep the beeping smooth and realistic.

---

## Objectives
- Understand how <strong>echolocation</strong> helps animals and sensors detect distance.  
- Wire an <strong>ultrasonic sensor</strong> using the expansion board and breadboard.  
- Read distance values from the sensor using a MakeCode <strong>extension block</strong>.  
- Use <strong>constrain</strong> to keep distance readings in a safe range.  
- Use <strong>mapping</strong> to convert a distance value into a pause duration.  
- Build an <strong>echolocation beeper</strong> where beeping changes based on how near an object is.  
- Practise <strong>loops</strong>, <strong>input/output</strong> behaviour, and simple maths functions.

---

## Success Criteria
- I can explain how the ultrasonic sensor measures distance using echo time.  
- I can wire TRIG and ECHO pins correctly using the terminal block shield.  
- I can read distance easily using an <strong>extension block</strong>.  
- I can use <strong>constrain</strong> to stabilise sensor readings.  
- I can use <strong>mapping</strong> to convert distance into a delay.  
- I can make a program where beeping becomes faster as something gets closer.  
- I can test and adjust my code to improve the behaviour.

---

## Key Vocabulary
- **Echolocation** — finding where things are by sending sound and listening for the echo.  
- **Ultrasonic sensor** — an input device that sends high-frequency sound and listens for the reflection.  
- **TRIG / ECHO** — the pins used to send the pulse (TRIG) and receive the echo (ECHO).  
- **Extension** — an add-on pack in MakeCode that gives extra blocks for special hardware.  
- **Mapping** — converting a number from one range into another (e.g. 10–300 → 100–1000).  
- **Constrain** — keeping a value inside a chosen minimum and maximum range.  
- **Input device** — something that gives the micro:bit information.  
- **Output** — something the micro:bit does (sound, light, messages).

---

## Part A — Echolocation & Real-World Sensing
We began with a discussion about animals that use **echolocation**, such as bats and dolphins.  
Children explored how sending a sound and listening for the reflection helps creatures navigate in the dark or underwater. We linked this to sonar used in ships and submarines.

We handled the ultrasonic sensor and identified the two “eyes”:
- one sends the sound pulse,  
- the other listens for the echo.

This gave us a clear mental model of how the micro:bit measures distance.

---

## Part B — Wiring & Understanding the Sensor
Using the Keyestudio terminal block shield and a breadboard, children wired:

- **VCC → 3V**  
- **GND → GND**  
- **TRIG → P0** (for the raw demo)  
- **ECHO → P1** (for the raw demo)

We demonstrated the “behind the scenes” timing code and explained why dividing the echo time by **58** gives a distance in centimetres.

After this low-level demonstration, we added a MakeCode **extension** to make everything cleaner.  
To emphasise that extensions are flexible, we wired the sensor to different pins for the main project:

- **TRIG → P13**  
- **ECHO → P14**

---

## Part C — Echolocation Beeper (Build & Play)
For our main activity, we turned each micro:bit into a “bat”.

Using the extension to read distance — and combining **mapping** + **constrain** — children created a system where:

- **Close object → fast beeps + bright LED**  
- **Medium distance → medium-speed beeps**  
- **Far away → slow beeps + dim LED**

Mapping allowed us to convert 10–300 cm smoothly into 100–1000 ms.  
Constraining kept the sensor values stable so the behaviour didn’t jump around.

---

## Resources
- **MakeCode Editor: **  [Link](<https://makecode.microbit.org>){:target="_blank" rel="noopener"}  
- **Ultrasonic Sensor - no extension: **  [Code](https://makecode.microbit.org/S35833-69730-32788-01921){:target="_blank" rel="noopener"}  
- **Echolocation project - using extension: **  [Code](https://makecode.microbit.org/S67741-95959-79621-04923){:target="_blank" rel="noopener"}  
- **How Do Ultrasonic Distance Sensors Work?: **  [Video 1](https://youtu.be/2ojWO1QNprw?si=MehHW_xLUpUQP3BR){:target="_blank" rel="noopener"}  /   [Video 2](https://youtu.be/T11ptR8ICl4?si=xdOlQp6twNNjwH5k){:target="_blank" rel="noopener"}
- **What Is Echolocation? - BBC Earth Explore: **  [Video](https://youtu.be/l2py029bwhA?si=z4V8ZSb5NYGusdZI){:target="_blank" rel="noopener"}
- **How does whale communication work? - TED-Ed: **  [Video](https://youtu.be/00Ar2_irvJk?si=ar3NRj7kyLp4a9T6){:target="_blank" rel="noopener"}

---

## Equipment
- BBC micro:bits + USB cables  
- Laptops / Chromebooks  
- Keyestudio terminal block shield  
- Ultrasonic sensors (HC-SR04 or similar)  
- Breadboards + jumper wires  
- Objects for testing

---

## Safety & Setup Notes
- Double-check TRIG/ECHO wiring before powering.  
- Keep wires tidy to avoid disconnects.  
- Keep volume of beeps comfortable in groups.  
- Encourage children to experiment with distance safely.

---

{% include back-to-autumn.html %}
{% include instructor-notes-link.html week=11 %}
