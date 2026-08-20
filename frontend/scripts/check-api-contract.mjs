import { readFile } from "node:fs/promises";

const [openApiPath] = process.argv.slice(2);
if (!openApiPath) {
  throw new Error("Uso: node scripts/check-api-contract.mjs <openapi.json>");
}

const document = JSON.parse(await readFile(openApiPath, "utf8"));
const requiredOperations = {
  "/api/v1/appointments": ["get", "post"],
  "/api/v1/appointments/{appointment_id}": ["get", "patch", "delete"],
  "/api/v1/notifications/revocations": ["post"],
  "/api/v1/notifications/subscriptions": ["post"],
};

for (const [path, methods] of Object.entries(requiredOperations)) {
  const pathItem = document.paths?.[path];
  if (!pathItem) throw new Error(`OpenAPI não contém a rota obrigatória ${path}.`);
  for (const method of methods) {
    if (!pathItem[method]) throw new Error(`OpenAPI não contém ${method.toUpperCase()} ${path}.`);
  }
}

const appointmentList = document.paths["/api/v1/appointments"].get;
const responseSchema = appointmentList.responses?.["200"]?.content?.["application/json"]?.schema;
const reference = responseSchema?.$ref;
if (typeof reference !== "string") {
  throw new Error("A listagem de consultas precisa expor schema de página por cursor.");
}
const schemaName = reference.split("/").at(-1);
const pageSchema = document.components?.schemas?.[schemaName];
if (!pageSchema?.properties?.next_cursor || !pageSchema?.properties?.items) {
  throw new Error("O contrato da agenda precisa conter items e next_cursor.");
}

console.log("Contrato OpenAPI compatível com os fluxos críticos do frontend.");
