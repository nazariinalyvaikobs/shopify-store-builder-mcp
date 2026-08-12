# shopify-store-builder-mcp

MCP server for building Shopify stores with AI. Gives Claude Code, Cursor, and other MCP clients tools to edit themes, pages, and navigation on one Shopify store via the Admin GraphQL API.

Credentials stay on your machine. The server runs locally and talks directly to Shopify.

## Demo


https://github.com/user-attachments/assets/afd71d46-e8d7-4c06-96dc-094cae3fe5a2


## Quick start

https://github.com/user-attachments/assets/175e5051-b6ec-4201-a33e-d27c68356171

```bash
npx -y shopify-store-builder-mcp init
```

The wizard asks for your store credentials, verifies the connection, and registers the server in the client you pick:

- Claude Code
- Codex CLI
- Gemini CLI
- Claude Desktop
- Cursor
- Windsurf
- VS Code (Copilot)

Pick "Other" to print a config entry for any other MCP client.

## Getting Shopify credentials

You need a store on a plan with Admin API access and one of:

**Option A: Dev Dashboard app (recommended, tokens auto-refresh)**

1. Go to [dev.shopify.com/dashboard](https://dev.shopify.com/dashboard) and create an app for your store.
2. Grant it the scopes: `read_themes`, `write_themes`, `read_content`, `write_content`, `read_online_store_navigation`, `write_online_store_navigation`.
3. Copy the Client ID and Client Secret from the app's settings.

**Option B: permanent admin access token**

Use an existing `shpat_…` token from a custom app in your store admin (Settings → Apps and sales channels → Develop apps).

## Manual configuration

If you skip the wizard, add this to your MCP client's config:

```json
{
  "shopify-builder": {
    "command": "npx",
    "args": ["-y", "shopify-store-builder-mcp"],
    "env": {
      "SHOPIFY_STORE_DOMAIN": "your-store.myshopify.com",
      "SHOPIFY_CLIENT_ID": "…",
      "SHOPIFY_CLIENT_SECRET": "…"
    }
  }
}
```

Or with a permanent token, replace the client credentials with `"SHOPIFY_ADMIN_ACCESS_TOKEN": "shpat_…"`.

## Tools

| Tool | What it does |
|------|--------------|
| `shop_get_info` | Read store name, domain, plan, currency |
| `theme_list` | List installed themes |
| `theme_read_file` | Read a theme file (Liquid, JSON, CSS, JS) |
| `theme_update_file` | Create or update a theme file |
| `page_list` | List store pages |
| `page_create` | Create a page |
| `page_update` | Update a page's title, body, or visibility |
| `menu_list` | List navigation menus |
| `menu_update` | Update a navigation menu |

## Development

```bash
npm install
npm run dev     # run from source
npm run build   # compile to dist/
npm test
```

## License

ISC
