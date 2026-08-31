import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModuleVideoPlayer } from "./ModuleVideoPlayer";

describe("ModuleVideoPlayer", () => {
  it("renderiza o player de vídeo e dispara onEnded quando o vídeo chega ao final", () => {
    const onEnded = vi.fn();
    const { container } = render(
      <ModuleVideoPlayer
        title="Vídeo instrutivo"
        src="/videos/video-1.mp4"
        onEnded={onEnded}
      />,
    );

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/videos/video-1.mp4");

    if (video) {
      fireEvent.ended(video);
      expect(onEnded).toHaveBeenCalledOnce();
    }
  });

  it("exibe mensagem 'Vídeo instrutivo em breve' quando o src for nulo", () => {
    render(
      <ModuleVideoPlayer
        title="Vídeo instrutivo"
        src={null}
        onEnded={vi.fn()}
      />,
    );

    expect(screen.getByText("Vídeo instrutivo em breve.")).toBeInTheDocument();
  });
});
