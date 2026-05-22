/** @returns {{ videoId: string, embedUrl: string } | null} */
function parseYoutubeUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;

  let videoId = '';
  try {
    if (/^[\w-]{11}$/.test(s)) {
      videoId = s;
    } else {
      const u = new URL(s.startsWith('http') ? s : `https://${s}`);
      if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.replace(/^\//, '').split('/')[0] || '';
      } else if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
        videoId = u.searchParams.get('v') || '';
        if (!videoId) {
          const m = u.pathname.match(/\/(?:embed|shorts|v)\/([\w-]{11})/);
          if (m) videoId = m[1];
        }
      }
    }
  } catch {
    return null;
  }

  if (!/^[\w-]{11}$/.test(videoId)) return null;
  return {
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}

module.exports = { parseYoutubeUrl };
