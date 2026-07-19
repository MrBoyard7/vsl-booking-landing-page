/**
 * GDPR-friendly cookie consent.
 *
 * Only two categories exist on this page:
 *   - essential: always on, needed to submit the booking form (no cookie
 *     banner can legally require consent for this)
 *   - booking:   loads the third-party Microsoft Bookings iframe, which sets
 *     its own cookies — this is gated behind explicit consent
 *
 * Consent is stored in localStorage so we don't set any cookie of our own
 * before the visitor has made a choice.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ascent_cookie_consent';

  /** @returns {{ essential: true, booking: boolean, timestamp: string } | null} */
  function getConsent(storage) {
    var raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  /**
   * @param {boolean} bookingAccepted
   */
  function setConsent(storage, bookingAccepted) {
    var value = {
      essential: true,
      booking: !!bookingAccepted,
      timestamp: new Date().toISOString(),
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(value));
    return value;
  }

  var api = { STORAGE_KEY: STORAGE_KEY, getConsent: getConsent, setConsent: setConsent };

  // Export for Jest (Node/CommonJS); no-op in the browser.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  // Browser wiring — skipped entirely in the Jest/Node test environment,
  // where `document` is not defined the same way (jsdom tests import the
  // pure functions above directly instead of relying on DOMContentLoaded).
  if (typeof document === 'undefined') return;

  function init() {
    var banner = document.getElementById('cookie-banner');
    var acceptBtn = document.getElementById('cookie-accept');
    var rejectBtn = document.getElementById('cookie-reject');
    var manageLink = document.getElementById('manage-cookies-link');
    if (!banner || !acceptBtn || !rejectBtn) return;

    function applyConsent(consent) {
      document.dispatchEvent(new CustomEvent('consent:updated', { detail: consent }));
    }

    function showBanner() {
      banner.hidden = false;
    }

    function hideBanner() {
      banner.hidden = true;
    }

    var existing = getConsent(window.localStorage);
    if (existing) {
      applyConsent(existing);
    } else {
      showBanner();
    }

    acceptBtn.addEventListener('click', function () {
      var consent = setConsent(window.localStorage, true);
      applyConsent(consent);
      hideBanner();
    });

    rejectBtn.addEventListener('click', function () {
      var consent = setConsent(window.localStorage, false);
      applyConsent(consent);
      hideBanner();
    });

    if (manageLink) {
      manageLink.addEventListener('click', showBanner);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
