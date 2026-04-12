export interface JoplinMcpConfig {
  token?: string;
  port?: number;
}

/**
 * Resolve configuration from CLI args → environment → defaults.
 * CLI args take precedence over environment variables.
 */
export function resolveConfig(cliArgs?: {
  token?: string;
  port?: string;
}): JoplinMcpConfig {
  const token = cliArgs?.token ?? process.env.JOPLIN_TOKEN ?? undefined;
  const portRaw = cliArgs?.port ?? process.env.JOPLIN_PORT;
  const port = portRaw ? parseInt(portRaw, 10) : undefined;

  return { token, port };
}
