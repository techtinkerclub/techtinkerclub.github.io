---
layout: splash
title: ""
permalink: /gallery/
classes: wide
gallery:
  share: false
  show_title: false
  lightbox: false  # ✅ turn off built-in lightbox
---

<style>
.gallery {
  column-count: 3;
  column-gap: 1em;
}
.gallery a {
  display: inline-block;
  margin-bottom: 1em;
  width: 100%;
}
.gallery img {
  width: 100%;
  height: auto;
  border-radius: 6px;
  transition: transform 0.2s ease-in-out;
}
.gallery img:hover {
  transform: scale(1.03);
  cursor: pointer;
}
</style>

<div class="gallery">
  {% assign gallery_images = site.static_files | where_exp: "file", "file.path contains '/assets/images/gallery/'" %}
  {% for file in gallery_images %}
    {% assign ext = file.extname | downcase %}
    {% if ext == ".png" or ext == ".jpg" or ext == ".jpeg" or ext == ".webp" %}
      <a href="{{ file.path | relative_url }}">
        <img src="{{ file.path | relative_url }}" alt="Gallery image">
      </a>
    {% endif %}
  {% endfor %}
</div>

<!-- LightGallery core (no thumbnail plugin) -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/lightgallery/2.7.1/css/lightgallery.min.css" rel="stylesheet">

<script src="https://cdnjs.cloudflare.com/ajax/libs/lightgallery/2.7.1/plugins/zoom/lg-zoom.min.js"></script>
<script>
  document.addEventListener("DOMContentLoaded", function() {
    if (window.lightGallery) {
      lightGallery(document.querySelector('.gallery'), {
        plugins: [lgZoom],
        selector: 'a',
        speed: 300
      });
    }
  });
</script>

<p><em>Click an image to view full size. Use arrows or swipe to browse through the gallery.</em></p>
