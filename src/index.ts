#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { runInitWizard } from "./cli/init.js";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";
import { createTokenProvider } from "./shopify/auth/auth.js";

async function runServer(): Promise<void> {
  const config = loadConfig();
  const tokenProvider = createTokenProvider(config.storeDomain, config.auth);
  await tokenProvider.getToken();

  const server = createServer(config, tokenProvider);
  await server.connect(new StdioServerTransport());
  console.error("shopify-store-builder MCP running on stdio");
}

function exitWithError(error: unknown, hint: string): never {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(hint);
  process.exit(1);
}

if (process.argv[2] === "init") {
  await runInitWizard().catch((error: unknown) =>
    exitWithError(error, "Setup did not finish — run the init command again."),
  );
  process.exit(0);
}

await runServer().catch((error: unknown) =>
  exitWithError(error, "Fix the Shopify configuration in your MCP settings and restart the server."),
);
