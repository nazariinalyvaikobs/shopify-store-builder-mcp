import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "./config.js";
import { SERVER_NAME, VERSION } from "./identity.js";
import type { TokenProvider } from "./shopify/auth/auth.js";
import { ShopifyClient } from "./shopify/client.js";
import { registerShopTools } from "./tools/shop.js";

const SERVER_INSTRUCTIONS =
  "Tools operate on one Shopify store via the Admin API. Authentication is automatic: " +
  "access tokens are exchanged and refreshed from the configured credentials. If a tool " +
  "reports a failed credential exchange or a missing API scope, the user must fix it in " +
  "the Shopify Dev Dashboard or their MCP configuration — no tool can do it for them.";

export function createServer(config: Config, tokenProvider: TokenProvider): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: VERSION },
    { instructions: SERVER_INSTRUCTIONS },
  );
  const shopify = new ShopifyClient(config, tokenProvider);

  registerShopTools(server, shopify);

  return server;
}
