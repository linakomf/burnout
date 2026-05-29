import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  LANDING_GLASS_MUSIC_VIDEO_ID,
  LANDING_GLASS_MUSIC_VOLUME,
  loadYouTubeIframeApi,
} from '../../utils/landingGlassYoutube';

const publicBase = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const GLASS_MUSIC_COVER = `${publicBase}/music/mood-card-calm.png`;

const CHAT_SEQUENCE_MS = [400, 900, 850, 900, 850, 950, 550];
const CHAT_STEP_COUNT = CHAT_SEQUENCE_MS.length + 1;

const bubbleEnter = {
  initial: { opacity: 0, y: 12, scale: 0.94 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
};

const cardEnter = {
  initial: { opacity: 0, y: 16, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

function TypingBubble({ label }) {
  return (
    <motion.div
      className="land-glass-bubble land-glass-bubble--typing"
      aria-label={label}
      {...bubbleEnter}
    >
      <span className="land-glass-typing-dots" aria-hidden>
        <span />
        <span />
        <span />
      </span>
    </motion.div>
  );
}

export default function LandingGlassCard() {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const hostId = useId().replace(/:/g, '');
  const [chatStep, setChatStep] = useState(reduceMotion ? CHAT_STEP_COUNT : 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef(null);
  const unlockedRef = useRef(false);
  const autoPlayWantedRef = useRef(false);

  const getPlayer = useCallback(() => {
    const player = playerRef.current;
    return player && typeof player.playVideo === 'function' ? player : null;
  }, []);

  const playYoutube = useCallback(() => {
    const player = getPlayer();
    if (!player?.playVideo) return false;

    try {
      player.unMute?.();
      player.setVolume?.(LANDING_GLASS_MUSIC_VOLUME);
      player.playVideo();
      unlockedRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, [getPlayer]);

  const pauseYoutube = useCallback(() => {
    const player = getPlayer();
    try {
      player?.pauseVideo?.();
    } catch {
      /* ignore */
    }
    setIsPlaying(false);
  }, [getPlayer]);

  const unlockPlayback = useCallback(() => {
    unlockedRef.current = true;
    if (autoPlayWantedRef.current && playerReady) {
      playYoutube();
    }
  }, [playYoutube, playerReady]);

  const requestAutoPlay = useCallback(() => {
    autoPlayWantedRef.current = true;
    if (!playerReady) return;
    if (unlockedRef.current) {
      playYoutube();
      return;
    }
    unlockPlayback();
  }, [playYoutube, playerReady, unlockPlayback]);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || playerRef.current) return;

        const player = new YT.Player(hostId, {
          videoId: LANDING_GLASS_MUSIC_VIDEO_ID,
          width: 1,
          height: 1,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            loop: 1,
            playlist: LANDING_GLASS_MUSIC_VIDEO_ID,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              playerRef.current = event.target;
              event.target.setVolume(LANDING_GLASS_MUSIC_VOLUME);
              event.target.mute();
              setPlayerReady(true);
              if (autoPlayWantedRef.current && unlockedRef.current) {
                playYoutube();
              }
            },
            onStateChange: (event) => {
              const { data } = event;
              const playing = data === YT.PlayerState.PLAYING;
              const paused = data === YT.PlayerState.PAUSED;
              const ended = data === YT.PlayerState.ENDED;

              if (playing) setIsPlaying(true);
              if (paused) setIsPlaying(false);
              if (ended) {
                event.target.playVideo();
              }
            },
          },
        });

      })
      .catch(() => {
        setPlayerReady(false);
      });

    return () => {
      cancelled = true;
      const player = playerRef.current;
      if (player?.destroy) {
        try {
          player.destroy();
        } catch {
          /* ignore */
        }
      }
      playerRef.current = null;
      setPlayerReady(false);
    };
  }, [hostId, playYoutube]);

  useEffect(() => {
    const root = document.querySelector('.landing.landing-v2');
    if (!root) return undefined;

    const onGesture = () => unlockPlayback();

    root.addEventListener('pointerdown', onGesture, { capture: true });
    root.addEventListener('keydown', onGesture, { capture: true });
    return () => {
      root.removeEventListener('pointerdown', onGesture, { capture: true });
      root.removeEventListener('keydown', onGesture, { capture: true });
    };
  }, [unlockPlayback]);

  useEffect(() => {
    if (reduceMotion) {
      setChatStep(CHAT_STEP_COUNT);
      return undefined;
    }

    setChatStep(0);
    autoPlayWantedRef.current = false;
    setIsPlaying(false);
    const timers = [];
    let elapsed = 0;

    CHAT_SEQUENCE_MS.forEach((delay, index) => {
      elapsed += delay;
      timers.push(
        window.setTimeout(() => {
          setChatStep(index + 1);
        }, elapsed)
      );
    });

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [reduceMotion, t]);

  const showMusic = chatStep >= 6;

  useEffect(() => {
    if (!showMusic || !playerReady) return undefined;
    autoPlayWantedRef.current = true;
    requestAutoPlay();
    return undefined;
  }, [showMusic, playerReady, requestAutoPlay]);

  const togglePlayback = useCallback(() => {
    const player = getPlayer();
    if (!player) return;

    unlockedRef.current = true;
    player.unMute?.();
    player.setVolume?.(LANDING_GLASS_MUSIC_VOLUME);

    const state = player.getPlayerState?.();
    const YT = window.YT;

    if (state === YT?.PlayerState?.PLAYING) {
      autoPlayWantedRef.current = false;
      pauseYoutube();
      return;
    }

    autoPlayWantedRef.current = true;
    playYoutube();
  }, [getPlayer, pauseYoutube, playYoutube]);

  const showUser = chatStep >= 1;
  const showTyping1 = chatStep === 2;
  const showAi1 = chatStep >= 3;
  const showTyping2 = chatStep === 4;
  const showAi2 = chatStep >= 5;

  return (
    <div
      className="land-glass-card"
      aria-hidden={false}
      onPointerDown={() => unlockPlayback()}
    >
      <div id={hostId} className="land-glass-yt-host land-glass-audio-el" aria-hidden />

      {showUser && (
        <motion.div className="land-glass-bubble land-glass-bubble--reply" {...bubbleEnter}>
          <p>{t('landing.glassUserMsg')}</p>
          <time>{t('landing.glassUserTime')}</time>
        </motion.div>
      )}

      {showTyping1 && <TypingBubble label={t('landing.glassTypingAria')} />}

      {showAi1 && (
        <motion.div className="land-glass-bubble" {...bubbleEnter}>
          <p>{t('landing.glassMsg1')}</p>
          <time>{t('landing.glassTime1')}</time>
        </motion.div>
      )}

      {showTyping2 && <TypingBubble label={t('landing.glassTypingAria')} />}

      {showAi2 && (
        <motion.div className="land-glass-bubble" {...bubbleEnter}>
          <p>{t('landing.glassMsg2')}</p>
          <time>{t('landing.glassTime2')}</time>
        </motion.div>
      )}

      {showMusic && (
        <motion.article className="land-glass-event land-glass-music" {...cardEnter}>
          <div className="land-glass-event-cover">
            <img src={GLASS_MUSIC_COVER} alt="" />
            <span className="land-glass-event-cat">{t('landing.glassMusicCategory')}</span>
          </div>
          <div className="land-glass-event-body">
            <h3 className="land-glass-event-title">{t('landing.glassMusicTitle')}</h3>
            <p className="land-glass-event-meta">{t('landing.glassMusicArtist')}</p>
            <motion.div
              className={`land-glass-voice land-glass-voice--in-card${isPlaying ? ' land-glass-voice--playing' : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <button
                type="button"
                className="land-glass-play"
                onClick={togglePlayback}
                aria-label={isPlaying ? t('landing.glassPauseAria') : t('landing.glassPlayAria')}
                aria-pressed={isPlaying}
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
              <div className="land-glass-wave" aria-hidden>
                {Array.from({ length: 18 }, (_, i) => (
                  <span key={i} className="land-glass-wave-bar" style={{ '--i': i }} />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.article>
      )}
    </div>
  );
}
