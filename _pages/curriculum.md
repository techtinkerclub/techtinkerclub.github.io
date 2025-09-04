---
layout: splash
title: ""
permalink: /curriculum/
header:
  # title: ""
  # caption: ""  # <- explicitly blank
  show_overlay_excerpt: false
  show_overlay_text: false
# excerpt: ""
---
Welcome to Tech Tinker Club’s curriculum hub. Choose a year/term to explore.

{% comment %}
List year hubs inside the `curriculum` collection (e.g., /_curriculum/2025-26/index.md).
{% endcomment %}

{% assign years = site.curriculum | where_exp: "p", "p.path contains '/2025-26/' and p.path ends_with: 'index.md'" %}
<ul>
  {% for y in years %}
  <li><a href="{{ y.url }}">{{ y.title | default: "Curriculum 2025–26" }}</a></li>
  {% endfor %}
</ul>

{% comment %}
Fallback/manual link (keep this until you add more years):
{% endcomment %}
- [Curriculum 2025–26](/curriculum/2025-26/)
