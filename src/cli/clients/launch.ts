import * as path from "node:path";
import { PACKAGE_NAME } from "../../identity.js";

export const LAUNCH_COMMAND = "npx";

export function launchArgs(): string[] {
  const entrypoint = process.argv[1] ?? "";
  const runningFromSource = entrypoint.endsWith(path.join("src", "index.ts"));
  return runningFromSource ? ["tsx", entrypoint] : ["-y", PACKAGE_NAME];
}

export function standardServerEntry(env: Record<string, string>): Record<string, unknown> {
  return { command: LAUNCH_COMMAND, args: launchArgs(), env };
}
