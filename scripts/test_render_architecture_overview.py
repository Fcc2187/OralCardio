import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from scripts.render_architecture_overview import category


class RenderArchitectureOverviewTest(unittest.TestCase):
    def test_classifies_github_workflows_as_delivery(self):
        self.assertEqual(category(".github/workflows/quality.yml"), "Entrega")

    def test_renders_community_summary_as_svg(self):
        graph = {
            "built_at_commit": "abc1234",
            "nodes": [
                {"id": "api", "community": 0, "community_name": "Backend API", "source_file": "backend/app/api.py"},
                {"id": "ui", "community": 1, "community_name": "Frontend Auth", "source_file": "frontend/src/auth.tsx"},
                {"id": "rls", "community": 2, "community_name": "Database RLS", "source_file": "database/001_rls.sql"},
            ],
            "links": [
                {"source": "ui", "target": "api"},
                {"source": "api", "target": "rls"},
            ],
        }
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "graph.json"
            output = Path(temp_dir) / "overview.svg"
            source.write_text(json.dumps(graph), encoding="utf-8")

            subprocess.run(
                [sys.executable, "scripts/render_architecture_overview.py", source, output, "--version", "v2.0.0"],
                check=True,
            )

            svg = output.read_text(encoding="utf-8")
            self.assertIn("Backend API", svg)
            self.assertIn("Frontend Auth", svg)
            self.assertIn("Database RLS", svg)
            self.assertIn("3 nós · 2 relações", svg)
            self.assertIn("v2.0.0", svg)


if __name__ == "__main__":
    unittest.main()
