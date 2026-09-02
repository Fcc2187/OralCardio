import argparse
import json
from collections import Counter, defaultdict
from html import escape
from pathlib import Path


COLORS = {
    "Backend": "#c96b52",
    "Frontend": "#5b8a72",
    "Database": "#6a6f9b",
    "Documentação": "#b68b3a",
    "Entrega": "#597f95",
    "Projeto": "#777777",
}


def category(source_file):
    path = source_file.replace("\\", "/").lower()
    path = path[2:] if path.startswith("./") else path.lstrip("/")
    if path.startswith("backend/"):
        return "Backend"
    if path.startswith("frontend/"):
        return "Frontend"
    if path.startswith("database/"):
        return "Database"
    if path.startswith("docs/") or path.endswith(".md"):
        return "Documentação"
    if path.startswith(".github/") or path == "render.yaml":
        return "Entrega"
    return "Projeto"


def select_communities(communities, limit):
    grouped = defaultdict(list)
    for community_id, data in communities.items():
        grouped[data["category"]].append((community_id, data))
    for entries in grouped.values():
        entries.sort(key=lambda item: item[1]["size"], reverse=True)

    active = [name for name in COLORS if grouped[name]]
    quota = max(1, limit // max(len(active), 1))
    selected = {community_id for name in active for community_id, _ in grouped[name][:quota]}
    remaining = sorted(communities, key=lambda item: communities[item]["size"], reverse=True)
    for community_id in remaining:
        if len(selected) >= limit:
            break
        selected.add(community_id)
    return selected


def render(graph, limit, version):
    node_community = {}
    communities = {}
    for node in graph.get("nodes", []):
        community_id = str(node.get("community", "unknown"))
        node_community[node["id"]] = community_id
        data = communities.setdefault(
            community_id,
            {"label": node.get("community_name") or f"Comunidade {community_id}", "size": 0, "categories": Counter()},
        )
        data["size"] += 1
        data["categories"][category(node.get("source_file", ""))] += 1
    for data in communities.values():
        data["category"] = data["categories"].most_common(1)[0][0]

    selected = select_communities(communities, min(limit, len(communities)))
    columns = defaultdict(list)
    for community_id in selected:
        columns[communities[community_id]["category"]].append(community_id)
    active = [name for name in COLORS if columns[name]]
    for name in active:
        columns[name].sort(key=lambda item: communities[item]["size"], reverse=True)

    width = max(1200, 330 * len(active) + 100)
    height = max(700, 280 + 95 * max((len(columns[name]) for name in active), default=1))
    positions = {}
    for column_index, name in enumerate(active):
        x = 215 + column_index * ((width - 430) / max(len(active) - 1, 1))
        for row_index, community_id in enumerate(columns[name]):
            positions[community_id] = (x, 220 + row_index * 95)

    aggregated_edges = Counter()
    for link in graph.get("links", []):
        source = node_community.get(link.get("source"))
        target = node_community.get(link.get("target"))
        if source in selected and target in selected and source != target:
            aggregated_edges[tuple(sorted((source, target)))] += 1

    nodes_count = len(graph.get("nodes", []))
    links_count = len(graph.get("links", []))
    commit = str(graph.get("built_at_commit", "desconhecido"))[:7]
    subtitle = f"{nodes_count} nós · {links_count} relações · main@{commit}"
    if version:
        subtitle = f"{version} · {subtitle}"

    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#fffaf3"/>',
        '<text x="50%" y="55" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#222">OralCardio — mapa arquitetural</text>',
        f'<text x="50%" y="88" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" fill="#666">{escape(subtitle)}</text>',
    ]
    for (source, target), weight in aggregated_edges.items():
        x1, y1 = positions[source]
        x2, y2 = positions[target]
        stroke_width = min(6, 0.8 + weight ** 0.5 / 2)
        parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#9a938a" stroke-opacity="0.28" stroke-width="{stroke_width:.2f}"/>')

    for name in active:
        first_id = columns[name][0]
        x, _ = positions[first_id]
        parts.append(f'<text x="{x}" y="145" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="{COLORS[name]}">{escape(name)}</text>')
        for community_id in columns[name]:
            data = communities[community_id]
            x, y = positions[community_id]
            label = data["label"][:34]
            parts.extend(
                [
                    f'<rect x="{x - 125}" y="{y - 30}" width="250" height="60" rx="12" fill="{COLORS[name]}" fill-opacity="0.94"/>',
                    f'<text x="{x}" y="{y - 3}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="white">{escape(label)}</text>',
                    f'<text x="{x}" y="{y + 17}" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="white">{data["size"]} nós</text>',
                ]
            )

    parts.extend(
        [
            f'<text x="50%" y="{height - 30}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#777">Visão das {len(selected)} maiores comunidades; o relatório preserva o grafo canônico completo.</text>',
            "</svg>",
        ]
    )
    return "\n".join(parts)


def main():
    parser = argparse.ArgumentParser(description="Renderiza uma visão resumida do graph.json do Graphify.")
    parser.add_argument("graph", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--version", default="")
    args = parser.parse_args()
    graph = json.loads(args.graph.read_text(encoding="utf-8"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render(graph, max(args.limit, 1), args.version), encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
