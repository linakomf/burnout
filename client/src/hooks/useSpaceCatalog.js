import { useState, useEffect } from 'react';
import { apiGetCatalog } from '../utils/apiCatalog';

const EMPTY = {
  films: [],
  musicItems: [],
  podcastEpisodes: [],
  meditations: [],
  readingItems: [],
  events: [],
};

export function useSpaceCatalog() {
  const [catalog, setCatalog] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGetCatalog('/films', { films: [] }, 'films'),
      apiGetCatalog('/music', { items: [] }, 'music'),
      apiGetCatalog('/podcasts', { episodes: [] }, 'podcasts'),
      apiGetCatalog('/meditations', { meditations: [] }, 'meditations'),
      apiGetCatalog('/reading', { items: [] }, 'reading'),
      apiGetCatalog('/events', { events: [] }, 'events'),
    ])
      .then(([filmsRes, musicRes, podcastsRes, medRes, readingRes, eventsRes]) => {
        if (cancelled) return;
        setCatalog({
          films: filmsRes.data?.films || [],
          musicItems: musicRes.data?.items || [],
          podcastEpisodes: podcastsRes.data?.episodes || [],
          meditations: medRes.data?.meditations || [],
          readingItems: readingRes.data?.items || [],
          events: eventsRes.data?.events || [],
        });
      })
      .catch(() => {
        if (!cancelled) setCatalog(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, loading };
}
