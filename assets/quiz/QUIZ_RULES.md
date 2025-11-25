# Tech Tinker Club — Quiz Authoring Rules  
*(Internal reference for quiz JSON in this folder)*

This document describes how to write new weekly quiz questions for Tech Tinker Club (Weeks 1–14 and future years).

It is designed so the quiz can be used by **any school or club**, not only by participants who followed our exact projects.

> 🚫 **Important extra rule:**  
> No **project‑specific** questions.  
> Do **not** require that learners have built a particular game like Crashy Bird, Exploding Ducks, etc.  
> Questions must be answerable using *general computing concepts* (loops, arrays, radio, sensors, etc.), not knowledge of our custom project scripts.

---

## 1. Allowed Question Types

Each question has a `type`. Only these three are allowed:

1. `multiple-choice`  
   - Standard 1‑correct‑answer MCQ.  
   - Normally 3–4 options.

2. `drag-drop`  
   - Matching **terms → definitions** (or concept → example, role → category, etc.).  
   - Uses `terms`, `definitions`, and `correctMatches`.

3. `missing-line`  
   - TTC pseudocode snippet with exactly one missing line.  
   - Options are possible replacement lines.  
   - ONE correct line.

**Not allowed** (for this quiz engine):

- Parsons problems (reordering code lines)  
- Multi‑select (more than one correct option)  
- Free‑text / open answers  
- True/False *unless* wrapped as a 2‑option MCQ  
- “Select all that apply” style questions  

---

## 2. Required Fields per Question

Every question **must** include:

- `id` — unique, format: `wX-qY` (e.g. `"w11-q3"`).  
- `question` — the main prompt text.  
- `type` — `"multiple-choice"`, `"drag-drop"`, or `"missing-line"`.  
- `hint` — shown before answering, 1–2 short helpful sentences.  
- `explanation` — shown after answering, explaining *why* the correct answer is right.  
- `difficulty` — one of: `"easy"`, `"medium"`, `"medium-hard"`, `"hard"`.

Type‑specific requirements:

### 2.1 Multiple‑choice

```json
{
  "id": "w11-q1",
  "type": "multiple-choice",
  "question": "Which statement best describes mapping in code?",
  "hint": "Think about changing from one range of values to another.",
  "options": [
    "Copying values from one variable to another",
    "Converting a value from one range into a matching value in another range",
    "Picking a random value from a list",
    "Resetting a variable to 0"
  ],
  "correct": 1,
  "explanation": "Mapping takes a value in one range (like 0–100) and finds the matching position in another range (like 0–4).",
  "difficulty": "medium"
}
```

- `options`: array of answer strings.  
- `correct`: **0‑based index** of the right option.  
- `definition` is optional, and when present adds a vocabulary entry, e.g.:

```json
"definition": "ARRAY — one variable that stores many values in order."
```

### 2.2 Drag‑drop (matching)

```json
{
  "id": "w11-q6",
  "type": "drag-drop",
  "question": "Match each term to its definition.",
  "hint": "Think about whether the item senses, shows, or remembers information.",
  "terms": [
    "Input device",
    "Output device",
    "Variable"
  ],
  "definitions": [
    "Stores a value that can change",
    "Senses the world (like light or movement)",
    "Shows information (like LEDs or sound)"
  ],
  "correctMatches": [1, 2, 0],
  "explanation": "Inputs read the world, outputs show something, and variables remember values.",
  "difficulty": "medium"
}
```

- `terms`: items the learner drags.  
- `definitions`: drop targets (same length as `terms`).  
- `correctMatches`: each index points to the correct definition for the term at that position.  
  - In the example:  
    - term 0 → def 1,  
    - term 1 → def 2,  
    - term 2 → def 0.

### 2.3 Missing‑line (select missing pseudocode)

```json
{
  "id": "w11-q8",
  "type": "missing-line",
  "question": "Missing line — choose the line that correctly adds every array value onto total.",
  "codeLabel": "Pseudocode",
  "code": "SET arr TO [2, 4, 6]\nSET total TO 0\nFOR EACH n IN arr DO\n    ____\nEND\nSHOW NUMBER total",
  "hint": "We want total to grow each time using the current array value n.",
  "options": [
    "CHANGE total BY n",
    "SET total TO n",
    "SET n TO total + n",
    "SET total TO 0"
  ],
  "correct": 0,
  "explanation": "The pattern is 'total = total + n', which in blocks is 'change total by n'.",
  "difficulty": "medium-hard"
}
```

