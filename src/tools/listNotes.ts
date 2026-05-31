import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { JoplinApiError } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import {
  afterParamSchema,
  firstParamSchema,
  formatPaginationMetadata,
  formatToolError,
  getEndCursor,
  resolvePagination,
} from './pagination.js';
import {
  formatTimestamp,
  formatTodoIcon,
  formatTodoStatus,
  isTodoNote,
} from './todoUtils.js';

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
          .map((note) => {
            const title = isTodoNote(note)
              ? `${formatTodoIcon(note)} ${note.title}`
              : note.title;
            const lines = [`**${title}** (ID: ${note.id})`];

            if (isTodoNote(note)) {
              lines.push(`Status: ${formatTodoStatus(note)}`);
              if (note.todo_completed > 0) {
                lines.push(
                  `Completed: ${formatTimestamp(note.todo_completed)}`,
                );
              }
              if (note.todo_due > 0) {
                lines.push(`Due: ${formatTimestamp(note.todo_due)}`);
              }
            }

            lines.push(
              `Updated: ${new Date(note.updated_time).toLocaleString()}`,
            );
            return lines.join('\n');
          })
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: `${paginationMetadata}\n\n${formattedList || 'No notes found in this notebook.'}`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text:
                error instanceof JoplinApiError
                  ? `Joplin API Error: ${error.message}`
                  : formatToolError(error),
            },
          ],
        };
      }
    },
  );
};
