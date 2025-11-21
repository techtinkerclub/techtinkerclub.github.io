---
layout: single
title: ""
permalink: /teacher_notes/2025-26/autumn/week-9-notes/
week: 9
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

# Instructor Notes — Week 9

**Theme:** Synchronisation, Communication & Emergent Behaviour  
**Focus Concept:** How simple local rules can create large‑scale patterns  
**Mini‑Projects:**  
- **A: Firefly Synchronisation** (local synchrony → global effects)  
- **B: Exploding Duck** (radio communication, IDs, state, timers)  

---

## Learning Objectives

Participants should be able to:

- Explain how devices can **synchronise** using only local communication.  
- Understand that **global patterns** can emerge from simple local rules.  
- Read and explain **TTC‑style pseudocode** involving radio events, loops, and timers.  
- Understand **state variables** (`clock`, `hasDuck`, `dead`, `timer`).  
- Appreciate how radio communication uses **groups**, **IDs**, and **messages**.

---

## Vocabulary Focus

- **synchronisation** – matching timing with neighbours or signals.  
- **local rule** – behaviour based only on what you see/hear around you.  
- **emergent pattern** – a big pattern that appears when many small actions combine.  
- **broadcast** – send a message to everyone on the radio group.  
- **state** – information that describes what mode the program is in.  
- **timer** – a variable used to count down without blocking the program.  
- **ID** – your unique number so you know who a message is for.  

---

## Session Flow

1. **Warm‑up:** What are synchronised patterns? (birds, fireflies, clocks, applause)  
2. **Part A – Firefly Synchronisation**  
3. **Part B – Exploding Duck**  
4. **Wrap‑Up & Reflection**

---

# Part A — Firefly Synchronisation  
*A miniature model of how synchrony emerges from local communication*

### MakeCode Blocks Version  
<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
<iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S36785-83339-30622-24316" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe>
</div>

---

## A1 — TTC Pseudocode (Firefly Sync)

### Step 1 — Setup radio
```text
WHEN program starts DO
    SET clock TO 0
    SET radio group TO 12
    SET transmit power TO 1
END WHEN
```
**Explanation:**  
We put all micro:bits in the same *radio group* so they can hear each other.  
A low transmit power means the communication resembles local “nearby neighbour” behaviour — just like real fireflies.

---

### Step 2 — When I receive a tick from a neighbour
```text
WHEN radio receives a number DO
    INCREASE clock BY 1
END WHEN
```
**Explanation:**  
Whenever a neighbour “flashes”, they send a small message.  
When we hear it, we **advance our own clock**.  
This is the key mechanic: hearing a neighbour nudges our timing closer to theirs.

---

### Step 3 — My own ticking loop
```text
FOREVER DO
    IF clock >= 8 THEN
        SEND radio number 0       // tell neighbours I flashed
        FLASH SCREEN              // bright moment = firefly flash
        PAUSE 200 ms              // short rest
        SET clock TO 0            // restart my cycle
    ELSE
        PAUSE 100 ms
        INCREASE clock BY 1       // normal ticking
    END IF
END FOREVER
```

**Explanation:**  
Each micro:bit has an internal “clock” that rises steadily.  
When it reaches 8, the micro:bit **flashes** and resets.  
But because receiving neighbour flashes pushes your clock forward, eventually all micro:bits’ clocks line up naturally.

This is how **synchrony emerges from local signals** — no leader required.

---

### A2 — Key teaching points

- Each micro:bit only reacts to **local messages** from nearby devices.  
- With enough neighbours, the pattern grows into **global synchrony**.  
- This mirrors how real fireflies match their flashing in nature.  
- The program is extremely short but creates beautiful collective behaviour.

---

# Part B — Exploding Duck  
*A fast‑paced radio game using state, IDs, and timers*

### MakeCode Blocks Version  
<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
<iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S21329-33783-70559-31040" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe>
</div>

---

## B1 — TTC Pseudocode (Exploding Duck)

### Step 1 — Setup
```text
WHEN program starts DO
    SET players TO (total players)
    SET ID TO (your unique number)
    SET hasDuck TO FALSE
    SET dead TO FALSE
    SET timer TO 0
    SET radio group TO 42
    SET transmit power TO 7

    SHOW NUMBER ID
    PAUSE 400 ms
    CLEAR SCREEN

    IF ID = 1 THEN
        SET hasDuck TO TRUE
        SHOW ICON duck
    END IF
END WHEN
```

**Explanation:**  
Each micro:bit knows **how many players** there are and which **ID** it is.  
Only Player 1 starts with the duck.  
Transmit power is high because all players must hear each other.

---

### Step 2 — Receiving the duck
```text
WHEN radio receives number DO
    IF received number = ID THEN
        IF dead = FALSE THEN
            SET hasDuck TO TRUE
            SET timer TO random value 50..150   // 0.5–1.5 s fuse
            SHOW ICON duck
        ELSE
            CALL forward()                      // pass immediately if dead
        END IF
    END IF
END WHEN
```

**Explanation:**  
If a message with **your ID** arrives, the duck is now yours.  
Dead players can still *relay* the duck — they just can’t survive holding it.

---

### Step 3 — Shake to pass early
```text
WHEN shake detected DO
    IF dead = FALSE THEN
        IF hasDuck = TRUE THEN
            CALL send()
        END IF
    END IF
END WHEN
```

**Explanation:**  
You may pass the duck voluntarily — but only if you’re alive and currently holding it.

---

### Step 4 — Send the duck
```text
FUNCTION send() DO
    IF hasDuck = TRUE THEN
        SET target TO ID
        WHILE target = ID DO
            SET target TO random player 1..players
            PAUSE 10 ms
        END WHILE

        SET hasDuck TO FALSE
        SET timer TO 0
        CLEAR SCREEN
        SEND radio number target
    END IF
END FUNCTION
```

**Explanation:**  
Choose someone else at random.  
Reset your timer and send the duck away.

---

### Step 5 — Forwarding (even if dead)
```text
FUNCTION forward() DO
    SET target2 TO ID
    WHILE target2 = ID DO
        SET target2 TO random player 1..players
        PAUSE 10 ms
    END WHILE
    SEND radio number target2
END FUNCTION
```

**Explanation:**  
A dead player can still forward the duck the moment it arrives.  
This keeps the game circulating quickly.

---

### Step 6 — Non‑blocking countdown
```text
FOREVER DO
    IF hasDuck = TRUE THEN
        IF timer > 0 THEN
            SET timer TO timer - 1
            PAUSE 10 ms

            IF timer = 0 THEN
                IF hasDuck = TRUE THEN
                    SET dead TO TRUE
                    CALL forward()
                    SET hasDuck TO FALSE
                    SHOW ICON skull
                END IF
            END IF
        END IF
    END IF
END FOREVER
```

**Explanation:**  
This is the heart of the game.  
The countdown ticks down *without freezing the micro:bit*.  
So radio still works, shaking still works, and messages still move.  
When the timer hits zero, you explode → you forward the duck → and you’re out.

---

# Reflection & Wrap‑Up

Questions to ask:

- “How does local information lead to big synchronised patterns?”  
- “How do timers and radio events run at the same time?”  
- “What state variables did we use in Exploding Duck?”  
- “What happens when many players forward messages at once?”  

Both activities show how **simple rules** produce surprisingly complex behaviour — a key idea in computing, robotics, biology, and physics.

---

{% include back-to-autumn.html %}
