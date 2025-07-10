---
layout: splash
title: ""
permalink: /
header:
  title: ""
  show_overlay_text: false
  show_overlay_excerpt: false
---

<style>

  .page__content {
    max-width: 100% !important;
    width: 100% !important;
    padding-left: 0;
    padding-right: 0;
  }
  
  .calendar-embed {
    max-width: 100%;
    overflow: hidden;
  }

  .calendar-embed iframe {
    display: block;
    width: 100%;
    max-width: 100%;
    height: 300px;
    border: none;
  }

  @media (min-width: 768px) {
    .layout-container {
      display: grid;
      grid-template-columns: 1.5fr 2fr 1.5fr;
      gap: 2rem;
      padding: 0 0;
    }

    .sidebar-adjust,
    .calendar-adjust {
      width: 100%;
    }

    .main-column {
      text-align: justify;
    }


  }
</style>



<div class="layout-container">

  <!-- LEFT SIDEBAR COLUMN -->
  <div class="sidebar-adjust">
    <img src="/assets/images/logo300px.png" alt="Tech Tinker Club Logo" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;">
    <div style="background: #f4f4f4; padding: 1rem; border-radius: 6px;">
      <h3 style="margin-top: 0;">Quick Info</h3>
      <ul style="margin-left: 1rem;">
        <li>For Years 4–6</li>
        <li>Every Wednesday 6–7:30 PM</li>
        <li>At Radford Semele Primary</li>
        <li>Free & volunteer-led</li>
      </ul>
    </div>
  </div>

  <!-- MIDDLE CONTENT COLUMN -->
  {% capture main_content %}
  Welcome to the **Tech Tinker Club**!

  We’re a volunteer-led after-school STEM club created especially for children in **Years 4 to 6** at **Radford Semele Primary School**.

  Every week, we dive into hands-on projects that bring science, technology, engineering, and maths to life — and sometimes mix them all together in unexpected and exciting ways! One week we might be coding games with Micro:bits, the next we’re building circuits, designing things in 3D, or experimenting with sensors and robotics.

  Our goal is simple: to spark curiosity, build confidence, and help children explore how the things they learn in school connect and work together in the real world. Whether it’s creating, coding, problem-solving or just having a go — it’s all about learning by doing.

  No experience needed. Just bring your ideas, imagination, and a willingness to tinker.

  We can’t wait to see what you’ll invent!
  {% endcapture %}

  <div class="main-column">
    {{ main_content | markdownify }}
  </div>

  <!-- RIGHT COLUMN: Calendar Embed -->
  <div class="calendar-adjust">
    <div style="background: #f4f4f4; padding: 0; border-radius: 6px;">
      <h3 style="margin-top: 0;">Upcoming Sessions</h3>
      <div class="calendar-embed">
        <iframe 
          src="https://calendar.google.com/calendar/embed?src=techtinkerclub%40gmail.com&ctz=Europe%2FLondon&mode=AGENDA&showTitle=0&showPrint=0&showTabs=0&showCalendars=0&showTz=0"
          style="border: none;" 
          width="100%" 
          height="300"
          scrolling="no">
        </iframe>
      </div>
    </div>
  </div>

</div>
