/* Tech Tinker: System Rescue — PWA registration, install and update UX */
(() => {
  'use strict';

  const installRow = document.getElementById('install-row');
  const installButton = document.getElementById('install-app');
  const installNote = document.getElementById('install-note');
  let deferredPrompt = null;
  let waitingWorker = null;
  let refreshing = false;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isIOS = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function showInstalledState() {
    if (!installRow || !installButton || !installNote) return;
    installRow.classList.add('is-installed');
    installButton.textContent = 'Installed';
    installButton.disabled = true;
    installNote.textContent = 'System Rescue is installed and available from your home screen.';
  }

  function showIOSState() {
    if (!installRow || !installButton || !installNote) return;
    installButton.hidden = false;
    installButton.disabled = false;
    installButton.textContent = 'How to install';
    installNote.textContent = 'On iPhone or iPad, install from Safari using Share → Add to Home Screen.';
  }

  function showGenericState() {
    if (!installRow || !installButton || !installNote) return;
    installButton.hidden = false;
    installButton.disabled = false;
    installButton.textContent = 'Install app';
    installNote.textContent = 'Add System Rescue to this device for an app-like, offline-ready experience.';
  }

  function ensureUpdateBanner() {
    let bar = document.getElementById('pwa-update-banner');
    if (bar) return bar;

    bar = document.createElement('div');
    bar.id = 'pwa-update-banner';
    bar.className = 'pwa-update-banner';
    bar.hidden = true;
    bar.innerHTML = `
      <div class="pwa-update-copy">
        <strong>New System Rescue version available</strong>
        <span>Update now to load the latest game rooms and fixes.</span>
      </div>
      <div class="pwa-update-actions">
        <button type="button" class="secondary" data-update-later>Later</button>
        <button type="button" data-update-now>Update now</button>
      </div>`;
    document.body.appendChild(bar);

    bar.querySelector('[data-update-now]')?.addEventListener('click', () => {
      if (!waitingWorker) return;
      bar.querySelector('[data-update-now]').disabled = true;
      bar.querySelector('[data-update-now]').textContent = 'Updating…';
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    });

    bar.querySelector('[data-update-later]')?.addEventListener('click', () => {
      bar.hidden = true;
    });

    return bar;
  }

  function showUpdate(worker) {
    if (!worker) return;
    waitingWorker = worker;
    const bar = ensureUpdateBanner();
    bar.hidden = false;
  }

  if (isStandalone()) showInstalledState();
  else if (isIOS()) showIOSState();
  else showGenericState();

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    showGenericState();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    showInstalledState();
  });

  installButton?.addEventListener('click', async () => {
    if (isStandalone()) {
      showInstalledState();
      return;
    }

    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice?.outcome === 'accepted') showInstalledState();
        else showGenericState();
      } catch (_) {
        showGenericState();
      }
      return;
    }

    if (isIOS()) {
      installNote.textContent = 'In Safari: tap Share, choose “Add to Home Screen”, then tap Add.';
      return;
    }

    installNote.textContent = 'Use your browser menu and choose “Install app” or “Add to Home screen”.';
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });

        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdate(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdate(worker);
            }
          });
        });

        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) registration.update().catch(() => {});
        });

        setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
      } catch (_) {
        if (installNote && !isStandalone()) {
          installNote.textContent = 'The game works normally, but offline installation is not available in this browser.';
        }
      }
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  }
})();
