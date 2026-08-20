"""Exporta o contrato OpenAPI sem iniciar servidor ou tocar no Supabase."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Uso: python scripts/export_openapi.py <arquivo-de-saída>")
    destination = Path(sys.argv[1])
    destination.write_text(
        json.dumps(app.openapi(), ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
