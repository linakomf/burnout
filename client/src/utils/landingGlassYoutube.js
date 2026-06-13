
export const LANDING_GLASS_MUSIC_VIDEO_ID = 'gc7SIKLHhuY';
export const LANDING_GLASS_MUSIC_VOLUME = 28;

let apiPromise = null;

export function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube API is browser-only'));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error('YouTube IFrame API failed to load'));
      };

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        tag.onerror = () => reject(new Error('Could not load YouTube IFrame API'));
        document.head.appendChild(tag);
      }
    });
  }

  return apiPromise;
}
