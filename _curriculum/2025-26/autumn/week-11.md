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

**Focus Concept:** Measuring distance with sensors (inputs, timing and conditions)  
**Mini-Project:** Micro:bit parking / distance warning sensor

<div class="notice--steam">
  <h2>Connections to STEAM Learning</h2>
  <ul>
    <li><strong>Computing:</strong> We use an <strong>ultrasonic sensor</strong> as an input, read its values in code, and react using LEDs, sounds and logic.</li>
    <li><strong>Science:</strong> We explore <strong>sound waves</strong>, <strong>echolocation</strong> (bats, dolphins, submarines) and how the <strong>speed of sound</strong> links time and distance.</li>
    <li><strong>Maths:</strong> We work with <strong>measurements</strong> (centimetres), <strong>comparisons</strong> (&lt;, &gt;) and relate <strong>time to distance</strong> using a simple formula.</li>
    <li><strong>Engineering:</strong> We build a small <strong>physical system</strong> (micro:bit + expansion board + sensor), test it, and improve reliability through careful wiring and debugging.</li>
  </ul>
</div>

This week we moved from “games on the screen” into more physical computing.  
The children learned how an ultrasonic sensor can help a microcontroller “see” the world using sound — just like bats and dolphins do with echolocation. We talked about how the sensor sends out a tiny ultrasonic “ping”, waits for the echo to bounce back and then uses the time taken to work out how far away an object is.

Using the Keyestudio terminal block shield, a breadboard and jumper wires, everyone wired up an ultrasonic distance sensor to their micro:bit and turned it into a simple distance meter. From there we extended the code into a mini “parking sensor” / distance warning project, with icons, sounds and lights reacting as objects moved closer or further away.

---

## Objectives

By the end of this session, children should be able to:

- Describe, in simple terms, how <strong>echolocation</strong> works in animals and sensors.  
- Explain that the ultrasonic sensor is an <strong>input device</strong> which measures distance.  
- Recognise the role of the <strong>expansion board</strong> and <strong>breadboard</strong> in making safe, neat connections.  
- Use MakeCode to <strong>read a distance value</strong> and <strong>display it</strong> on the micro:bit.  
- Use <strong>conditions</strong> (if / else) to trigger warnings when an object is “too close”.  
- Begin to connect the idea that <strong>time of flight</strong> (echo time) is used to calculate distance.

---

## This Week’s Journey

We started with a quick science conversation about echolocation:

- Bats and dolphins use sound to navigate and find food in the dark.  
- Submarines use sonar to map the sea and avoid obstacles.  
- The key idea: send a sound, wait for the echo, measure how long it took.

Then we introduced the ultrasonic sensor:

- One “eye” <strong>sends</strong> the ultrasonic pulse (TRIG).  
- The other “eye” <strong>listens</strong> for the echo (ECHO).  
- The micro:bit measures how long the ECHO signal stayed high.

Using the Keyestudio terminal blocks shield, we connected:

- Sensor VCC to 3V  
- Sensor GND to GND  
- Sensor TRIG to pin P0  
- Sensor ECHO to pin P1  

Once everything was wired, we used a short piece of code to turn the micro:bit into a live distance meter. The display updated many times per second while the children moved their hands, books and other objects in front of the sensor and watched the numbers change.

We also talked (lightly) about the maths hidden inside the program:

- Sound travels about 343 m per second in air.  
- The sensor measures the time for the sound to go <em>there and back</em>.  
- Dividing this time by a number (58) gives an approximate distance in centimetres.  

After exploring the raw distance reading, we switched to a MakeCode extension that provides a simple “distance (cm)” block. This let us focus on building an actual project without worrying about microseconds.

---

## Mini-Project: Parking / Distance Warning Sensor

With the sensor working, children customised their own mini distance warning system. Typical features included:

- Showing a <strong>happy</strong> face when the path was clear.  
- Showing a <strong>warning</strong> or <strong>skull</strong> icon when an object was closer than a chosen distance.  
- Adding simple sounds that beeped more quickly as things got closer.  
- Using a bar-graph pattern on the LEDs to show “far → near”.

Some groups chose to imagine:

- A car parking aid (helping drivers avoid bumping a wall).  
- An intruder alarm at a door or corridor.  
- A “safety zone” around a precious object on the table.

---

## Try These Challenges

If your child would like to tinker further at home, you could suggest:

- **Change the safe distance:** try different thresholds (e.g. 5 cm, 15 cm) and see what feels realistic.  
- **Add traffic-light states:** use one icon for “safe”, another for “getting close”, and a third for “danger!”.  
- **Silent alarm:** make the micro:bit send a <strong>radio message</strong> to a second micro:bit instead of making noise.  
- **Measurement game:** guess how far away an object is, then check using the distance meter.  
- **Angle experiment:** see how readings change if the sensor or object is tilted (hard, flat surfaces give stronger echoes).

---

## Resources

- **MakeCode Editor (micro:bit):**  
  [https://makecode.microbit.org](https://makecode.microbit.org){:target="_blank" rel="noopener"}  
- **Ultrasonic Sensor Starter Project (distance meter):**  
  (Link to be added once the class code is finalised.)  
- **Example Parking Sensor / Distance Warning Project:**  
  (Link to be added for the project used in this session.)  
- **Background on echolocation (child-friendly videos/articles):**  
  You’ll find links to short bat and dolphin echolocation clips on this Week 11 page.

---

## Equipment

- BBC micro:bits + USB cables  
- Laptops / Chromebooks with internet access  
- Keyestudio micro:bit terminal blocks shield  
- Ultrasonic sensors (HC-SR04 or similar)  
- Breadboards and jumper wires  
- Optional: small objects for testing (books, pencil cases, boxes)

---

## Safety & Setup Notes

- Remind children to handle <strong>micro:bits, expansion boards and sensors</strong> gently and avoid pulling on cables.  
- Encourage tidy wiring to reduce accidental disconnections and tripping hazards.  
- If using buzzers or sounds, keep the volume classroom-friendly.  
- Support children in double-checking power and ground connections before powering up.

---

{% include back-to-autumn.html %}
{% include instructor-notes-link.html week=11 %}
