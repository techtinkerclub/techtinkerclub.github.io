---
layout: home-no-posts
title: ""
permalink: /curriculum/
sidebar:
  nav: "curriculum"
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

Welcome to Tech Tinker Club’s curriculum hub. Choose a year/term to explore.

{% if site.curriculum %}
  {% assign hubs = site.curriculum | where:"role","year-hub" | sort:"title" %}
  {% if hubs.size > 0 %}
  <ul>
    {% for y in hubs %}
      <li><a href="{{ y.url }}">{{ y.title }}</a></li>
    {% endfor %}
  </ul>
  {% else %}
  <p><em>No curriculum hubs found yet.</em></p>
  {% endif %}
{% else %}
<p><em>Curriculum collection not found. Try the current year:</em>
  <a href="/curriculum/2025-26/">Curriculum 2025–26</a></p>
{% endif %}

