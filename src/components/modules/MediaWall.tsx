// Muro de medios en vivo (§6). Carga la lista editable de canales desde
// /channels.json (no hardcodeada). El live se resuelve de forma robusta y
// keyless con el embed por canal de YouTube:
//   https://www.youtube.com/embed/live_stream?channel={channelId}
// que reproduce el directo actual del canal; si no hay directo, YouTube degrada
// solo (nunca pantalla rota). El backend puede afinar el videoId destacado.

import { useEffect, useState } from 'react';
import type { MediaChannel } from '../../types';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { Tag } from '../primitives/Tag';

function liveSrc(channelId: string): string {
  const params = new URLSearchParams({ channel: channelId, autoplay: '0', mute: '1' });
  return `https://www.youtube.com/embed/live_stream?${params.toString()}`;
}

function ChannelFrame({ ch, big }: { ch: MediaChannel; big?: boolean }) {
  return (
    <Panel className="flex flex-col">
      <SectionTitle
        id={ch.destacado ? '★' : '▸'}
        title={ch.nombre}
        right={
          <Tag tone={ch.destacado ? 'accent' : 'neutral'}>
            {ch.categoria === 'financiero' ? 'FIN' : 'POL'}
          </Tag>
        }
      />
      <div className={`relative w-full ${big ? 'aspect-video' : 'aspect-video'} bg-black`}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={liveSrc(ch.channelId)}
          title={ch.nombre}
          loading="lazy"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </Panel>
  );
}

export function MediaWall() {
  const [channels, setChannels] = useState<MediaChannel[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/channels.json', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => setChannels(j.channels as MediaChannel[]))
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') setError(true);
      });
    return () => ctrl.abort();
  }, []);

  if (error) {
    return (
      <Panel>
        <SectionTitle id="📺" title="Muro de medios" />
        <div className="py-10 text-center mono text-[11px] text-neg">
          ⚠ No se pudo cargar la configuración de canales (channels.json).
        </div>
      </Panel>
    );
  }
  if (!channels) {
    return (
      <Panel>
        <SectionTitle id="📺" title="Muro de medios" />
        <div className="py-10 text-center mono text-[11px] text-muted">Cargando canales…</div>
      </Panel>
    );
  }

  const destacado = channels.find((c) => c.destacado) ?? channels[0];
  const resto = channels.filter((c) => c.id !== destacado?.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2">{destacado && <ChannelFrame ch={destacado} big />}</div>
      <div className="flex flex-col gap-3">
        <div className="mono text-[10px] uppercase tracking-wider text-subtle px-1">
          Canales · {resto.length}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {resto.map((ch) => (
            <ChannelFrame key={ch.id} ch={ch} />
          ))}
        </div>
      </div>
    </div>
  );
}
