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

## Week 11 — Ultrasonic Sensors, Echolocation & Mapping

**Focus Concept:** Measuring distance with sensors and mapping values  
**Mini-Project:** Echolocation beeper (closer = faster beeps, farther = slower beeps)

<div class="notice--steam">
  <h2>Connections to STEAM Learning</h2>
  <ul>
    <li><strong>Computing:</strong> We use an <strong>ultrasonic sensor</strong> as an input, read its values in code, and use <strong>mapping</strong>, <strong>conditions</strong> and an <strong>extension</strong> to control sounds.</li>
    <li><strong>Science:</strong> We explore <strong>sound waves</strong>, <strong>echolocation</strong> in bats and dolphins, and how the <strong>speed of sound</strong> links time and distance.</li>
    <li><strong>Maths:</strong> We work with <strong>measurements</strong> (centimetres), <strong>comparisons</strong> (&lt;, &gt;) and use <strong>mapping</strong> to translate one range of values (distance) into another (pause time).</li>
    <li><strong>Engineering:</strong> We build a small <strong>physical system</strong> (micro:bit + expansion board + ultrasonic sensor), test it, and debug wiring and code to make it reliable.</li>
  </ul>
</div>

This week we moved deeper into **physical computing** and “real-world” sensing.  
The children learned how an ultrasonic sensor can help a microcontroller estimate distance using sound — very similar to how bats and dolphins use **echolocation**.

We talked about how the sensor sends out a tiny ultrasonic “ping”, waits for the echo to bounce back and then measures how long that took. From this time, the micro:bit can calculate an approximate distance.

Using the Keyestudio terminal block shield, a breadboard and jumper wires, everyone wired up an ultrasonic distance sensor to their micro:bit. We then built an **“echolocation beeper”**: a program where the micro:bit beeps **faster when something is close** and **slower when it is far away**. To do this, we introduced two important ideas:

- **Extensions** — add-on packs in MakeCode that give us new blocks for special hardware (like the ultrasonic sensor).  
- **Mapping** — turning one range of values (distance in cm) into another range of values (pause time in ms).

---

## Objectives

By the end of this session, children should be able to:

- Describe, in simple terms, how <strong>echolocation</strong> works in animals and sensors.  
- Explain that the ultrasonic sensor is an <strong>input device</strong> which measures distance.  
- Recognise the role of the <strong>expansion board</strong> and <strong>breadboard</strong> in making neat, safe connections.  
- Use a MakeCode <strong>extension</strong> block to read a distance value from the ultrasonic sensor.  
- Use <strong>mapping</strong> to turn a distance into a suitable pause time for beeps.  
- Use <strong>conditions</strong> and <strong>loops</strong> to control how fast the micro:bit beeps as objects move closer or further away.

---

## This Week’s Journey

We began with a short science discussion:

- Bats and dolphins send out clicks or squeaks and listen for the echo to find obstacles and prey.  
- Submarines do something similar with sonar to map the sea and avoid collisions.  
- The key idea is always the same: <strong>send sound → get echo → measure the delay</strong>.

Then we introduced the ultrasonic sensor:

- One “eye” <strong>sends</strong> the ultrasonic pulse (TRIG).  
- The other “eye” <strong>listens</strong> for the echo (ECHO).  
- The micro:bit measures how long the ECHO signal stays high, which tells us how long the sound wave took to travel there and back.

Using the Keyestudio terminal block shield, we connected:

- Sensor VCC to 3V  
- Sensor GND to GND  
- Sensor TRIG to pin P0  
- Sensor ECHO to pin P1  

We briefly showed a lower-level (“behind the scenes”) version of the code, where the micro:bit manually sends a tiny trigger pulse and uses microseconds to time the echo. This helped children understand that, inside the neat block they will use later, there is quite a bit of careful timing and maths.

After that, we moved to a more practical and readable solution by adding an **ultrasonic sensor extension** in MakeCode. This extension provides a block that directly gives us a distance in centimetres. Instead of writing all the timing code ourselves, we can now use a single block that clearly says “distance (cm)”, which makes the main program easier to understand.

Finally, we introduced the idea of **mapping**: taking a distance (for example, from 5 cm to 50 cm) and converting it into a pause time (for example, from 100 ms to 800 ms). This allowed us to control how quickly the micro:bit beeps, based on how close an object is.

