import { type Config, toEnv, toMaskedEnv } from "../config.js";
import { PACKAGE_NAME, SERVER_NAME } from "../identity.js";
import { createTokenProvider } from "../shopify/auth/auth.js";
import { ShopifyClient } from "../shopify/client.js";
import { fetchShopInfo } from "../shopify/operations/shop.js";
import { standardServerEntry } from "./clients/launch.js";
import { createPrompter } from "./prompter.js";
import { askMcpClient, askShopifyConfig } from "./questions.js";

async function fetchShopName(config: Config): Promise<string> {
  const tokenProvider = createTokenProvider(config.storeDomain, config.auth);
  const client = new ShopifyClient(config, tokenProvider);
  return (await fetchShopInfo(client)).name;
}

function printManualConfig(config: Config): void {
  console.log("Add this entry to your MCP client's config file:");
  console.log(JSON.stringify({ [SERVER_NAME]: standardServerEntry(toMaskedEnv(config)) }, null, 2));
}

export async function runInitWizard(): Promise<void> {
  console.log(`${PACKAGE_NAME} setup — credentials stay on this machine.\n`);

  const prompter = createPrompter();
  try {
    const config = await askShopifyConfig(prompter);

    process.stdout.write(`Checking the connection to ${config.storeDomain}… `);
    const shopName = await fetchShopName(config);
    console.log(`✓ connected to "${shopName}"`);

    const client = await askMcpClient(prompter);
    if (!client) {
      printManualConfig(config);
      return;
    }

    const outcome = await client.register(toEnv(config));
    if (outcome.ok) {
      console.log(`✓ ${outcome.detail}`);
      console.log(`Restart ${client.label} (or reconnect the MCP server) to pick it up.`);
    } else {
      console.log(`Automatic registration failed: ${outcome.detail}`);
      printManualConfig(config);
    }
  } finally {
    prompter.close();
  }
}
