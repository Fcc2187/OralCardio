export interface EducationModuleMedia {
  imageSrc: string;
  videoSrc: string | null;
}

const MODULE_MEDIA_MAP: Record<string, EducationModuleMedia> = {
  "conexao-boca-coracao": {
    imageSrc: "/images/education/conexao-boca-coracao.webp",
    videoSrc: "/videos/video-1.mp4",
  },
  "o-que-e-bacteremia": {
    imageSrc: "/images/education/bacteremia.webp",
    videoSrc: "/videos/video-2.mp4",
  },
  "entendendo-endocardite": {
    imageSrc: "/images/education/endocardite.webp",
    videoSrc: "/videos/video-3.mp4",
  },
  "gengivite-risco-silencioso": {
    imageSrc: "/images/education/gengivite.webp",
    videoSrc: "/videos/video-4.mp4",
  },
  "tecnicas-escovacao-fio-dental": {
    imageSrc: "/images/education/higiene-bucal.webp",
    videoSrc: "/videos/video-5.mp4",
  },
  "medicamentos-cardiacos-odontologia": {
    imageSrc: "/images/education/medicamentos.webp",
    videoSrc: null,
  },
};

export function getEducationModuleMedia(slug: string): EducationModuleMedia | null {
  return MODULE_MEDIA_MAP[slug] ?? null;
}
