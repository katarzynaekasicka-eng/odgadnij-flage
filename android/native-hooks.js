/* Android host lifecycle: evaluated only for the local APK copy. No Java bridge. */
(() => {
  let background = false;
  const originalResume = resumeTimer;
  resumeTimer = function () { if (!background) originalResume(); };
  window.AndroidGame = Object.freeze({
    pause() {
      background = true;
      pauseTimer();
      if (game.audio && game.audio.state === 'running') game.audio.suspend().catch(() => {});
    },
    resume() {
      background = false;
      resumeTimer();
    },
    back() {
      if ($('confirmDialog').open) { cancelConfirmation(); return true; }
      if ($('answerDialog').open) return true;
      if (game.view === 'quiz') {
        askConfirmation('Wrócić do menu?', 'Bieżący postęp nie zostanie zapisany.', () => {
          game.token++; game.phase = 'idle'; showScreen('home'); $('start').focus();
        });
        return true;
      }
      if (game.view !== 'home') { showScreen('home'); return true; }
      return false;
    }
  });
})();
