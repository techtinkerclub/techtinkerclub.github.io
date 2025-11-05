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

## Week 8 — Radio, IDs & “Duck Hot-Potato”

**Focus Concept:** Radio messages, IDs and selection  
**Mini-Projects:** *Pass the Blink (radio starter)* → *Duck Hot-Potato (multiplayer game)*

This week we learned how micro:bits can **talk to each other using radio**.  
We began with a tiny program that simply *passed a blink* to another device, then expanded the idea into a full **multiplayer Duck Hot-Potato game** that uses **IDs**, **randomness**, and **timers**.

---

## Objectives
- Understand what **radio waves** are and how the micro:bit uses them to send **messages**.  
- Use a shared **radio group** so devices can talk to each other.  
- Identify each device with a unique **ID** and use **selection** (`if`) to route messages.  
- Build a multiplayer game that uses **variables**, **loops**, **random**, and **conditions**.  
- Practise debugging and teamwork while play-testing in small groups.  

---

## Success Criteria
- I can explain in simple words how a message travels from one micro:bit to another.  
- I can set a **radio group** and send/receive a **number**.  
- I can give my device an **ID** and only react to **messages for me**.  
- I can build (or extend) the Duck Hot-Potato game so it works with my team.  

---

## Key Vocabulary
- **Radio wave** — an invisible wave that carries information through the air.  
- **Transmitter** — the device that **sends** the message.  
- **Receiver** — the device that **gets** the message.  
- **Antenna** — the part that helps send and receive radio waves.  
- **Frequency** — how fast a wave wiggles (waves per second).  
- **Amplitude** — how big the wave is (linked to signal strength).  
- **Interference** — when other signals or noise make it harder to hear the message.  
- **Message / Packet** — the data we send (like a number) in one go.  
- **Radio Group** — a shared channel (like a chat room) that devices join to talk.  
- **ID** — a number that identifies a player or device.  
- **Variable** — a labelled box that stores a value (e.g. `timer`, `hasDuck`).  
- **Condition** — an `if` test that decides what happens next.  
- **Loop** — repeats instructions, e.g. `forever` or `repeat 10`.  

---

## Part A — Radio Mini-Lesson + “Pass the Blink”

### What We Explored
1. **How radio works:** one device is a *transmitter*, others are *receivers*; everyone in the same *group* can hear the message.  
2. **Pass the Blink:** pressing a button sends a **number**; the matching micro:bit blinks an icon for a moment.  
3. **Add an ID:** each device only responds if the **message equals its ID** — otherwise it ignores it.  

> 💡 *Like calling a friend’s name in a busy playground; only the right friend answers.*

### Mini-Challenges
- Change the **icon** shown on receive.  
- Swap which **button** sends the message.  
- Add a second button to send to a **different ID**.  
- Add a short **pause** then clear the screen.  

---

## Part B — Duck Hot-Potato (Game Build)

### What We Built
1. **Setup:** everyone uses the same **radio group**; each player sets the **total players** and their **own ID** (1…N).  
2. **Catching the duck:** when a micro:bit receives *its* ID, it “has the duck,” shows a duck icon and starts a **random fuse** timer.  
3. **Passing:** shake the micro:bit to pass early; if the timer runs out while still holding, you **“die”** and it auto-passes.  
4. **Fair play:** if a dead player receives the duck, it **forwards** immediately so it never gets stuck.  

### Duck Hot-Potato Code (JavaScript / MakeCode)

```typescript
// Duck Hot-Potato — peer-to-peer (no host)
// All players must share the same radio group.
// Each sets: total players and its own ID (1..players).

radio.onReceivedNumber(function (receivedNumber) {
    if (receivedNumber == ID) {
        if (!dead) {
            hasDuck = true
            timer = randint(50, 150) // 0.5–1.5 s fuse
            basic.showIcon(IconNames.Duck)
            while (timer > 0 && hasDuck) {
                timer += -1
                basic.pause(10)
            }
            if (hasDuck) {
                send()
                dead = true
                basic.showIcon(IconNames.Skull)
            }
        } else {
            forward()
        }
    }
})

function send () {
    if (!hasDuck) return
    let target = ID
    while (target == ID) {
        target = randint(1, players)
        basic.pause(10)
    }
    hasDuck = false
    timer = 0
    basic.clearScreen()
    radio.sendNumber(target)
}

function forward () {
    let target = ID
    while (target == ID) {
        target = randint(1, players)
        basic.pause(10)
    }
    radio.sendNumber(target)
}

input.onGesture(Gesture.Shake, function () {
    if (!dead && hasDuck) {
        send()
    }
})

let timer = 0
let hasDuck = false
let dead = false
let ID = 0
let players = 0

radio.setGroup(42)
radio.setTransmitPower(7) // optional: stronger signal

players = 4   // total players
ID = 1        // change per micro:bit (1..players)

dead = false
basic.showNumber(ID)
basic.pause(400)
basic.clearScreen()

if (ID == 1) {
    hasDuck = true
    basic.showIcon(IconNames.Duck)
}

