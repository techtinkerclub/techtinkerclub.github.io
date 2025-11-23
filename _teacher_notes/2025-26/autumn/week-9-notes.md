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
**Focus Concept:** How simple local rules can create large-scale patterns  
**Mini-Projects:**  
- **A: Firefly Synchronisation** — local timing → global synchrony  
- **B: Exploding Duck** — radio messaging, state, timers, events

---

## Learning Objectives

Participants should be able to:

- Explain how devices can **synchronise** using simple local communication.  
- Understand that **emergent patterns** (large behaviours) come from many small local rules.  
- Read and explain **TTC pseudocode** involving radio events, timers, conditions, and loops.  
- Use and interpret **state variables** (`clock`, `hasDuck`, `dead`, `timer`, `ID`).  
- Understand radio fundamentals: **groups**, **broadcasts**, **message IDs**, **local vs global range**.

---

## Vocabulary Focus

- **synchronisation** – matching timing with neighbours.  
- **local rule** – a rule based only on the immediate environment.  
- **emergent behaviour** – a complex pattern created when many simple behaviours interact.  
- **broadcast** – send a message to everyone listening in the same group.  
- **state** – information describing the current mode or condition of a device.  
- **timer** – a variable used to measure time without freezing the program.  
- **ID** – a unique number that identifies a player or device.  

---

## Session Flow

1. **Warm-up discussion:** synchronised patterns in nature (fireflies, applause, pendulum clocks).  
2. **Part A – Firefly Synchronisation**  
3. **Part B – Exploding Duck**  
4. **Wrap-Up reflection**

---

# Part A — Firefly Synchronisation  
*A hands-on demonstration of emergent behaviour through local communication.*

## MakeCode Blocks Version  
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
- `clock` represents each micro:bit's internal timing cycle.  
- All devices join **radio group 12**, meaning they can hear each other.  
- A **low transmit power** (1) ensures messages only reach nearby micro:bits.  
  This creates “local neighbourhoods” — essential for demonstrating emergent synchrony.

---

### Step 2 — When I receive a tick from a neighbour
```text
WHEN radio receives a number DO
    INCREASE clock BY 1
END WHEN
```
**Explanation:**  
- A neighbour “flashes” and broadcasts a tiny message.  
- When this device hears that message, it **nudges its own clock forward**.  
- This is the key mechanism behind synchronisation:  
  **hearing someone ahead of you nudges you to catch up.**

This mirrors how real fireflies adjust their flashing rhythm when they see others nearby.

---

### Step 3 — My own ticking loop
```text
FOREVER DO
    IF clock >= 8 THEN
        SEND radio number 0
        FLASH SCREEN
        PAUSE 200 ms
        SET clock TO 0
    ELSE
        PAUSE 100 ms
        INCREASE clock BY 1
    END IF
END FOREVER
```

**Explanation:**  
- Each micro:bit counts up slowly (`clock += 1`).  
- When the clock reaches 8:  
  - It **flashes** → a burst of LED light.  
  - It **broadcasts a message** telling neighbours “I flashed”.  
  - It **resets its clock**.  
- Neighbours hearing the message speed up their own clocks.  
- Over time, everyone drifts into the same rhythm — **emergent synchrony**.

This is a powerful demonstration that **global patterns form without a leader**.

---

# Part B — Exploding Duck  
*A radio-based reaction-speed game teaching IDs, timers, and state management.*

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
- Every micro:bit knows **how many people** are in the game and which **ID** it has.  
- Higher transmit power (7) ensures full-range communication for the game.  
- Player 1 starts with the duck and shows it on the screen.  
- All other players begin “empty-handed”.

---

### Step 2 — Receiving the duck
```text
WHEN radio receives number DO
    IF received number = ID THEN
        IF dead = FALSE THEN
            SET hasDuck TO TRUE
            SET timer TO random value 50..150
            SHOW ICON duck
        ELSE
            CALL forward()
        END IF
    END IF
END WHEN
```

**Explanation:**  
- If the incoming message matches **your ID**, you have just received the duck.  
- If you are alive, you start a random countdown (“fuse”).  
- If you are dead, you immediately relay the duck elsewhere.  
- This prevents dead players from blocking the game.

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
- Players can attempt to pass the duck voluntarily *before* the fuse explodes.  
- Only living players holding the duck may pass it.  
- Encourages fast reactions and tactical decisions.

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
- Picks a random player *other than yourself* to receive the duck.  
- Clears your screen and resets your timer.  
- Sends the duck to the chosen target.  
- `PAUSE 10 ms` in the loop ensures fair randomness and avoids infinite loops.

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
- Dead players automatically relay the duck.  
- Keeps the game moving dynamically.  
- Avoids situations where a dead micro:bit “traps” the duck.

---

### Step 6 — Non-blocking countdown
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
- This countdown lets the duck “explode” if held too long.  
- Crucially, the micro:bit does *not freeze* — radio and shake still work.  
- If the fuse expires, the player dies and immediately forwards the duck.  
- The skull shows clearly who has exploded.

---

# Reflection & Wrap-Up

Ask participants:

- “How does synchronisation happen without a leader?”  
- “What is the difference between local and global communication?”  
- “Why is a non-blocking timer important for Exploding Duck?”  
- “Which state variables control the game flow?”  

Both activities reveal that **complex behaviour** can arise from **simple rules**, a core idea across computing, robotics, biology, and physics.

---

{% include back-to-autumn.html %}
