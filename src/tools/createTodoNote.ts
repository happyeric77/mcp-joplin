import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinNote } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';
import {
  formatTimestamp,
  formatTodoStatus,
  parseDateToMs,
} from './todoUtils.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

const paramsSchema = {
  title: z.string().describe('The title of the new todo note'),
  body: z
    .string()
    .optional()
    .describe('The content of the new todo note (Markdown format)'),
  notebookId: z
    .string()
    .optional()
    .describe('The ID of the notebook to create the todo note in (optional)'),
  dueAt: z
    .string()
    .optional()
    .describe(
      'Optional due date/time as an ISO string or millisecond timestamp',
    ),
  completedAt: z
    .string()
    .optional()
    .describe(
      'Optional completion date/time as an ISO string or millisecond timestamp',
    ),
};

export const registerCreateTodoNote = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.tool(
    'create_todo_note',
    'Create a new native Joplin todo note',
    paramsSchema,
    async ({ title, body, notebookId, dueAt, completedAt }) => {
      try {
        const todo_due = dueAt ? parseDateToMs(dueAt) : 0;
        const todo_completed = completedAt ? parseDateToMs(completedAt) : 0;
        const noteData: Partial<JoplinNote> = {
          title,
          body: body ?? '',
          is_todo: 1,
          todo_due,
          todo_completed,
        };

        if (notebookId) {
          noteData.parent_id = notebookId;
        }

        const note = await context.client.createNote(noteData);

        const responseText = [
          'Todo note created successfully!',
          '',
          `**Title:** ${note.title}`,
          `**ID:** ${note.id}`,
          `**Status:** ${formatTodoStatus({
            is_todo: 1,
            todo_completed,
          })}`,
          `**Due:** ${formatTimestamp(todo_due)}`,
          `**Completed:** ${formatTimestamp(todo_completed)}`,
          `**Created:** ${new Date(note.created_time).toLocaleString()}`,
        ].join('\n');

        return textResponse(responseText);
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
