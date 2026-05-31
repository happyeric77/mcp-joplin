#!/usr/bin/env node
import { Command } from 'commander';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { version } from '../package.json';
import { resolveConfig } from './config.js';
import { createContext } from './context.js';
import { createJoplinMcpServer } from './server.js';

const program = new Command();

program
  .name('mcp-joplin')
  .description('MCP server for Joplin note-taking app')
  .version(version)
  .option('--token <token>', 'Joplin API token (overrides JOPLIN_TOKEN env)')
  .option(
    '--port <port>',
    'Joplin Web Clipper port (overrides JOPLIN_PORT env)'
  )
  .option(
    '--base-url <url>',
    'Joplin API base URL (overrides JOPLIN_BASE_URL env, e.g. http://host:41184)'
  )
  .action(async (opts: { token?: string; port?: string; baseUrl?: string }) => {
    const config = resolveConfig(opts);

    try {
      const context = await createContext(config);
      const { server } = createJoplinMcpServer({ context });

      const transport = new StdioServerTransport();
      await server.connect(transport);

      const dispose = async () => {
        await server.close().catch(() => undefined);
      };

      process.once('SIGINT', () => {
        void dispose().finally(() => process.exit(0));
      });

      process.once('SIGTERM', () => {
        void dispose().finally(() => process.exit(0));
      });
    } catch (error) {
      console.error(
        `Failed to start: ${error instanceof Error ? error.message : String(error)}`
      );
      console.error(
        'Make sure Joplin is running and Web Clipper service is enabled'
      );
      process.exit(1);
    }
  });

program.parse();
