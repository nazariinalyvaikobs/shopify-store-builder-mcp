import * as os from "node:os";
import * as path from "node:path";
import { cliClient } from "./cli-clients.js";
import { jsonFileClient } from "./json-clients.js";
import { standardServerEntry } from "./launch.js";
import type { McpClient } from "./types.js";

function appDataDir(): string {
  const home = os.homedir();
  if (process.platform === "darwin") return path.join(home, "Library", "Application Support");
  if (process.platform === "win32") return process.env.APPDATA ?? path.join(home, "AppData", "Roaming");
  return path.join(home, ".config");
}

function geminiSettingsPath(): string {
  if (process.platform === "win32") return path.join(appDataDir(), "gemini", "settings.json");
  return path.join(os.homedir(), ".gemini", "settings.json");
}

function mcpServersFileClient(label: string, filePath: string): McpClient {
  return jsonFileClient({ label, filePath, rootKey: "mcpServers", buildEntry: standardServerEntry });
}

function vscodeServerEntry(env: Record<string, string>): Record<string, unknown> {
  return { type: "stdio", ...standardServerEntry(env) };
}

export function knownClients(): McpClient[] {
  const home = os.homedir();
  return [
    cliClient({ label: "Claude Code", command: "claude", envFlag: "-e", scopeArgs: ["-s", "user"] }),
    cliClient({ label: "Codex CLI", command: "codex", envFlag: "--env", scopeArgs: [] }),
    mcpServersFileClient("Gemini CLI", geminiSettingsPath()),
    mcpServersFileClient("Claude Desktop", path.join(appDataDir(), "Claude", "claude_desktop_config.json")),
    mcpServersFileClient("Cursor", path.join(home, ".cursor", "mcp.json")),
    mcpServersFileClient("Windsurf", path.join(home, ".codeium", "windsurf", "mcp_config.json")),
    jsonFileClient({
      label: "VS Code (Copilot)",
      filePath: path.join(appDataDir(), "Code", "User", "mcp.json"),
      rootKey: "servers",
      buildEntry: vscodeServerEntry,
    }),
  ];
}
