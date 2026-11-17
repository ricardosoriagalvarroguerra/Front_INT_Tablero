// Reproductor de un canal de YouTube en vivo. El backend resuelve el videoId
// del directo actual (GET /api/media/live/:channelId); si no puede, se usa el
// embed por canal (live_stream). Algunos canales bloquean la inserción de su
// directo: por eso siempre hay un enlace para abrirlo en YouTube.

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export function liveUrl(channelId: string) {
  return `https://www.youtube.com/channel/${channelId}/live`;
}

export function LivePlayer({ channelId, titulo }: { channelId: string; titulo: string }) {
  const [videoId, setVideoId] = useState<string | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    api
      .live(channelId, ctrl.signal)
      .then((r) => setVideoId(r.videoId))
      .catch(() => setVideoId(null));
    return () => ctrl.abort();
  }, [channelId]);
  const params = new URLSearchParams({ autoplay: '0', mute: '1', rel: '0' });
  const src = videoId
    ? `https://www.youtube.com/embed/${videoId}?${params}`
    : `https://www.youtube.com/embed/live_stream?${new URLSearchParams({ channel: channelId, ...Object.fromEntries(params) })}`;
  return (
    <div className="relative w-full aspect-video bg-black">
      <iframe
        key={src}
        className="absolute inset-0 w-full h-full"
        src={src}
        title={titulo}
        loading="lazy"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <a
        href={liveUrl(channelId)}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 right-2 px-2 py-1 rounded-[4px] text-[11px] bg-black/70 text-white hover:bg-black"
      >
        Abrir en YouTube ↗
      </a>
    </div>
  );
}
