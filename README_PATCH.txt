99 Club Studio v1.19.3 — Real Contact Form + Ko-fi Button Refresh

Apply these files over the existing v1.19.2 site/repository:
  _pages/99-club.md
  assets/99club/99club.css
  assets/99club/app.js
  assets/99club/images/kofi-cup.png

Changes:
- Contact form now submits from the website using FormSubmit's AJAX endpoint.
- No email client opens on a normal successful submission.
- Contact email is required so replies can go back to the sender.
- Added send-in-progress, success and error states.
- Added a hidden honeypot field for basic bot filtering.
- Contact modal clearly states that contact-form data is sent through FormSubmit and that
  worksheet/school/logo data remains local.
- Error state offers techtinkerclub@gmail.com only as a fallback.
- Buy me a coffee header button now uses the supplied Ko-fi cup/heart artwork.
- Support button text/border styling changed from brown/gold to Ko-fi-style orange/red.
- Existing floating Ko-fi widget remains unchanged.
- Public asset cache-busting updated to v=19.3.
- App metadata version updated to 1.19.3.
- No generator, PDF, preset, question or maths logic changed.

IMPORTANT — one-time FormSubmit activation:
After deploying, submit one test message from the live 99 Club page.
FormSubmit will send an activation email to techtinkerclub@gmail.com.
Click the activation link once. FormSubmit states that submissions received before activation
are retained and forwarded after activation.

Privacy note:
FormSubmit is a third-party contact-form service. Their documentation says submissions are
retained for 30 days. The form UI therefore warns users not to include pupil personal information.

QA:
- app.js syntax check
- local browser UI smoke test with fetch stubbed (no external email was sent during QA)
- Contact modal open/close
- Required email/message validation
- Send button loading/success state
- Header alignment and Ko-fi icon rendering
- No changes to generator/PDF maths files
