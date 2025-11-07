---
layout: single
title: ""
permalink: /instructor-notes/2025-26/autumn/week-7-notes/
week: 7
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

# Instructor Notes — Week 7
{% include print-to-pdf.html %}

**Theme:** Functions, Inputs & Game Logic  
**Focus Concept:** Creating and Reusing Functions  
**Mini-Projects:** *Function Challenges* (Part A) → *Mini Space Invaders* (Part B)

---

## Learning Objectives
- Participants understand that a **function** is a small helper program that performs one clear job and can be called when needed.  
- Participants can **create**, **call**, and **reuse** functions to simplify their code.  
- Participants explore **parameters** and **return values** through guided pseudocode.  
- Participants apply **loops**, **conditions**, and **variables** to manage behaviour in a game.  
- Participants connect code structure to **maths** (timing & repetition) and **science** (motion & acceleration).

---

## Recap (≈10 min)
Write on the board:

> A **function** is a named helper that “does one job”.  
> We **call** it whenever we need that job done.

Prompt discussion:  
*When might we reuse a helper?* (e.g. showing a message, flashing an icon, playing a short sound)

---

## Part A — Function Challenges (≈35 min)

### Step 1 — Simple Function (No Inputs)
{% highlight text %}
define function flashHeart
    show icon "heart"
    pause 200 ms
    show icon "small heart"
    pause 200 ms
end function

on start
    flashHeart()
    flashHeart()
{% endhighlight %}

**Instructor tips**
- Emphasise *definition vs call*.  
- Changing the pause changes rhythm → introduce iteration timing (ms).  
- Ask: *Why use a function instead of copying these lines?*

---

### Step 2 — Function with Parameter (Input)
{% highlight text %}
define function flash(times)
    repeat times times
        show icon "heart"
        pause 200 ms
        clear screen
        pause 200 ms
    end repeat
end function

on button A pressed → flash(3)
on button B pressed → flash(1)
{% endhighlight %}

**Discuss**
- The word inside brackets is the **parameter**.  
- Same recipe, but flexible — the parameter changes how many times it runs.  
- Try 0, 3, 5 → predict then test.

---

### Step 3 — Function with Return Value (Computation)
{% highlight text %}
define function addNumbers(a, b)
    return a + b
end function

on start
    set total = addNumbers(3, 2)
    show number total
{% endhighlight %}

**Instructor tips**
- The function *calculates and returns* a value to the main program.  
- Demonstrate that `addNumbers(3, 2)` produces 5.  
- Challenge: `show number addNumbers(2, addNumbers(1, 1))`.

---

### Step 4 — Combining Functions
Encourage chaining simple helpers:  
- `showMessage()` + `playTone()` = an alert system.  
- `flash(times)` inside a “game over” function.

> 💡 Functions are like tools — each one solves a small problem; together they build something complex.

---

### Step 5 — Mini-Challenges (≈5 min)
- Create `showLevel(level)` → display “L” + level and play a tone.  
- Add a sound when a function finishes.  
- Modify `flash(times)` to limit it to a maximum of 5 flashes.  
- Build a combo function that calls two others in sequence.

---

## Part B — Mini Space Invaders (≈45 min)

### Step 1 — Sprites & Setup
{% highlight text %}
create Ship at (2, 4)
create Alien at (0, 0)
make variables: Laser, Bomb
set score = 0
{% endhighlight %}
*Same 5×5 grid — player bottom, threat top.*

---

### Step 2 — Alien Movement (Forever)
{% highlight text %}
forever
    move Alien right 1
    pause 200 ms
    if Alien hits edge → bounce
end
{% endhighlight %}

---

### Step 3 — Ship Control (Tilt)
{% highlight text %}
if accel X > 100 → Ship x = Ship x + 1
if accel X < -100 → Ship x = Ship x - 1
(clamp Ship x between 0 and 4)
{% endhighlight %}
**Science link:** Accelerometer detects gravity/tilt → motion input.

---

### Step 4 — Fire a Laser (Button B)
{% highlight text %}
when button B pressed
    create Laser at (Ship x, Ship y)
    repeat 5 times
        pause 100 ms
        move Laser up 1
        if Laser touching Alien
            delete Alien
            increase score by 1
            create Alien at (random x 0..4, y 0)
        end if
    end repeat
    delete Laser
{% endhighlight %}
*Grid height = 5 rows → five steps to the top.*

