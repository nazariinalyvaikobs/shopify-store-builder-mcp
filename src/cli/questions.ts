import { type AuthConfig, type Config, normalizeStoreDomain } from "../config.js";
import { knownClients } from "./clients/index.js";
import type { McpClient } from "./clients/types.js";
import type { Prompter } from "./prompter.js";

function required(name: string, value: string): string {
  if (value === "") throw new Error(`${name} is required. Run init again.`);
  return value;
}

async function askAuthConfig(prompter: Prompter): Promise<AuthConfig> {
  const hasToken = await prompter.ask("Do you already have a permanent admin access token (shpat_…)? [y/N]: ");
  if (hasToken.toLowerCase().startsWith("y")) {
    const accessToken = required("Access token", await prompter.askSecret("Access token (hidden): "));
    return { mode: "accessToken", accessToken };
  }

  console.log("Using Dev Dashboard app credentials (dev.shopify.com/dashboard → your app → Client credentials).");
  const clientId = required("Client ID", await prompter.ask("Client ID: "));
  const clientSecret = required("Client Secret", await prompter.askSecret("Client Secret (hidden): "));
  return { mode: "clientCredentials", clientId, clientSecret };
}

export async function askShopifyConfig(prompter: Prompter): Promise<Config> {
  const storeDomain = required(
    "Store domain",
    normalizeStoreDomain(await prompter.ask("Store domain (my-store.myshopify.com): ")),
  );
  const auth = await askAuthConfig(prompter);
  return { storeDomain, auth };
}

export async function askMcpClient(prompter: Prompter): Promise<McpClient | null> {
  const clients = knownClients();
  console.log("\nWhich AI client should use this server?");
  clients.forEach((client, index) => console.log(`  ${index + 1}) ${client.label}`));
  console.log(`  ${clients.length + 1}) Other — print the config to add manually`);

  while (true) {
    const answer = await prompter.ask(`Choose [1-${clients.length + 1}, default 1]: `);
    const choice = answer === "" ? 1 : Number.parseInt(answer, 10);
    if (Number.isInteger(choice) && choice >= 1 && choice <= clients.length + 1) {
      return choice <= clients.length ? clients[choice - 1] : null;
    }
  }
}
