import argparse
import json
import subprocess
from pathlib import Path

from scripts.architecture_graph_artifacts import build_integrity
from scripts.render_architecture_overview import render


def release_version(root):
    git_root = root.as_posix()
    result = subprocess.run(
        ["git", "-c", f"safe.directory={git_root}", "-C", git_root, "describe", "--tags", "--abbrev=0"],
        capture_output=True,
        text=True,
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def current_commit(root):
    git_root = root.as_posix()
    return subprocess.run(
        ["git", "-c", f"safe.directory={git_root}", "-C", git_root, "rev-parse", "HEAD"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()


def with_provenance(report, integrity):
    lines = report.splitlines()
    provenance = [
        "",
        "## Published provenance",
        f"- Source fingerprint: `{integrity['source_fingerprint']}`",
        f"- Generated from Git commit: `{integrity['graph_commit']}`",
    ]
    return "\n".join(lines[:1] + provenance + lines[1:]) + "\n"


def main():
    parser = argparse.ArgumentParser(description="Publica os artefatos versionados do Graphify.")
    parser.add_argument("--root", type=Path, default=Path.cwd())
    args = parser.parse_args()
    root = args.root.resolve()
    graphify_out = root / "graphify-out"
    graph_path = graphify_out / "graph.json"
    report_path = graphify_out / "GRAPH_REPORT.md"
    output_dir = root / "docs" / "architecture"
    if not graph_path.exists() or not report_path.exists():
        raise SystemExit("Atualize o graphify-out primeiro: graphify update .")

    graph = json.loads(graph_path.read_text(encoding="utf-8"))
    graph["built_at_commit"] = current_commit(root)
    (output_dir / "graph-overview.svg").write_text(
        render(graph, 30, release_version(root)), encoding="utf-8"
    )
    integrity = build_integrity(root, graph_path, graph_commit=graph["built_at_commit"])
    (output_dir / "GRAPH_REPORT.md").write_text(
        with_provenance(report_path.read_text(encoding="utf-8"), integrity), encoding="utf-8"
    )
    (output_dir / "graph-integrity.json").write_text(
        json.dumps(integrity, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(f"Published architecture graph from {integrity['graph_commit'][:8]}")


if __name__ == "__main__":
    main()
