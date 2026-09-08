---
layout: splash
title: "99 Club Generator Help"
permalink: /tools/99-club/help/
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

<link rel="stylesheet" href="/assets/99club/99club.css?v=5">

<div class="tt99-guide">
  <div class="tt99-guide-hero">
    <div>
      <span class="tt99-eyebrow">Tech Tinker Club · 99 Club Generator</span>
      <h1>Help & guide</h1>
      <p>A practical guide to the worksheet generator, its rules, and the advanced options. You do not need to understand every setting to use the tool.</p>
    </div>
    <a class="tt99-guide-back" href="/tools/99-club/">← Back to the generator</a>
  </div>

  <div class="tt99-guide-note">
    <strong>Quick start:</strong> leave <b>Classic 99 Club</b> selected, choose the child's challenge level, check the rule summary, then generate the PDF. The advanced editor is optional.
  </div>

  <nav class="tt99-guide-nav" aria-label="Help topics">
    <a href="#workflow">How to use it</a>
    <a href="#schemes">Schemes & challenges</a>
    <a href="#rules">Rules</a>
    <a href="#families">Question families</a>
    <a href="#weights">Weights</a>
    <a href="#fractions">Fractions</a>
    <a href="#percentages">Percentages</a>
    <a href="#reproducibility">Sheet codes & settings</a>
  </nav>

  <section id="workflow" class="tt99-guide-section">
    <h2>How to use the generator</h2>
    <div class="tt99-guide-steps">
      <article><b>1</b><h3>Personalise the sheet</h3><p>Add the school name, year, class, teacher, date and an optional school logo. These details stay in the browser and are not uploaded to Tech Tinker Club.</p></article>
      <article><b>2</b><h3>Choose the challenge</h3><p>Choose a ruleset scheme, then select 11–99 Club or one of the post-99 challenges. Classic 99 Club is the standard starting point.</p></article>
      <article><b>3</b><h3>Check / edit rules</h3><p>The summary tells you what the selected challenge will generate. Open the rule editor only when you want to customise it.</p></article>
      <article><b>4</b><h3>Generate and download</h3><p>Choose portrait or landscape, create up to four equivalent versions, preview the pupil or answer sheet, and download the required PDF.</p></article>
    </div>
  </section>

  <section id="schemes" class="tt99-guide-section">
    <h2>Schemes and challenge levels</h2>
    <p>There is no single national or official 99 Club specification. The generator therefore starts with a stable <strong>Classic 99 Club</strong> scheme and offers alternative preset progressions for schools that use different conventions.</p>

    <h3>Classic 99 Club</h3>
    <div class="tt99-guide-table-wrap"><table class="tt99-guide-table">
      <thead><tr><th>Challenge</th><th>Default content</th></tr></thead>
      <tbody>
        <tr><td>11 Club</td><td>Doubling 1–10</td></tr>
        <tr><td>22 Club</td><td>Repeated addition</td></tr>
        <tr><td>33 Club</td><td>2×, 3×, 5× and 10×</td></tr>
        <tr><td>44 Club</td><td>Adds 1×, 4× and 6×</td></tr>
        <tr><td>55 Club</td><td>Adds 7× and 8×</td></tr>
        <tr><td>66 Club</td><td>All tables to 12×</td></tr>
        <tr><td>77 Club</td><td>Inverse division facts</td></tr>
        <tr><td>88 Club</td><td>Mixed multiplication and division</td></tr>
        <tr><td>99 Club</td><td>Full mixed multiplication/division challenge</td></tr>
      </tbody>
    </table></div>

    <h3>Optional 11–99 schemes</h3>
    <p><strong>Addition-first</strong>, <strong>Arithmetic-first</strong>, <strong>Missing-number progression</strong> and <strong>Tables-first</strong> provide alternative starting presets. Switching scheme does not alter your other scheme's saved edits.</p>

    <h3>Post-99 challenges</h3>
    <div class="tt99-guide-table-wrap"><table class="tt99-guide-table">
      <thead><tr><th>Challenge</th><th>Default content</th></tr></thead>
      <tbody>
        <tr><td>Bronze</td><td>Multiplication and related exact division facts</td></tr>
        <tr><td>Silver</td><td>All four operations</td></tr>
        <tr><td>Gold</td><td>Four operations, squares and exact square roots</td></tr>
        <tr><td>Platinum</td><td>Gold content plus order of operations</td></tr>
        <tr><td>Diamond</td><td>Broad mixed mental maths including scaled facts, fractions of quantities and percentages</td></tr>
      </tbody>
    </table></div>
    <p class="tt99-guide-small">These are generator presets, not claims of one universal school standard. Every challenge can be customised.</p>
  </section>

  <section id="rules" class="tt99-guide-section">
    <h2>Challenge rules</h2>
    <div class="tt99-guide-defs">
      <article><h3>Number of questions</h3><p>The number of questions placed on the sheet. The page layout automatically adapts its columns and spacing.</p></article>
      <article><h3>Time limit</h3><p>The target completion time printed in the worksheet instructions. The TTC default is five minutes.</p></article>
      <article><h3>Perfect attempts to advance</h3><p>How many perfect scores should be achieved before moving to the next level. The TTC default is two.</p></article>
      <article><h3>Question type</h3><p>Chooses the broad generator mode. <b>Mixed mental arithmetic</b> unlocks the family selector and lets different kinds of question appear on one sheet.</p></article>
      <article><h3>Independent / unaided</h3><p>Adds wording to the printed instructions telling pupils to work independently and without help.</p></article>
      <article><h3>Duplicate handling</h3><p>Exact duplicate prevention avoids identical questions where possible. Reversed duplicate prevention can also treat 3 × 7 and 7 × 3 as the same multiplication fact.</p></article>
    </div>
    <p>Edits are stored separately for the selected <strong>scheme + challenge</strong>. <b>Reset this challenge</b> restores only the current combination; <b>Reset scheme</b> clears all edited challenges in that scheme.</p>
  </section>

  <section id="families" class="tt99-guide-section">
    <h2>Question families</h2>
    <p>Mixed mental-arithmetic sheets can combine the following families. Only enabled families are generated.</p>
    <div class="tt99-guide-family-grid">
      <article><h3>Addition / subtraction</h3><p>Whole-number arithmetic controlled by operand and answer limits. Negative subtraction answers can be enabled separately.</p></article>
      <article><h3>Multiplication / division</h3><p>Uses selected times-table families and the factor/quotient range. Division facts are exact in these table-based families.</p></article>
      <article><h3>Missing numbers</h3><p>Facts such as <code>7 × ___ = 42</code> or <code>42 ÷ ___ = 7</code>. You can choose the operations and the allowed blank positions.</p></article>
      <article><h3>Squares / square roots / cubes</h3><p>Uses configurable base ranges. Square-root questions are constructed to have exact whole-number roots.</p></article>
      <article><h3>Order of operations</h3><p>Expressions combining selected operations, with optional brackets. The largest base number controls the basic size of the operands.</p></article>
      <article><h3>Scaled multiplication / division</h3><p>Extends known facts by ×10, ×100 or ×1000, for example <code>6 × 70</code> or <code>4200 ÷ 60</code>.</p></article>
      <article><h3>Fractions / percentages of quantities</h3><p>Uses selected fractions or percentages and suitable whole quantities so the generated answer is a whole number.</p></article>
      <article><h3>Additional advanced families</h3><p>Negative numbers, Roman numerals, angle facts and simple algebra can be enabled for schools that want a broader advanced challenge.</p></article>
    </div>
  </section>

  <section id="weights" class="tt99-guide-section tt99-guide-highlight">
    <h2>What does “weight” mean?</h2>
    <p><strong>Weight controls frequency, not difficulty.</strong> The weights are relative to each other and do not need to add to 100.</p>
    <div class="tt99-weight-example">
      <div><span>Addition</span><b>2</b></div>
      <div><span>Multiplication</span><b>4</b></div>
      <div><span>Square roots</span><b>1</b></div>
    </div>
    <p>In this example multiplication is expected to appear about twice as often as addition and about four times as often as square roots. The editor shows an approximate percentage and question count beside each family.</p>
    <p class="tt99-guide-small">Because the generator also balances valid question pools and must end on an exact total number of questions, the displayed counts are estimates rather than a promise that every sheet will divide perfectly by the weights.</p>
  </section>

  <section id="fractions" class="tt99-guide-section">
    <h2>Fractions of quantities</h2>
    <p>The denominator selector controls which denominator families may be used. A button labelled <b>1/5</b> means “allow denominator 5”; it does <strong>not</strong> mean that every generated fraction is 1/5.</p>
    <div class="tt99-guide-example"><span>If denominator 5 is selected, the pool can include:</span><code>1/5 of 60</code><code>2/5 of 45</code><code>3/5 of 80</code><code>4/5 of 35</code></div>
    <p>The current fraction-of-quantity generator uses <strong>proper fractions</strong>: the numerator is smaller than the denominator. It varies numerators, denominators and quantities so a sheet is not filled with one fraction type.</p>
    <p><strong>Custom denominators</strong> accept comma-separated whole numbers from 2 to 100, for example <code>13, 15, 20</code>. The quantity range controls the whole quantities available. Only combinations that produce whole-number answers are kept.</p>
  </section>

  <section id="percentages" class="tt99-guide-section">
    <h2>Percentages of quantities</h2>
    <p>The standard selector offers every 5% step from 5% to 100%. You can also enter other whole-number percentages such as <code>37%, 42%, 67%</code> in the custom box.</p>
    <p>The <b>%</b> sign is optional in the custom box. Values must currently be whole-number percentages from 1% to 100%.</p>
    <div class="tt99-guide-example"><span>The generator pairs custom percentages with suitable quantities:</span><code>37% of 200 = 74</code><code>42% of 50 = 21</code></div>
    <p>The quantity range limits the values from which those suitable questions are chosen. Combinations that would give non-whole answers are skipped.</p>
  </section>

  <section id="reproducibility" class="tt99-guide-section">
    <h2>Equivalent versions, sheet codes and settings</h2>
    <div class="tt99-guide-defs">
      <article><h3>Equivalent versions</h3><p>Create up to four sheets using the same rules but different generated questions. Matching answer keys use the same version code.</p></article>
      <article><h3>Sheet code</h3><p>Every generated sheet has a reproducible code. Enter the printed code while the same rules are selected to recreate that generated version.</p></article>
      <article><h3>Export settings</h3><p>Downloads a JSON settings file containing the current configuration, scheme/challenge edits and exact current worksheet versions.</p></article>
      <article><h3>Import settings</h3><p>Loads a settings JSON produced by the generator. This is useful for moving a setup between browsers without creating an account.</p></article>
    </div>
  </section>

  <section class="tt99-guide-section">
    <h2>Privacy and storage</h2>
    <p>The generator runs client-side in the browser. School details and uploaded logos are processed locally for the worksheet and PDF. Browser storage is used to remember settings on that device.</p>
    <p><a class="tt99-guide-back" href="/tools/99-club/">Back to the 99 Club Sheet Generator →</a></p>
  </section>
</div>
