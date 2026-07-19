/**
 * @jest-environment jsdom
 */

describe('calendar embed gating (main.js)', () => {
  function renderCalendar(embedSrc) {
    document.body.innerHTML = `
      <div class="calendar-embed" id="calendar-embed" data-embed-src="${embedSrc}">
        <p class="calendar-embed__placeholder">Calendar will appear here once cookies are accepted.</p>
      </div>
    `;
  }

  function load() {
    jest.resetModules();
    require('../src/js/main.js');
  }

  it('does nothing and does not throw if the calendar container is missing', () => {
    document.body.innerHTML = '';
    expect(() => load()).not.toThrow();
  });

  it('mounts an iframe once booking consent is granted with a real URL configured', () => {
    renderCalendar('https://outlook.office.com/bookwithme/real-page');
    load();

    document.dispatchEvent(new CustomEvent('consent:updated', { detail: { booking: true } }));

    const container = document.getElementById('calendar-embed');
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe.src).toBe('https://outlook.office.com/bookwithme/real-page');
    expect(container.dataset.mounted).toBe('true');
  });

  it('does not remount the iframe on a second consent:updated event', () => {
    renderCalendar('https://outlook.office.com/bookwithme/real-page');
    load();

    document.dispatchEvent(new CustomEvent('consent:updated', { detail: { booking: true } }));
    const firstIframe = document.querySelector('#calendar-embed iframe');

    document.dispatchEvent(new CustomEvent('consent:updated', { detail: { booking: true } }));
    const secondIframe = document.querySelector('#calendar-embed iframe');

    expect(secondIframe).toBe(firstIframe);
  });

  it('shows a "not configured" message when the embed URL is still the placeholder', () => {
    renderCalendar('https://outlook.office.com/bookwithme/YOUR-BOOKINGS-PAGE');
    load();

    document.dispatchEvent(new CustomEvent('consent:updated', { detail: { booking: true } }));

    const container = document.getElementById('calendar-embed');
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.textContent).toMatch(/not configured yet/i);
  });

  it('unmounts and shows a prompt when booking consent is not granted', () => {
    renderCalendar('https://outlook.office.com/bookwithme/real-page');
    load();

    document.dispatchEvent(new CustomEvent('consent:updated', { detail: { booking: true } }));
    document.dispatchEvent(new CustomEvent('consent:updated', { detail: { booking: false } }));

    const container = document.getElementById('calendar-embed');
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.dataset.mounted).toBe('false');
    expect(container.textContent).toMatch(/accept booking cookies/i);
  });
});
