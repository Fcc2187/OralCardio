import { describe, expect, it } from "vitest";

import { getEducationModuleMedia } from "./moduleMedia";

describe("moduleMedia", () => {
  it("retorna as mídias corretas para todos os seis módulos semeados", () => {
    expect(getEducationModuleMedia("conexao-boca-coracao")).toEqual({
      imageSrc: "/images/education/conexao-boca-coracao.webp",
      videoSrc: "/videos/video-1.mp4",
    });

    expect(getEducationModuleMedia("o-que-e-bacteremia")).toEqual({
      imageSrc: "/images/education/bacteremia.webp",
      videoSrc: "/videos/video-2.mp4",
    });

    expect(getEducationModuleMedia("entendendo-endocardite")).toEqual({
      imageSrc: "/images/education/endocardite.webp",
      videoSrc: "/videos/video-3.mp4",
    });

    expect(getEducationModuleMedia("gengivite-risco-silencioso")).toEqual({
      imageSrc: "/images/education/gengivite.webp",
      videoSrc: "/videos/video-4.mp4",
    });

    expect(getEducationModuleMedia("tecnicas-escovacao-fio-dental")).toEqual({
      imageSrc: "/images/education/higiene-bucal.webp",
      videoSrc: "/videos/video-5.mp4",
    });

    expect(getEducationModuleMedia("medicamentos-cardiacos-odontologia")).toEqual({
      imageSrc: "/images/education/medicamentos.webp",
      videoSrc: null,
    });
  });

  it("retorna null para slug desconhecido", () => {
    expect(getEducationModuleMedia("slug-inexistente")).toBeNull();
  });
});
