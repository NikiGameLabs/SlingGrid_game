class PlayablesSDK {
  constructor() {
    this.isNative = typeof window !== 'undefined' && !!window.YouTubePlayables;
    this.firstFrameSent = false;
    this.gameReadySent = false;
  }

  firstFrameReady() {
    if (this.firstFrameSent) return;
    this.firstFrameSent = true;
    console.log('[PlayablesSDK] firstFrameReady triggered');
    if (this.isNative && window.YouTubePlayables.firstFrameReady) {
      window.YouTubePlayables.firstFrameReady();
    }
  }

  gameReady() {
    if (this.gameReadySent) return;
    this.gameReadySent = true;
    console.log('[PlayablesSDK] gameReady triggered');
    if (this.isNative && window.YouTubePlayables.gameReady) {
      window.YouTubePlayables.gameReady();
    }
  }

  saveGameProgress(data) {
    try {
      localStorage.setItem('slinggrid_save_data', JSON.stringify(data));
      if (this.isNative && window.YouTubePlayables.saveData) {
        window.YouTubePlayables.saveData(JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Save error:', e);
    }
  }

  loadGameProgress() {
    try {
      const stored = localStorage.getItem('slinggrid_save_data');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Load error:', e);
    }
    return {
      unlockedLevel: 1,
      levelStars: {},
      totalScore: 0
    };
  }

  setupLifecycleHandlers(onPause, onResume) {
    if (typeof window === 'undefined') return;

    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (onPause) onPause();
      } else {
        if (onResume) onResume();
      }
    });

    if (this.isNative && window.YouTubePlayables.onPause) {
      window.YouTubePlayables.onPause(() => {
        if (onPause) onPause();
      });
    }

    if (this.isNative && window.YouTubePlayables.onResume) {
      window.YouTubePlayables.onResume(() => {
        if (onResume) onResume();
      });
    }
  }
}

export const sdk = new PlayablesSDK();
