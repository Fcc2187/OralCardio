# Grafo da arquitetura

O `graphify-out/graph.json` é a fonte canônica local. Ele cobre código,
migrations SQL, testes, configuração de entrega e documentação. Imagens,
ícones e vídeos de `frontend/public` ficam fora da extração semântica porque
não representam dependências de software; as referências feitas pelo código
continuam no grafo.

Arquivos versionados:

- `graph-overview.svg`: visão das 30 maiores comunidades, própria para o README;
- `GRAPH_REPORT.md`: relatório integral, com hubs, relações e lacunas;
- `../../scripts/render_architecture_overview.py`: renderizador Python sem dependências externas.

O HTML interativo e o JSON completo permanecem em `graphify-out/` para não
adicionar vários megabytes ao histórico Git.

## Atualização

Para mudanças somente em código:

```powershell
graphify update .
```

Quando documentação ou configuração mudar, execute `/graphify . --update` no
Codex para incluir também a extração semântica. Depois publique os artefatos:

```powershell
$version = git describe --tags --abbrev=0
python scripts/render_architecture_overview.py graphify-out/graph.json docs/architecture/graph-overview.svg --version $version
Copy-Item graphify-out/GRAPH_REPORT.md docs/architecture/GRAPH_REPORT.md
python -m unittest scripts/test_render_architecture_overview.py
```

O workflow `architecture-graph.yml` exige que ambos os artefatos acompanhem
pull requests que alterem fontes arquiteturais.

## Limitações conhecidas desta geração

- 483 relações apontam para símbolos externos ou não materializados;
- 530 relações paralelas entre o mesmo par de nós são consolidadas no grafo simples;
- o backend de subagentes do Codex não expôs contagem de tokens, portanto o relatório registra custo semântico zero em vez de estimá-lo.
