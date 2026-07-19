/**
 * Custom video-sales-letter player.
 *
 * - Attempts a muted autoplay on load (required by every mobile browser).
 * - If autoplay is blocked, shows a big centered play button instead of
 *   failing silently.
 * - If the video file itself is missing (this repo ships without the real
 *   VSL — see docs/SETUP.md), shows a clean fallback message rather than a
 *   broken player.
 * - Ships its own play/pause, progress, and mute controls instead of the
 *   native browser ones, per the project's design.
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  function init() {
    var player = document.getElementById('vsl-player');
    var video = document.getElementById('vsl-video');
    if (!player || !video) return;

    var bigPlay = document.getElementById('vsl-big-play');
    var controls = document.getElementById('vsl-controls');
    var fallback = document.getElementById('vsl-fallback');
    var togglePlayBtn = document.getElementById('vsl-toggle-play');
    var toggleMuteBtn = document.getElementById('vsl-toggle-mute');
    var progressTrack = document.getElementById('vsl-progress-track');
    var progressFill = document.getElementById('vsl-progress-fill');

    function showFallback() {
      video.hidden = true;
      bigPlay.hidden = true;
      controls.hidden = true;
      fallback.hidden = false;
    }

    function showControls() {
      controls.hidden = false;
      bigPlay.hidden = true;
    }

    // Missing/broken source: fail gracefully instead of showing a black box.
    video.addEventListener('error', showFallback);

    // Try the autoplay the brief asks for. Browsers that block it will
    // reject this promise — that's expected, not an error state.
    var autoplayPromise = video.play();
    if (autoplayPromise && typeof autoplayPromise.then === 'function') {
      autoplayPromise
        .then(function () {
          showControls();
        })
        .catch(function () {
          // Autoplay blocked — show the big play button so the visitor
          // can start it with a single tap, which every mobile OS allows.
          bigPlay.hidden = false;
        });
    }

    bigPlay.addEventListener('click', function () {
      video.play();
      showControls();
    });

    togglePlayBtn.addEventListener('click', function () {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', function () {
      togglePlayBtn.setAttribute('aria-label', 'Pause');
    });

    video.addEventListener('pause', function () {
      togglePlayBtn.setAttribute('aria-label', 'Play');
    });

    toggleMuteBtn.addEventListener('click', function () {
      video.muted = !video.muted;
      toggleMuteBtn.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
    });

    video.addEventListener('timeupdate', function () {
      if (!video.duration) return;
      var pct = (video.currentTime / video.duration) * 100;
      progressFill.style.width = pct + '%';
    });

    progressTrack.addEventListener('click', function (event) {
      var rect = progressTrack.getBoundingClientRect();
      var ratio = (event.clientX - rect.left) / rect.width;
      if (video.duration) {
        video.currentTime = ratio * video.duration;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
