import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Pause, Play, RotateCcw } from 'lucide-react';
import { backendPublicUrl } from '../../utils/assetUrl';

function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function buildYoutubeSrc(embedUrl, autoplay, startSec = 0) {
  const base = String(embedUrl || '').trim();
  if (!base) return '';
  const sep = base.includes('?') ? '&' : '?';
  const start = Math.max(0, Math.floor(startSec));
  const startParam = start > 0 ? `&start=${start}` : '';
  return `${base}${sep}autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1${startParam}`;
}

export default function MeditationAudioPlayer({
  practice,
  favorite,
  onToggleFavorite,
  t,
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(practice.durationMin * 60);
  const [youtubeStart, setYoutubeStart] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  const isYoutube = practice.audioSource === 'youtube' && practice.embedUrl;
  const nativeSrc = useMemo(() => {
    if (isYoutube) return '';
    const raw = practice.audioUrl || '';
    if (!raw) return '';
    return raw.startsWith('http') ? raw : backendPublicUrl(raw);
  }, [isYoutube, practice.audioUrl]);

  const youtubeSrc = useMemo(
    () => (isYoutube ? buildYoutubeSrc(practice.embedUrl, playing, youtubeStart) : ''),
    [isYoutube, practice.embedUrl, playing, youtubeStart]
  );

  useEffect(() => {
    setPlaying(false);
    setElapsed(0);
    setYoutubeStart(0);
    setScrubbing(false);
    setDuration(Math.max(60, (practice.durationMin || 10) * 60));
  }, [practice.id, practice.durationMin]);

  useEffect(() => {
    if (isYoutube || !nativeSrc) return undefined;
    const el = audioRef.current;
    if (!el) return undefined;

    const onTime = () => setElapsed(el.currentTime || 0);
    const onMeta = () => {
      if (el.duration && Number.isFinite(el.duration)) setDuration(el.duration);
    };
    const onEnd = () => setPlaying(false);

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
    };
  }, [isYoutube, nativeSrc, practice.id]);

  useEffect(() => {
    if (!isYoutube || !playing || scrubbing) return undefined;
    const id = setInterval(() => setElapsed((e) => Math.min(e + 1, duration)), 1000);
    return () => clearInterval(id);
  }, [isYoutube, playing, duration, scrubbing]);

  const togglePlay = useCallback(() => {
    if (isYoutube) {
      setPlaying((p) => !p);
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [isYoutube]);

  const seekTo = useCallback(
    (sec, { commitYoutube = true } = {}) => {
      const next = Math.max(0, Math.min(duration, sec));
      setElapsed(next);
      if (isYoutube) {
        if (commitYoutube) {
          setYoutubeStart(next);
          if (!playing) setPlaying(true);
        }
        return;
      }
      const el = audioRef.current;
      if (!el) return;
      el.currentTime = next;
    },
    [duration, isYoutube, playing]
  );

  const restart = useCallback(() => {
    if (isYoutube) {
      setYoutubeStart(0);
      setPlaying(false);
      setElapsed(0);
      requestAnimationFrame(() => setPlaying(true));
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    setElapsed(0);
  }, [isYoutube]);

  const progress = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const showFavorite = typeof onToggleFavorite === 'function';

  return (
    <div className="pr-meditation-timer pr-meditation-audio">
      {isYoutube ? (
        <iframe
          key={youtubeSrc}
          title={practice.title}
          className="meditation-audio-yt-hidden"
          src={youtubeSrc}
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <audio ref={audioRef} src={nativeSrc} preload="metadata" className="meditation-audio-native-el" />
      )}

      <div className="pr-meditation-bar-row">
        <span className="pr-meditation-time">{formatClock(elapsed)}</span>
        <div className="pr-meditation-track-wrap">
          <div
            className="pr-meditation-track"
            style={{ '--pr-progress': `${progress}%` }}
            aria-hidden>
            <div className="pr-meditation-fill" style={{ width: `${progress}%` }} />
          </div>
          <input
            type="range"
            className="pr-meditation-seek"
            min={0}
            max={Math.max(1, Math.floor(duration))}
            step={1}
            value={Math.min(Math.floor(elapsed), Math.max(1, Math.floor(duration)))}
            aria-label={t('pages.meditationModalSeek')}
            onPointerDown={() => setScrubbing(true)}
            onPointerUp={() => setScrubbing(false)}
            onPointerCancel={() => setScrubbing(false)}
            onInput={(e) => {
              const v = Number(e.target.value);
              if (isYoutube) {
                setElapsed(v);
              } else {
                seekTo(v);
              }
            }}
            onChange={(e) => {
              seekTo(Number(e.target.value), { commitYoutube: true });
              setScrubbing(false);
            }}
          />
        </div>
        <span className="pr-meditation-time">{formatClock(duration)}</span>
      </div>

      <div className="pr-meditation-controls">
        <button type="button" className="pr-meditation-ctrl" onClick={restart} aria-label={t('pages.meditationModalRepeat')}>
          <RotateCcw size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="pr-meditation-play"
          onClick={togglePlay}
          aria-label={playing ? t('pages.meditationModalPause') : t('pages.meditationModalResume')}>
          {playing ? (
            <Pause size={26} fill="currentColor" strokeWidth={1.5} />
          ) : (
            <Play size={26} fill="currentColor" strokeWidth={0} />
          )}
        </button>
        {showFavorite ? (
          <button
            type="button"
            className={`pr-meditation-ctrl pr-meditation-heart ${favorite ? 'is-on' : ''}`}
            onClick={onToggleFavorite}
            aria-label={t('pages.meditationModalFavorite')}>
            <Heart size={20} strokeWidth={2} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
