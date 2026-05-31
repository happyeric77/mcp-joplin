import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { formatNoteListItem } from './formatters.js';
import {
  afterParamSchema,
  firstParamSchema,
  formatPaginationMetadata,
  getEndCursor,
  resolvePagination,
} from './pagination.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

const DEFAULT_FIRST = 50;

const paramsSchema = {
  notebookId: z.string().describe('The ID of the notebook to list notes from'),
  first: firstParamSchema(DEFAULT_FIRST),
  after: afterParamSchema,
};

export const registerListNotes = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'list_notes',
    {
      description: 'List one paginated page of notes in a specific notebook',
      inputSchema: paramsSchema,
    },
    async ({ notebookId, first, after }) => {
      try {
        const pagination = resolvePagination({
          first,
          after,
          defaultFirst: DEFAULT_FIRST,
          scope: `list_notes:${notebookId}`,
        });
        const results = await context.client.getNotesInNotebook(notebookId, {
          fields: 'id,title,updated_time,is_todo,todo_due,todo_completed',
          page: pagination.page,
          limit: pagination.limit,
        });

        const endCursor = getEndCursor(pagination, results.has_more);
        const paginationMetadata = formatPaginationMetadata({
          returnedCount: results.items.length,
          pageSize: pagination.limit,
          hasNextPage: results.has_more,
          endCursor,
        });

        const formattedList = results.items
          .map(formatNoteListItem)
          .join('\n\n---\n\n');

        return textResponse(
          `${paginationMetadata}\n\n${formattedList || 'No notes found in this notebook.'}`,
        );
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
