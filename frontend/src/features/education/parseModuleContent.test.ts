import { describe, expect, it } from "vitest";

import { parseModuleContent } from "./parseModuleContent";

describe("parseModuleContent", () => {
  it("devolve lista vazia para undefined, null e tipos primitivos", () => {
    expect(parseModuleContent(undefined)).toEqual([]);
    expect(parseModuleContent(null)).toEqual([]);
    expect(parseModuleContent("texto solto")).toEqual([]);
    expect(parseModuleContent(42)).toEqual([]);
  });

  it("devolve lista vazia para objeto sem a chave sections", () => {
    expect(parseModuleContent({})).toEqual([]);
  });

  it("devolve lista vazia quando sections é null ou não é array", () => {
    expect(parseModuleContent({ sections: null })).toEqual([]);
    expect(parseModuleContent({ sections: "não é array" })).toEqual([]);
  });

  it("descarta blocos de tipo desconhecido em vez de lançar", () => {
    expect(parseModuleContent({ sections: [{ type: "video", url: "x" }] })).toEqual([]);
  });

  it("aceita um bloco de texto válido", () => {
    const content = { sections: [{ type: "text", title: "Título", body: "Corpo do texto" }] };

    expect(parseModuleContent(content)).toEqual([
      { type: "text", title: "Título", body: "Corpo do texto" },
    ]);
  });

  it("filtra blocos válidos misturados com blocos malformados, sem lançar", () => {
    const content = {
      sections: [
        { type: "text", title: "Válido", body: "Corpo" },
        { type: "video" },
        { type: "text", title: "Sem body" },
        null,
        "string solta",
        { type: "text", title: "Outro válido", body: "Corpo 2" },
      ],
    };

    expect(parseModuleContent(content)).toEqual([
      { type: "text", title: "Válido", body: "Corpo" },
      { type: "text", title: "Outro válido", body: "Corpo 2" },
    ]);
  });
});
