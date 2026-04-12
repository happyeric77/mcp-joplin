#!/usr/bin/env node

// Public API re-exports
export { resolveConfig } from './config.js';
export type { JoplinMcpConfig } from './config.js';

export { createContext } from './context.js';
export type { JoplinMcpContext } from './context.js';

export { createJoplinMcpServer } from './server.js';
export type { CreateServerOptions, CreatedServer } from './server.js';

export { JoplinClient, JoplinApiError } from './client/index.js';
export type {
  JoplinNote,
  JoplinNotebook,
  JoplinTag,
  JoplinSearchResult,
  JoplinApiOptions,
} from './client/index.js';

// Direct execution: delegate to CLI
if (require.main === module) {
  import('./cli.js');
}
