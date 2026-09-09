import json
import tempfile
import unittest
from pathlib import Path

from scripts.architecture_graph_artifacts import build_integrity, fingerprint_sources, is_architecture_source


class ArchitectureGraphArtifactsTest(unittest.TestCase):
    def test_identifies_sources_and_excludes_published_artifacts(self):
        self.assertTrue(is_architecture_source("backend/app/main.py"))
        self.assertTrue(is_architecture_source("docs/deployment.md"))
        self.assertFalse(is_architecture_source("docs/architecture/GRAPH_REPORT.md"))
        self.assertFalse(is_architecture_source("docs/architecture/graph-overview.svg"))

    def test_fingerprint_changes_with_source_content(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = root / "backend" / "app.py"
            source.parent.mkdir()
            source.write_text("version = 1\n", encoding="utf-8")

            first = fingerprint_sources(root, ["backend/app.py"])
            source.write_text("version = 2\n", encoding="utf-8")

            self.assertNotEqual(first, fingerprint_sources(root, ["backend/app.py"]))

    def test_build_integrity_records_graph_metadata(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = root / "README.md"
            source.write_text("OralCardio\n", encoding="utf-8")
            graph = root / "graph.json"
            graph.write_text(
                json.dumps({"built_at_commit": "abcdef123", "nodes": [1, 2], "links": [1]}),
                encoding="utf-8",
            )

            integrity = build_integrity(root, graph, ["README.md"])

            self.assertEqual("abcdef123", integrity["graph_commit"])
            self.assertEqual(2, integrity["graph_nodes"])
            self.assertEqual(1, integrity["graph_links"])
            self.assertEqual(1, integrity["source_file_count"])

    def test_build_integrity_accepts_a_published_commit(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = root / "README.md"
            source.write_text("OralCardio\n", encoding="utf-8")
            graph = root / "graph.json"
            graph.write_text(json.dumps({"nodes": [], "links": []}), encoding="utf-8")

            integrity = build_integrity(root, graph, ["README.md"], graph_commit="abcdef123")

            self.assertEqual("abcdef123", integrity["graph_commit"])


if __name__ == "__main__":
    unittest.main()
