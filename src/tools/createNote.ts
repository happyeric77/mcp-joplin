import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { JoplinMcpContext } from '../context.js';
import { exceptionResponse, textResponse } from './toolResponse.js';

const paramsSchema = {
  title: z.string().describe('The title of the new note'),
  body: z.string().describe('The content of the new note (Markdown format)'),
  notebookId: z
    .string()
    .optional()
    .describe('The ID of the notebook to create the note in (optional)'),
};

export const registerCreateNote = (
  server: McpServer,
  context: JoplinMcpContext,
): void => {
  server.registerTool(
    'create_note',
    {
      description: 'Create a new note in Joplin',
      inputSchema: paramsSchema,
    },
    async ({ title, body, notebookId }) => {
      try {
        const noteData: Record<string, unknown> = { title, body };
        if (notebookId) {
          noteData.parent_id = notebookId;
        }

        const note = await context.client.createNote(noteData);

        return textResponse(
          `Note created successfully!\n\n**Title:** ${note.title}\n**ID:** ${note.id}\n**Created:** ${new Date(note.created_time).toLocaleString()}`,
        );
      } catch (error) {
        return exceptionResponse(error);
      }
    },
  );
};
