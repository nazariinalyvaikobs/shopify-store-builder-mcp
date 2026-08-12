export type AuthConfig =
  | { mode: "accessToken"; accessToken: string }
  | { mode: "clientCredentials"; clientId: string; clientSecret: string };

export interface Config {
  storeDomain: string;
  auth: AuthConfig;
}

const AUTH_SETUP_HINT =
  "Set SHOPIFY_ADMIN_ACCESS_TOKEN, or SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET " +
  "(Shopify Dev Dashboard → your app → Client credentials).";

export function normalizeStoreDomain(input: string): string {
  const host = input.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (host === "" || host.endsWith(".myshopify.com")) return host;
  return `${host.split(".")[0]}.myshopify.com`;
}

function loadAuthConfig(): AuthConfig {
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (accessToken) return { mode: "accessToken", accessToken };

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (clientId && clientSecret) return { mode: "clientCredentials", clientId, clientSecret };

  throw new Error(`Missing Shopify credentials. ${AUTH_SETUP_HINT}`);
}

export function loadConfig(): Config {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!storeDomain) throw new Error("Missing required env var: SHOPIFY_STORE_DOMAIN");
  return { storeDomain: normalizeStoreDomain(storeDomain), auth: loadAuthConfig() };
}

export function toEnv(config: Config): Record<string, string> {
  const auth: Record<string, string> =
    config.auth.mode === "accessToken"
      ? { SHOPIFY_ADMIN_ACCESS_TOKEN: config.auth.accessToken }
      : { SHOPIFY_CLIENT_ID: config.auth.clientId, SHOPIFY_CLIENT_SECRET: config.auth.clientSecret };
  return { SHOPIFY_STORE_DOMAIN: config.storeDomain, ...auth };
}

const SECRET_PLACEHOLDER = "<paste the real value here — never share it>";

export function toMaskedEnv(config: Config): Record<string, string> {
  const auth: Record<string, string> =
    config.auth.mode === "accessToken"
      ? { SHOPIFY_ADMIN_ACCESS_TOKEN: SECRET_PLACEHOLDER }
      : { SHOPIFY_CLIENT_ID: config.auth.clientId, SHOPIFY_CLIENT_SECRET: SECRET_PLACEHOLDER };
  return { SHOPIFY_STORE_DOMAIN: config.storeDomain, ...auth };
}
