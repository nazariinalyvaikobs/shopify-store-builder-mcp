export interface RegistrationOutcome {
  ok: boolean;
  detail: string;
}

export interface McpClient {
  label: string;
  register(env: Record<string, string>): Promise<RegistrationOutcome>;
}
