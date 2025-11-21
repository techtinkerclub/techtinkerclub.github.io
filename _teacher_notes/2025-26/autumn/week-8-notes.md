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

{% include print-to-pdf.html %}

# Instructor Notes — Week 8

**Theme:** Radio, Waves, Communication  
**Focus Concept:** Wireless communication using the micro:bit radio  
**Mini‑Project:** *Pass the Ghost* — broadcasting, receiving, and relaying messages

---

## Learning Objectives

- Understand the idea of radio waves as part of the electromagnetic spectrum  
- Describe how micro:bits send and receive data using radio groups  
- Read and write TTC‑style pseudocode involving events, conditions, and loops  
- Build a simple communication game using broadcasting  
- Reason about randomness, IDs, and message routing

---

## Vocabulary Focus

- **radio** – wireless communication using invisible waves  
- **broadcast** – sending a message to everyone listening  
- **ID** – a number that identifies each participant  
- **condition** – a yes/no check the program uses  
- **event** – something that triggers code (shake, receiving a number)  
- **random number** – an unpredictable value chosen by the computer

---

# Part A — Science Warm‑Up: Waves, Sound, and Radio

*(Use your own explanations from the session — this simply structures them for notes.)*

### What we covered:

- Sound waves: vibrations travelling through air  
- Light waves: part of the electromagnetic spectrum  
- Radio waves: invisible light used for communication  
- Why radios don’t need wires  
- Why we use **channels** (micro:bit “groups”) to avoid interference  

Explain to participants:

> “When a micro:bit sends a radio message, it’s like shouting — anyone on the same channel can hear it.  
> When it listens, it’s like keeping its ears open for incoming messages.”

This sets the foundation for Part B.

---

# Part B — Project: *Pass the Ghost*

Below is the full TTC‑style breakdown of the game you built.

Blocks version:

<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S39214-31133-40788-63085" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>

---

## B1 — Full TTC‑Style Pseudocode

```
WHEN program starts DO
    SET radio group TO 1
    SET radio power TO highest
    SET ID TO a chosen number
    SET players TO total number of players
    SET ghost TO false

    IF ID = 1 THEN
        SHOW ghost icon
        SET ghost TO true
    END IF
END WHEN

WHEN a radio number is received DO
    IF received number = ID THEN
        SET ghost TO true
        SHOW ghost icon
    END IF
END WHEN

WHEN device is shaken DO
    IF ghost = true THEN
        SET target TO ID
        WHILE target = ID DO
            SET target TO [random number from 1 to players]
            PAUSE 10 ms
        END WHILE
        SET ghost TO false
        SEND radio number target
        CLEAR screen
    END IF
END WHEN
```

---

## B2 — Step‑by‑Step Build With Explanations

Below each step is a detailed explanation you can use when teaching.

---

### **Step 1 — Radio Setup**

```text
SET radio group TO 1
SET radio power TO highest
SET ID TO a chosen number
SET players TO total number of players
SET ghost TO false
```

### Explanation

- A **radio group** is like a walkie‑talkie channel  
- All micro:bits on the same group can hear each other  
- Each participant gets an **ID** (1–10 in your version)  
- `ghost` starts as `false` because only Player 1 begins as the ghost  

Ask participants:

> “Why can’t everyone be on different groups?”  
> “Why do we need an ID?”

---

### **Step 2 — Start With One Ghost**

```text
IF ID = 1 THEN
    SHOW ghost icon
    SET ghost TO true
END IF
```

### Explanation

- Only player 1 starts as the ghost  
- Showing the ghost icon gives visual feedback  
- `ghost = true` means “I am currently the ghost”  

Useful question:

> “Why do we only let one player start as the ghost?”

---

### **Step 3 — Receiving a Message**

```text
WHEN a radio number is received DO
    IF received number = ID THEN
        SET ghost TO true
        SHOW ghost icon
    END IF
END WHEN
```

### Explanation

- When someone broadcasts a number, everyone hears it  
- Each micro:bit checks: **Is the message meant for me?**  
- If yes → that player becomes the ghost  
- If not → ignore it  

Analogy:

> “This is like shouting a name in a playground — only the person whose name you said reacts.”

---

### **Step 4 — Shake to Pass the Ghost**

```text
WHEN device is shaken DO
    IF ghost = true THEN
        SET target TO ID
        WHILE target = ID DO
            SET target TO [random number from 1 to players]
            PAUSE 10 ms
        END WHILE
        SET ghost TO false
        SEND radio number target
        CLEAR screen
    END IF
END WHEN
```

### Explanation

This is where most of the logic happens.

Break it down clearly:

#### **A. Only the ghost can pass the ghost**

```text
IF ghost = true THEN
```

Everyone else shaking their micro:bit does nothing.

#### **B. Pick a target**

```text
SET target TO ID
WHILE target = ID DO
    SET target TO [random number from 1 to players]
END WHILE
```

- Start by setting `target` to your own ID  
- Keep picking random players until you get a number that is *not* yours  
- This prevents passing the ghost to yourself  

Ask:

> “What would happen if we didn’t use the WHILE loop?”

#### **C. Send the message**

```text
SET ghost TO false
SEND radio number target
CLEAR screen
```

- You are no longer the ghost  
- The chosen player will receive the message  
- Clearing the screen removes the ghost icon  

---

## B3 — Final Program Behaviour (Summary)

- Exactly one person starts as the ghost  
- Shaking sends the ghost to someone else  
- Radio messages carry the ID of the next ghost  
- No wires — everything is wireless  
- Program combines **events**, **loops**, **conditions**, **randomness**, and **radio**

---

# Reflection & Wrap‑Up

You can finish the session by asking:

- “How does the micro:bit know who the message is for?”  
- “Why do we use random numbers?”  
- “How is sending a radio message like sending a text message?”  
- “Where do we check if we are the ghost?”  
- “Why do we need the WHILE loop?”

Tie it back to real-world communication:

- Wi‑Fi  
- Bluetooth  
- Mobile phones  
- Spacecraft sending signals  

---

{% include back-to-autumn.html %}