- `codeLabel`: usually `"Pseudocode"`.  
- `code`: TTC pseudocode with `\n` for new lines and one `____` placeholder.  
- `options`: candidate lines to replace the blank.  
- `correct`: index of the correct line.

---

## 3. TTC Pseudocode Style (Strict)

All pseudocode in quiz questions must follow the **Tech Tinker Club pseudocode standard**:

### 3.1 Keywords in ALL CAPS

Examples:

```text
WHEN program starts DO
WHEN button A is pressed DO
IF score > 5 THEN
ELSE
END IF
REPEAT 3 TIMES
END REPEAT
FOREVER DO
FUNCTION bump_level()
END FUNCTION
```

Allowed keywords include:  
`WHEN, IF, THEN, ELSE, END IF, REPEAT, END REPEAT, FOREVER, FUNCTION, RETURN, SET, CHANGE, CALL, FOR, END`.

### 3.2 Variables in lowercase_with_underscores

Examples:

```text
score, light_level, gap_row, speed_ms, danger_delay, has_message
```

### 3.3 System / sensor values inside square brackets

These represent live readings or built‑in values:

```text
[light level]
[temperature]
[button A is pressed]
[random number from 1 to 6]
[acceleration (X)]
```

### 3.4 General style

- Use clear, English‑like structures:

  ```text
  WHEN button A is pressed DO
      CHANGE score BY 1
  END WHEN
  ```

- Close all blocks explicitly:  
  `END WHEN`, `END IF`, `END REPEAT`, `END FUNCTION`, `END`.  
- Keep code snippets short (about 4–10 lines) so they fit nicely on screen.  

---

## 4. Content Rules (Concepts & Scope)

### 4.1 Current Week Focus

Each week’s quiz should include several questions about that week’s main ideas. Examples:

- Week 6 → loops, timing maths, coordinates, debugging  
- Week 7 → functions, parameters, accelerometer thresholds  
- Week 8 → waves, radio groups, message logic  
- Week 10 → arrays, indexes, loops over arrays  
- Week 11 → ultrasonic sensors, echolocation, TRIG/ECHO, `map`, `constrain`

### 4.2 Recap of Previous Weeks

Every quiz also revisits earlier ideas:

- Inputs & outputs  
- Events & random  
- Variables & thresholds  
- Conditions (if / else, chained conditions, comparisons)  
- Loops (repeat, for, while, forever)  
- Coordinates (x/y grid)  
- Arrays (when introduced)  
- Radio basics (groups, IDs, messages)  
- Timing and simple maths

**Important:**  
- Recap questions **must be new**.  
- Do **not** copy or lightly rephrase existing questions from previous weeks.  
- You may reuse *concepts*, but change the scenario, numbers, and code.

### 4.3 No Project‑Specific Questions (New Rule)

The quiz is meant to be usable by **any teacher/club**, even if they did **different** projects.

Therefore:

- ❌ No questions that require having built a particular game (e.g. “In Crashy Bird, what does this sprite do?”).  
- ❌ No questions about exact project names, in‑club anecdotes, or particular MakeCode project IDs.  
- ✅ You **may** use similar logic in **generic** examples:  
  - e.g. “a scrolling obstacle game” rather than “Crashy Bird”,  
  - or “a radio passing game” rather than “Exploding Ducks”.

Focus on **general computing concepts**, not the branding or specific scripts used in Tech Tinker Club.

---

## 5. Difficulty & Age Suitability

Target: **medium** to **medium‑hard**, but still suitable for **KS2 (Years 4–6)**.

Guidelines:

- Use small whole numbers and simple arithmetic.  
- Encourage **reasoning** (tracing code, understanding conditions), not memorisation.  
- Avoid advanced maths, heavy algebra, or very large numbers.  
- Avoid deeply nested logic (no triple‑nested IFs/loops).  
- Keep questions short and clear; avoid long paragraphs of text.

You can include a few easier warm‑up questions (`difficulty: "easy"`) if helpful.

