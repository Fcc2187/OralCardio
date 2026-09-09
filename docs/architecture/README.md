# Grafo da arquitetura

O `graphify-out/graph.json` é a fonte canônica local. Ele cobre código,
migrations SQL, testes, configuração de entrega e documentação. Imagens,
ícones e vídeos de `frontend/public` ficam fora da extração semântica porque
não representam dependências de software; as referências feitas pelo código
continuam no grafo.

Arquivos versionados:

- `graph-overview.svg`: visão das 30 maiores comunidades, própria para o README;
- `GRAPH_REPORT.md`: relatório integral, com hubs, relações e lacunas;
- `graph-integrity.json`: fingerprint das fontes e commit usados na geração;
- `../../scripts/render_architecture_overview.py`: renderizador Python sem dependências externas.

O HTML interativo e o JSON completo permanecem em `graphify-out/` para não
adicionar vários megabytes ao histórico Git.

## Atualização

Para mudanças somente em código:

```powershell
graphify update .
```

Quando documentação ou configuração mudar, execute `/graphify . --update` no
Codex para incluir também a extração semântica. Depois publique e confira os
artefatos:

```powershell
python -m scripts.sync_architecture_graph
python -m unittest scripts/test_render_architecture_overview.py
python -m unittest scripts/test_architecture_graph_artifacts.py
python -m scripts.verify_architecture_graph
```

O `graphify hook install` é opcional e atualiza o cache local após commits; ele
não publica arquivos versionados. Antes de commitar uma mudança arquitetural,
execute a sequência acima. O workflow `architecture-graph.yml` recalcula o
fingerprint no GitHub Actions e rejeita relatório ou SVG defasados.

## Limitações conhecidas desta geração

- 483 relações apontam para símbolos externos ou não materializados;
- 530 relações paralelas entre o mesmo par de nós são consolidadas no grafo simples;
- o backend de subagentes do Codex não expôs contagem de tokens, portanto o relatório registra custo semântico zero em vez de estimá-lo.
