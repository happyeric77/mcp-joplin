import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { version } from '../package.json';
import { JoplinMcpContext } from './context.js';
import { registerResources } from './resources/index.js';
import { registerTools } from './tools/index.js';

export interface CreateServerOptions {
  context: JoplinMcpContext;
}

export interface CreatedServer {
  server: McpServer;
  context: JoplinMcpContext;
}

export function createJoplinMcpServer(
  options: CreateServerOptions
): CreatedServer {
  const { context } = options;

  const server = new McpServer({
    name: 'mcp-joplin',
    version: version,
  });

  registerTools(server, context);
  registerResources(server, context);

  return { server, context };
}
