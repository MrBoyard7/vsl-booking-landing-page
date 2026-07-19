/**
 * Page-level wiring that doesn't belong to a single component:
 * injects the Microsoft Bookings iframe only after the visitor has
 * accepted "booking" cookies (see js/cookie-consent.js).
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  function mountCalendar(container) {
    if (container.dataset.mounted === 'true') return;

    var src = container.getAttribute('data-embed-src');
    if (!src || src.indexOf('YOUR-BOOKINGS-PAGE') !== -1) {
      container.innerHTML =
        '<p class="calendar-embed__placeholder">Calendar embed URL not configured yet — see docs/SETUP.md.</p>';
      return;
    }

    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'Book a call';
    iframe.loading = 'lazy';
    container.innerHTML = '';
    container.appendChild(iframe);
    container.dataset.mounted = 'true';
  }

  function unmountCalendar(container) {
    container.dataset.mounted = 'false';
    container.innerHTML =
      '<p class="calendar-embed__placeholder">Accept booking cookies to load the calendar.</p>';
  }

  function init() {
    var container = document.getElementById('calendar-embed');
    if (!container) return;

    document.addEventListener('consent:updated', function (event) {
      if (event.detail && event.detail.booking) {
        mountCalendar(container);
      } else {
        unmountCalendar(container);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
