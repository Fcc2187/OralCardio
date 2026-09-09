import hashlib
import json
import subprocess
from pathlib import Path


PUBLISHED_ARTIFACTS = {
    "docs/architecture/GRAPH_REPORT.md",
    "docs/architecture/graph-overview.svg",
    "docs/architecture/graph-integrity.json",
}
SOURCE_PREFIXES = ("backend/", "frontend/", "database/", "docs/", "scripts/", ".github/workflows/")
SOURCE_FILES = {".graphifyignore", "README.md", "documentacao_tecnica.md", "render.yaml"}


def is_architecture_source(path):
    path = path.replace("\\", "/").lstrip("./")
    return path not in PUBLISHED_ARTIFACTS and (path.startswith(SOURCE_PREFIXES) or path in SOURCE_FILES)


def tracked_sources(root):
    git_root = root.as_posix()
    result = subprocess.run(
        [
            "git",
            "-c",
            f"safe.directory={git_root}",
            "-C",
            git_root,
            "ls-files",
            "--cached",
            "--others",
            "--exclude-standard",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return [path for path in result.stdout.splitlines() if is_architecture_source(path)]


def fingerprint_sources(root, paths):
    digest = hashlib.sha256()
    for path in sorted(paths):
        digest.update(path.encode("utf-8"))
        digest.update(b"\0")
        digest.update((root / path).read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def build_integrity(root, graph_path, paths=None, graph_commit=None):
    paths = tracked_sources(root) if paths is None else paths
    graph = json.loads(graph_path.read_text(encoding="utf-8"))
    return {
        "schema_version": 1,
        "source_file_count": len(paths),
        "source_fingerprint": fingerprint_sources(root, paths),
        "graph_commit": graph_commit or graph.get("built_at_commit", ""),
        "graph_nodes": len(graph.get("nodes", [])),
        "graph_links": len(graph.get("links", [])),
    }
