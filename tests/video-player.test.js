/**
 * @jest-environment jsdom
 */

describe('video player (DOM wiring)', () => {
  function renderPlayer() {
    document.body.innerHTML = `
      <div class="video-player" id="vsl-player">
        <video id="vsl-video"></video>
        <button id="vsl-big-play" type="button"></button>
        <div id="vsl-controls" hidden>
          <button id="vsl-toggle-play" type="button"></button>
          <div id="vsl-progress-track"></div>
          <div id="vsl-progress-fill"></div>
          <button id="vsl-toggle-mute" type="button"></button>
        </div>
        <p id="vsl-fallback" hidden></p>
      </div>
    `;
  }

  /**
   * Loads the module with `video.play` stubbed to a controllable
   * implementation, since jsdom does not implement real media playback
   * (a real HTMLMediaElement.play() call there just no-ops).
   */
  function loadWithPlayImpl(playImpl) {
    renderPlayer();
    const video = document.getElementById('vsl-video');
    video.play = jest.fn(playImpl);
    video.pause = jest.fn();

    jest.resetModules();
    require('../src/js/video-player.js');

    return { video };
  }

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('does nothing and does not throw if the player markup is missing', () => {
    document.body.innerHTML = '';
    expect(() => {
      jest.resetModules();
      require('../src/js/video-player.js');
    }).not.toThrow();
  });

  it('reveals the controls once autoplay succeeds', async () => {
    loadWithPlayImpl(() => Promise.resolve());
    await flush();

    expect(document.getElementById('vsl-controls').hidden).toBe(false);
    expect(document.getElementById('vsl-big-play').hidden).toBe(true);
  });

  it('shows the big play button when autoplay is blocked', async () => {
    loadWithPlayImpl(() => Promise.reject(new Error('NotAllowedError')));
    await flush();

    expect(document.getElementById('vsl-big-play').hidden).toBe(false);
  });

  it('starts playback and reveals controls when the big play button is clicked', () => {
    const { video } = loadWithPlayImpl(() => undefined);

    document.getElementById('vsl-big-play').click();

    expect(video.play).toHaveBeenCalled();
    expect(document.getElementById('vsl-controls').hidden).toBe(false);
  });

  it('toggles play/pause based on video.paused', () => {
    const { video } = loadWithPlayImpl(() => undefined);
    const toggleBtn = document.getElementById('vsl-toggle-play');

    Object.defineProperty(video, 'paused', { value: true, configurable: true });
    toggleBtn.click();
    expect(video.play).toHaveBeenCalled();

    Object.defineProperty(video, 'paused', { value: false, configurable: true });
    toggleBtn.click();
    expect(video.pause).toHaveBeenCalled();
  });

  it('updates the play/pause button label on play and pause events', () => {
    const { video } = loadWithPlayImpl(() => undefined);
    const toggleBtn = document.getElementById('vsl-toggle-play');

    video.dispatchEvent(new Event('play'));
    expect(toggleBtn.getAttribute('aria-label')).toBe('Pause');

    video.dispatchEvent(new Event('pause'));
    expect(toggleBtn.getAttribute('aria-label')).toBe('Play');
  });

  it('toggles mute state and label when the mute button is clicked', () => {
    const { video } = loadWithPlayImpl(() => undefined);
    const muteBtn = document.getElementById('vsl-toggle-mute');
    video.muted = false;

    muteBtn.click();
    expect(video.muted).toBe(true);
    expect(muteBtn.getAttribute('aria-label')).toBe('Unmute');

    muteBtn.click();
    expect(video.muted).toBe(false);
    expect(muteBtn.getAttribute('aria-label')).toBe('Mute');
  });

  it('updates the progress bar width on timeupdate', () => {
    const { video } = loadWithPlayImpl(() => undefined);
    Object.defineProperty(video, 'duration', { value: 200, configurable: true });
    Object.defineProperty(video, 'currentTime', { value: 50, configurable: true });

    video.dispatchEvent(new Event('timeupdate'));

    expect(document.getElementById('vsl-progress-fill').style.width).toBe('25%');
  });

  it('does not update the progress bar when duration is unknown', () => {
    const { video } = loadWithPlayImpl(() => undefined);
    Object.defineProperty(video, 'duration', { value: NaN, configurable: true });

    video.dispatchEvent(new Event('timeupdate'));

    expect(document.getElementById('vsl-progress-fill').style.width).toBe('');
  });

  it('seeks the video when the progress track is clicked', () => {
    const { video } = loadWithPlayImpl(() => undefined);
    Object.defineProperty(video, 'duration', { value: 100, configurable: true });
    Object.defineProperty(video, 'currentTime', {
      value: 0,
      writable: true,
      configurable: true,
    });

    const track = document.getElementById('vsl-progress-track');
    track.getBoundingClientRect = jest.fn(() => ({ left: 0, width: 100 }));
    track.dispatchEvent(new MouseEvent('click', { clientX: 40 }));

    expect(video.currentTime).toBe(40);
  });

  it('shows the fallback message and hides the player on a video error', () => {
    loadWithPlayImpl(() => undefined);

    document.getElementById('vsl-video').dispatchEvent(new Event('error'));

    expect(document.getElementById('vsl-video').hidden).toBe(true);
    expect(document.getElementById('vsl-big-play').hidden).toBe(true);
    expect(document.getElementById('vsl-controls').hidden).toBe(true);
    expect(document.getElementById('vsl-fallback').hidden).toBe(false);
  });
});
