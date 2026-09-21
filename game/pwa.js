/* Tech Tinker: System Rescue — PWA registration and install UX */
(() => {
  'use strict';

  const installRow = document.getElementById('install-row');
  const installButton = document.getElementById('install-app');
  const installNote = document.getElementById('install-note');
  let deferredPrompt = null;

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

  if (isStandalone()) {
    showInstalledState();
  } else if (isIOS()) {
    showIOSState();
  } else {
    showGenericState();
  }

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
        if (choice?.outcome === 'accepted') {
          showInstalledState();
        } else {
          showGenericState();
        }
      } catch (_) {
        showGenericState();
      }
      return;
    }

    if (isIOS()) {
      installNote.textContent = 'In Safari: tap the Share button, choose “Add to Home Screen”, then tap Add.';
      return;
    }

    installNote.textContent = 'Use your browser menu and choose “Install app” or “Add to Home screen”.';
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
        if (installNote && !isStandalone()) {
          installNote.textContent = 'The game works normally, but offline installation is not available in this browser.';
        }
      });
    });
  }
})();