---

## 6. Bias & Fairness Rules (Answer Distribution)

To avoid answer‑pattern guessing:

1. **Spread correct answers across positions**  
   - For a 12‑question quiz, aim for a mix of `correct: 0`, `1`, `2`, `3`.  
   - Avoid patterns like all correct answers at index 0, or an obvious repeating pattern.

2. **Make distractors plausible**  
   - Wrong answers should look like typical misunderstandings, not silly or obviously wrong.  
   - The correct answer should **not** always be the longest or most formal‑sounding.

3. **Consistent tone**  
   - All options should have similar tone and style.  
   - Avoid making the correct answer “teacher voice” and the others childish or jokey.

---

## 7. Hints, Explanations & Definitions

### 7.1 Hints (mandatory)

Field: `hint`

- Shown **before** answering.  
- Short (1–2 sentences).  
- Should gently direct attention to the key idea:
  - “Think about how many times the loop runs.”
  - “Remember that arrays start at index 0.”
  - “Look at when the condition becomes true.”

Hints must **not**:

- Contain the full correct answer text verbatim.  
- Give away the numerical result directly.

### 7.2 Explanations (mandatory)

Field: `explanation`

- Shown **after** answering.  
- Must clearly explain why the correct answer is right.  
- For code logic questions, walk step‑by‑step through the values.  
- Use this to reinforce the concept (arrays, conditions, mapping, etc.).

### 7.3 Definitions (optional)

Field: `definition`

- Optional extra field for key terms in some questions.  
- Format: `"TERM — short, child-friendly definition."`  
- These can feed into a vocabulary box in the UI.

---

## 8. JSON Structure Rules (Per Week)

Each week in the main `quiz.json` has the shape:

```json
"11": {
  "title": "Week 11: Ultrasonic Sensors & Echolocation",
  "description": "Ultrasonic input, mapping, constrain, and distance-based behaviour.",
  "locked": false,
  "questions": [
    { /* question 1 */ },
    { /* question 2 */ }
    // ...
  ]
}
```

Each question object must include:

- `id`
- `question`
- `type`
- `hint`
- `explanation`
- `difficulty`

Plus:

- `options` and `correct` for `multiple-choice` and `missing-line`.  
- `terms`, `definitions`, `correctMatches` for `drag-drop`.  
- Optional `codeLabel`, `code`, `definition`.

Do **not** introduce new fields unless the quiz engine is updated accordingly.

---

## 9. Recommended Question Mix (Per Week)

For a 12‑question quiz, a balanced mix is:

- **6–8 multiple‑choice**  
- **2 drag‑drop**  
- **2 missing‑line**

This keeps variety without overwhelming learners.

Where possible:

- Ensure at least 3–4 questions focus on the **current week** concepts.  
- Ensure 3–5 questions provide **revision** from earlier weeks.

---

## 10. Quality Checklist Before Committing

Before committing a new week’s quiz, go through this checklist:

### 10.1 Content

- [ ] Uses only allowed types: multiple‑choice, drag‑drop, missing‑line.  
- [ ] Includes several questions on this week’s main concepts.  
- [ ] Includes genuine revision questions from earlier weeks.  
- [ ] No **project‑specific** questions (no requirement to know our named games).  
- [ ] No questions copied from previous weeks.

### 10.2 Structure & Style

- [ ] Every question has a `hint`.  
- [ ] Every question has an `explanation`.  
- [ ] Pseudocode follows TTC style (ALL CAPS keywords, `[sensor]` notation, etc.).  
- [ ] Difficulty is roughly medium to medium‑hard; suitable for Year 4–6.  
- [ ] Question wording is short and clear.

### 10.3 Answer & Logic

- [ ] Correct answers are well distributed across indices (0–3).  
- [ ] Distractors are plausible, not silly.  
- [ ] All loops, conditions, and mappings have been traced manually to confirm the right answer.  
- [ ] Arrays use 0‑based indexing consistently.  
- [ ] No unreachable branches or logic that is too confusing for KS2.

If all boxes are ticked, the quiz for that week is ready to use.

---

*(Internal note: this file is for authors only. It is not meant to be exposed as a public page on the main website. Keep it in the quiz folder as a reference.)*
