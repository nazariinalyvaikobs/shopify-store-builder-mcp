import * as readline from "node:readline/promises";
import { Writable } from "node:stream";

class SecretAwareOutput extends Writable {
  private muted = false;

  override _write(chunk: unknown, encoding: BufferEncoding, callback: () => void): void {
    if (!this.muted) process.stdout.write(chunk as string, encoding);
    callback();
  }

  async withMuted<T>(work: () => Promise<T>): Promise<T> {
    this.muted = true;
    try {
      return await work();
    } finally {
      this.muted = false;
    }
  }
}

export interface Prompter {
  ask(question: string): Promise<string>;
  askSecret(question: string): Promise<string>;
  close(): void;
}

export function createPrompter(): Prompter {
  const output = new SecretAwareOutput();
  const rl = readline.createInterface({
    input: process.stdin,
    output,
    terminal: process.stdin.isTTY === true,
  });
  const closed = new AbortController();
  rl.once("close", () => closed.abort());

  const ask = async (question: string) => {
    try {
      const answer = await rl.question(question, { signal: closed.signal });
      return answer.trim();
    } catch {
      throw new Error("Input closed before setup finished.");
    }
  };

  return {
    ask,
    askSecret: async (question) => {
      process.stdout.write(question);
      const answer = await output.withMuted(() => ask(""));
      process.stdout.write("\n");
      return answer;
    },
    close: () => rl.close(),
  };
}
