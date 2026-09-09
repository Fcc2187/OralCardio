import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const workflowPath = new URL("../.github/workflows/database-quality.yml", import.meta.url);

test("database workflow rebuilds the schema and runs every SQL test", () => {
  assert.equal(existsSync(workflowPath), true, "database-quality.yml must exist");

  const workflow = readFileSync(workflowPath, "utf8");
  assert.match(workflow, /uses: supabase\/setup-cli@v3/);
  assert.match(workflow, /version: "2\.116\.0"/);
  assert.match(workflow, /supabase db start/);
  assert.match(
    workflow,
    /for migration in database\/\[0-9\]\[0-9\]\[0-9\]_\*\.sql; do[\s\S]*?psql "\$DATABASE_URL" -v ON_ERROR_STOP=1 -f "\$migration"[\s\S]*?done/,
  );
  assert.match(
    workflow,
    /for test_file in database\/tests\/\[0-9\]\[0-9\]\[0-9\]_\*\.sql; do[\s\S]*?psql "\$DATABASE_URL" -v ON_ERROR_STOP=1 -f "\$test_file"[\s\S]*?done/,
  );
});
