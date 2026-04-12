import { JoplinMcpConfig } from './config.js';
import { JoplinClient } from './joplin-client.js';

export interface JoplinMcpContext {
  readonly client: JoplinClient;
}

/**
 * Initialize the Joplin client, auto-discovering the port if not specified,
 * then verify connectivity with a ping.
 */
export async function createContext(
  config: JoplinMcpConfig
): Promise<JoplinMcpContext> {
  let actualPort = config.port;

  // Auto-discover port if not provided
  if (!actualPort) {
    const tempClient = new JoplinClient({ token: config.token });
    const discovery = await tempClient.autoDiscover();
    actualPort = discovery.port;
  }

  const client = new JoplinClient({ token: config.token, port: actualPort });

  // Verify the connection
  await client.ping();
  console.error(`Connected to Joplin on port ${actualPort || 41184}`);

  return { client };
}
