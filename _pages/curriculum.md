---
layout: single
title: "Curriculum"
permalink: /curriculum/
sidebar:
  nav: "curriculum"   # uses the 'curriculum' list in _data/navigation.yml
---

Welcome to Tech Tinker Club’s curriculum hub. Choose a year/term to explore.

{% comment %}
We list curriculum "year hubs" by filtering the 'curriculum' collection
for items with year: "2025-26" and a role tag of "year-hub".
Add those keys to /_curriculum/2025-26/index.md (see below).
{% endcomment %}

{% assign hubs = site.curriculum | where:"role","year-hub" | sort:"title" %}
<ul>
  {% for y in hubs %}
    <li><a href="{{ y.url }}">{{ y.title }}</a></li>
  {% endfor %}
</ul>

{% comment %}
If nothing shows yet, keep this manual link until the hub exists:
{% endcomment %}
- [Curriculum 2025–26](/curriculum/2025-26/)
