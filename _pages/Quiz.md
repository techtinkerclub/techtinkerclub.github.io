---
layout: splash
title: ""
permalink: /quiz/
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

<div id="ttc-quiz-root"></div>

<!-- Load CSS -->
<link rel="stylesheet" href="{{ '/assets/quiz/quiz.css' | relative_url }}">

<!-- Load JS and point it to the questions.json (resolves baseurl correctly) -->
<script src="{{ '/assets/quiz/quiz.js' | relative_url }}" data-questions="{{ '/assets/quiz/questions.json' | relative_url }}"></script>

<p style="margin-top:1rem"><em>Tip:</em> You can link directly to a week, e.g. <code>/quiz/?week=3</code>.</p>
