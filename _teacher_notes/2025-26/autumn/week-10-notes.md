---
layout: single
title: ""
permalink: /teacher_notes/2025-26/autumn/week-10-notes/
week: 10
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

# Instructor Notes — Week 10

**Theme:** Arrays  
**Focus Concept:** Lists, indexing and multi‑object updates  
**Mini‑Project:** *Crashy Bird*

---

## Learning Objectives

- Explain that an **array/list** stores many values in order  
- Use **index positions** to pick a value  
- Understand multi‑object updates using loops  
- Build a full scrolling game using arrays

---

## Session Flow (≈ 80 min)

1. Starter & recap  
2. Part A – Arrays with Words  
3. Part B – Rock–Paper–Scissors with Arrays  
4. Part C – Crashy Bird (main build)  
5. Reflection  

---

# Part A – Arrays with Words

### Pseudocode
```text
on start:
    make a list of activities:
        "PE with Joe"
        "watch a movie"
        "play a board game"
        "tidy our rooms"
        "learn a song"
        "bake a cake"

on button A pressed:
    pick random index 0 → last
    read activity at that index
    show activity
```

### Blocks Version
<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S57666-26417-59731-40588" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe>
  </div>
</div>

---

# Part B – Rock–Paper–Scissors with Arrays

### Pseudocode
```text
on start:
    make a list of images:
        rock
        paper
        scissors

on shake:
    pick random index 0→2
    read image at that index
    show image
```

### Blocks Version
<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S61168-68102-35768-98938" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe>
  </div>
</div>

---

# Part C – Crashy Bird Build

## Pseudocode Overview
```text
on start:
    set index to 0
    create bird at x=0 y=2
    set bird blink
    set obstacles to empty array
    set ticks to 0

on button A pressed: change bird y by -1
on button B pressed: change bird y by +1

forever:
    # 1 remove off‑screen
    while length of obstacles > 0
          and (x of obstacle at 0 = 0):
        delete obstacle at 0
        remove from obstacles

    # 2 move obstacles
    for each obstacle in obstacles:
        change obstacle x by -1

    # 3 spawn
    if remainder of ticks ÷ 3 = 0:
        set gap to pick random 0→4
        for row from 0 to 4:
            if row ≠ gap:
                create obstacle at (4,row)
                add to obstacles

    # 4 collision
    for each obstacle in obstacles:
        if same x AND same y as bird:
            game over

    # 5 timing
    change ticks by 1
    pause 1000 ms
```

### Blocks Version
<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S42595-41266-97255-32528" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe>
  </div>
</div>

---

# Step‑by‑Step Build Notes

### Step 1 – Initialise
```text
set index to 0
create bird at (0,2)
set blink
set obstacles to empty array
set ticks to 0
```

### Step 2 – Controls
```text
on A: change bird y by −1
on B: change bird y by +1
```

### Step 3a – Remove Off‑Screen Obstacles
```text
while obstacles not empty AND x of first obstacle = 0:
    delete obstacle at 0
    remove from array
```

### Step 3b – Move All Obstacles
```text
for each obstacle in obstacles:
    change x by −1
```

### Step 3c – Spawn New Obstacles
```text
if remainder of ticks ÷ 3 = 0:
    gap = pick random 0→4
    for row 0→4:
        if row ≠ gap:
            create obstacle at (4,row)
            add to array
```

### Step 3d – Collision
```text
for each obstacle in obstacles:
    if same position as bird:
        game over
```

### Step 3e – Timing
```text
change ticks by 1
pause 1000 ms
```

---

# Instructor Tips
- One **array** holds many obstacles  
- Loops update every item  
- Predict before running  
- Debug one stage at a time  

---

# Reflection
- What does the array store?  
- Why must we delete old obstacles?  
- How does the forever loop act as a “game engine”?  

---

{% include back-to-autumn.html %}