---

### Step 5 — Alien Drops a Bomb (Forever)
{% highlight text %}
forever
    if Alien x == Ship x
        create Bomb at (Alien x, 0)
        repeat 5 times
            pause 200 ms
            move Bomb down 1
        end repeat
        if Bomb touching Ship → game over
        delete Bomb
end
{% endhighlight %}
*Symmetry with the Laser but moving downward.*

---

### Step 6 — Extensions (if time)
- Add a `lives` variable (start 3; −1 on hit; Game Over at 0).  
- Add sound effects for **laser** and **hit**.  
- Increase alien speed every 5 points (reduce pause or add levels).  
- Create a function that shows “Level Up!” or “Wave Cleared!” messages.

---

## Vocabulary Focus
| Term | Child-friendly definition |
|------|----------------------------|
| **Function** | A named helper that does one job — call it any time. |
| **Variable** | A box storing a value (e.g., `score`, `speed`, `level`). |
| **Loop (forever / repeat)** | Runs instructions again and again. |
| **Condition** | A yes/no test that decides what happens next. |
| **Collision** | When two sprites touch on the grid. |
| **Respawn** | Create a new object after the old one was deleted. |

---

## Differentiation
- **Beginners:** follow the guided function build and core controls.  
- **Confident:** add parameters, random spawns, and sound effects.  
- **Stretch:** build functions with return values or multiple calls per loop.

---

## Assessment & Reflection
- Can participants explain **what a function is** and **where they used one**?  
- Can they describe how **loops** and **calls** work together?  
- Can they show how **variables** store values between functions?  
- Can they discuss **speed (pause)** and difficulty in the game?  
- Observe teamwork, debugging strategies, and safe device handling.

---

## Common Mistakes
- Calling a function before it’s defined.  
- Forgetting to return a value in math functions.   
- Deleting sprites **before** checking collisions.  
- Using coordinates outside 0–4 → sprites “vanish”.

---

## Materials & Setup
- BBC micro:bits + USB cables (or simulator)  
- Chromebooks/laptops with internet access  
- Optional speakers/headphones for sound effects

---

## Safety & Safeguarding
- Keep cables tidy; drinks away from devices.  
- Sensible volume for sounds.  
- Encourage turn-taking and pair programming.

---

## Cross-Curricular Links
| Subject | Connection |
|----------|-------------|
| **Maths** | Timing (ms), counting loops, incremental change. |
| **Science** | Motion and forces via the accelerometer. |
| **Design & Technology** | Plan → build → test → iterate (game design cycle). |
| **PSHE / Teamwork** | Communication, resilience, peer support. |

---

## KS2 Computing Curriculum Mapping
| Strand | Evidence in Session |
|---------|---------------------|
| **Programming A — Sequence** | Ordered steps for functions and game actions. |
| **Programming B — Repetition** | `forever` and `repeat` loops drive behaviour. |
| **Programming C — Variables** | `score`, `lives`, `speed` manage game state. |
| **Programming D — Selection** | `if` tests and comparisons control outcomes. |
| **Programming E — Creating/Modifying Programs** | Debugging and extending functions and games. |

---

{% include back-to-autumn.html %}


<div class="notice--steam">
  <h2>Connections to STEAM Learning &amp; Real-World Links</h2>
  <ul>
    <li><strong>Computing:</strong> We will create and reuse <strong>functions</strong> with parameters to keep our code tidy and modular.</li>
    <li><strong>Maths:</strong> We will use <strong>coordinates (x, y)</strong> and <strong>increments</strong> for movement and aiming.</li>
    <li><strong>Art &amp; Design:</strong> We will iterate on <strong>iconography</strong> and <strong>effects</strong> to make gameplay clearer.</li>
    <li><strong>Engineering &amp; Technology:</strong> We will follow a mini <strong>design cycle</strong>—build → test → adjust → replay.</li>
    <li><em>Real world:</em> If time allows, we will connect this idea to everyday technology or careers.</li>
  </ul>
</div>


