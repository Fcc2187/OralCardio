import json
from pathlib import Path

from scripts.architecture_graph_artifacts import build_integrity


def main():
    root = Path.cwd()
    artifact_dir = root / "docs" / "architecture"
    integrity_path = artifact_dir / "graph-integrity.json"
    integrity = json.loads(integrity_path.read_text(encoding="utf-8"))
    expected = (
        build_integrity(root, root / "graphify-out" / "graph.json", graph_commit=integrity["graph_commit"])
        if (root / "graphify-out" / "graph.json").exists()
        else None
    )
    if expected is not None and integrity != expected:
        raise SystemExit("Os artefatos publicados não correspondem ao graphify-out local.")

    from scripts.architecture_graph_artifacts import fingerprint_sources, tracked_sources

    if integrity["source_fingerprint"] != fingerprint_sources(root, tracked_sources(root)):
        raise SystemExit("Os artefatos Graphify estão desatualizados para as fontes versionadas.")
    report = (artifact_dir / "GRAPH_REPORT.md").read_text(encoding="utf-8")
    svg = (artifact_dir / "graph-overview.svg").read_text(encoding="utf-8")
    commit = integrity["graph_commit"]
    if (
        f"Source fingerprint: `{integrity['source_fingerprint']}`" not in report
        or f"Generated from Git commit: `{commit}`" not in report
        or commit[:7] not in svg
    ):
        raise SystemExit("O relatório, SVG e manifesto Graphify divergem no commit de origem.")
    print(f"Architecture graph verified: {integrity['source_file_count']} sources, {commit[:8]}")


if __name__ == "__main__":
    main()
