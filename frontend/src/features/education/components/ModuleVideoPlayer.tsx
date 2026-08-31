import { VideoOff } from "lucide-react";

interface ModuleVideoPlayerProps {
  title: string;
  src: string | null;
  onEnded: () => void;
}

export function ModuleVideoPlayer({
  title,
  src,
  onEnded,
}: ModuleVideoPlayerProps) {
  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-hairline-soft bg-canvas p-8 text-center min-[1024px]:p-12">
        <div
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-2xl bg-white border border-hairline-soft text-muted shadow-2xs"
        >
          <VideoOff className="size-6 stroke-[1.8]" />
        </div>
        <p className="font-body text-body-md text-muted">Vídeo instrutivo em breve.</p>
      </div>
    );
  }

  return (
    <figure className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-hairline-soft bg-black shadow-xs">
        <video
          className="aspect-video w-full object-cover"
          controls
          preload="metadata"
          playsInline
          src={src}
          onEnded={onEnded}
          aria-label={title}
        />
      </div>
      <figcaption className="sr-only">{title}</figcaption>
    </figure>
  );
}
