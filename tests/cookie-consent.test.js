/**
 * @jest-environment jsdom
 */

const { getConsent, setConsent, STORAGE_KEY } = require('../src/js/cookie-consent');

/** Minimal in-memory stand-in for the Web Storage API, used for the pure-function tests. */
function createFakeStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  };
}

describe('cookie consent storage (pure functions)', () => {
  it('returns null when no consent has been recorded yet', () => {
    const storage = createFakeStorage();
    expect(getConsent(storage)).toBeNull();
  });

  it('persists an "accept all" choice', () => {
    const storage = createFakeStorage();
    const consent = setConsent(storage, true);

    expect(consent.essential).toBe(true);
    expect(consent.booking).toBe(true);
    expect(typeof consent.timestamp).toBe('string');
    expect(getConsent(storage)).toEqual(consent);
  });

  it('persists a "reject non-essential" choice', () => {
    const storage = createFakeStorage();
    setConsent(storage, false);

    expect(getConsent(storage).booking).toBe(false);
  });

  it('does not throw on corrupted storage content', () => {
    const storage = createFakeStorage();
    storage.setItem(STORAGE_KEY, '{not valid json');

    expect(getConsent(storage)).toBeNull();
  });
});

describe('cookie consent banner (DOM wiring)', () => {
  function renderBanner() {
    document.body.innerHTML = `
      <div class="cookie-banner" id="cookie-banner" hidden>
        <button id="cookie-accept">Accept all</button>
        <button id="cookie-reject">Reject non-essential</button>
      </div>
      <button id="manage-cookies-link">Manage cookies</button>
    `;
  }

  beforeEach(() => {
    window.localStorage.clear();
    renderBanner();
    jest.resetModules();
    require('../src/js/cookie-consent');
  });

  it('shows the banner when no consent has been recorded', () => {
    expect(document.getElementById('cookie-banner').hidden).toBe(false);
  });

  it('hides the banner immediately when consent already exists', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ essential: true, booking: true, timestamp: 'x' })
    );
    jest.resetModules();
    renderBanner();
    require('../src/js/cookie-consent');

    expect(document.getElementById('cookie-banner').hidden).toBe(true);
  });

  it('dispatches consent:updated with booking:true and hides the banner on "accept all"', () => {
    const listener = jest.fn();
    document.addEventListener('consent:updated', listener);

    document.getElementById('cookie-accept').click();

    expect(document.getElementById('cookie-banner').hidden).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail.booking).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).booking).toBe(true);
  });

  it('dispatches consent:updated with booking:false and hides the banner on "reject"', () => {
    const listener = jest.fn();
    document.addEventListener('consent:updated', listener);

    document.getElementById('cookie-reject').click();

    expect(document.getElementById('cookie-banner').hidden).toBe(true);
    expect(listener.mock.calls[0][0].detail.booking).toBe(false);
  });

  it('re-opens the banner when "manage cookies" is clicked', () => {
    document.getElementById('cookie-accept').click();
    expect(document.getElementById('cookie-banner').hidden).toBe(true);

    document.getElementById('manage-cookies-link').click();

    expect(document.getElementById('cookie-banner').hidden).toBe(false);
  });

  it('does nothing and does not throw if the banner markup is missing', () => {
    document.body.innerHTML = '';
    expect(() => {
      jest.resetModules();
      require('../src/js/cookie-consent');
    }).not.toThrow();
  });
});
