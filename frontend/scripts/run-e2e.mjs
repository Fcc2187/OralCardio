import { spawn } from "node:child_process";

import { preview } from "vite";

const port = 4173;

function runPlaywright() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["./node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
      { stdio: "inherit" },
    );

    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

const server = await preview({
  preview: { host: "127.0.0.1", port, strictPort: true },
});

try {
  process.exitCode = await runPlaywright();
} finally {
  await server.close();
}