---

## Mini-Project: Echolocation Beeper

For the main activity, the children programmed their micro:bit to behave a bit like a bat:

- When something is **very close**, the beeps are **fast** and can sound urgent.  
- When something is **far away**, the beeps are **slower** and more relaxed.

Using the ultrasonic extension, a typical loop in their program looked like:

1. Read the current **distance** from the ultrasonic sensor.  
2. **Map** that distance from a range like 5–50 cm into a range of pause times like 100–800 ms.  
3. Play a short tone.  
4. Pause for the mapped amount of time.  
5. Repeat.

Some children added extra touches such as:

- Higher-pitched notes when very close and lower notes when far.  
- Icons on the LED display to show “safe”, “getting close” and “danger!”.  
- Different behaviour when nothing was detected within a reasonable distance.

In small groups, they tried different objects (books, pencil cases, hands, soft fabric) and noticed how the beeping pattern changed depending on how well the sound bounced back.

---

## Try These Challenges

If your child would like to tinker further at home, you could suggest:

- **Experiment with the ranges:**  
  Try different mapping ranges. What happens if we change the “close” distance or the minimum/maximum pause time?  
- **Pitch and speed together:**  
  Map distance both to the <em>pause</em> and to the <em>pitch</em>, so close objects give high, fast beeps and distant objects give low, slow beeps.  
- **Three-zone display:**  
  Add icons for “safe”, “warning” and “too close” and link them to distance thresholds.  
- **Guess the distance:**  
  One person holds an object at an unknown distance. Can the other person guess “close, medium or far” just by listening to the beep pattern?  
- **Silent sonar:**  
  Instead of sound, use radio messages or LED patterns as the output, while still using the ultrasonic sensor and mapping underneath.

---

## Vocabulary

- **ECHOLOCATION** — finding out where things are by making a sound and listening for the echo.  
  Used by bats, dolphins and our ultrasonic sensor.

- **ULTRASONIC SENSOR** — an input device that sends out high-pitched sound and listens for the echo to estimate how far away an object is.

- **EXTENSION** — an extra pack of blocks you can add to MakeCode.  
  It usually controls special hardware (like an ultrasonic sensor or LED strip) or adds new features. Inside the extension, someone has already written the harder code for us.

- **EXTENSION BLOCK** — a MakeCode block that comes from an extension.  
  It looks like a normal block but is part of an add-on for a specific sensor, motor or feature.

- **MAPPING** — changing a value from one range into another range while keeping its position.  
  Example: mapping a distance from 5–50 cm into a delay from 100–800 ms so that closer = smaller delay and farther = bigger delay.

- **INPUT DEVICE** — a component that sends information <em>into</em> the micro:bit (for example: buttons, light sensor, ultrasonic sensor).

---

## Resources

- **MakeCode Editor (micro:bit):**  
  [https://makecode.microbit.org](https://makecode.microbit.org){:target="_blank" rel="noopener"}

- **Ultrasonic Sensor Starter Project (distance meter):**  
  (Link to be added once the class code is finalised.)

- **Echolocation Beeper Example:**  
  (Link to be added for the version using mapping and the ultrasonic extension.)

- **Background on echolocation (child-friendly videos/articles):**  
  Short clips about bats, dolphins and sonar are linked from this Week 11 page.

---

## Equipment

- BBC micro:bits + USB cables  
- Laptops / Chromebooks with internet access  
- Keyestudio micro:bit terminal blocks shield  
- Ultrasonic sensors (HC-SR04 or similar)  
- Breadboards and jumper wires  
- Optional: small objects for testing (books, pencil cases, boxes, soft and hard materials)

---

## Safety & Setup Notes

- Remind children to handle <strong>micro:bits, expansion boards and sensors</strong> carefully and avoid pulling on cables.  
- Encourage tidy wiring so that boards don’t get pulled off tables and connections stay secure.  
- If using sound, keep the volume and beeping rate reasonable for the classroom.  
- Support children in double-checking power and ground connections before powering up their circuit.

---

{% include back-to-autumn.html %}
{% include instructor-notes-link.html week=11 %}
