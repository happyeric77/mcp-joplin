import { z } from 'zod';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { JoplinApiError, JoplinNote, JoplinNotebook } from '../client/index.js';
import type { JoplinMcpContext } from '../context.js';

export const registerScanUncheckedItems = (
  server: McpServer,
  context: JoplinMcpContext
): void => {
  server.tool(
    'scan_unchecked_items',
    'Scan a notebook and its sub-notebooks for unchecked items: both markdown todo items (- [ ]) and uncompleted Joplin todo notes',
    {
      notebookId: z.string().describe('The ID of the notebook to scan'),
      includeSubNotebooks: z
        .boolean()
        .default(true)
        .describe(
          'Whether to include sub-notebooks in the scan (default: true)'
        ),
    },
    async ({ notebookId, includeSubNotebooks }) => {
      try {
        const allNotebooks = await context.client.getNotebooks();
        const targetNotebook = allNotebooks.find(nb => nb.id === notebookId);

        if (!targetNotebook) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Notebook with ID ${notebookId} not found.`,
              },
            ],
          };
        }

        const uncheckedMarkdownItems: Array<{
          notebookTitle: string;
          noteTitle: string;
          noteId: string;
          uncheckedItems: string[];
        }> = [];

        const uncompletedTodos: Array<{
          notebookTitle: string;
          noteTitle: string;
          noteId: string;
          updatedTime: string;
        }> = [];

        // Get notebooks to scan
        const notebooksToScan = [targetNotebook];
        if (includeSubNotebooks) {
          const subNotebooks = getSubNotebooksRecursively(
            allNotebooks,
            notebookId
          );
          notebooksToScan.push(...subNotebooks);
        }

        // Get all notes with pagination support
        const allNotesResult = await context.client.getNotes();
        const allNotes = allNotesResult.items as JoplinNote[];

        for (const notebook of notebooksToScan) {
          const notesInNotebook = allNotes.filter(
            note => note.parent_id === notebook.id
          );

          for (const note of notesInNotebook) {
            if (note.is_todo === 1 && note.todo_completed === 0) {
              uncompletedTodos.push({
                notebookTitle: notebook.title,
                noteTitle: note.title,
                noteId: note.id,
                updatedTime: new Date(note.updated_time).toLocaleString(),
              });
            }

            const fullNote = await context.client.getNote(
              note.id,
              'title,body'
            );
            const uncheckedMatches = fullNote.body.match(/^- \[ \].*/gm);

            if (uncheckedMatches && uncheckedMatches.length > 0) {
              uncheckedMarkdownItems.push({
                notebookTitle: notebook.title,
                noteTitle: fullNote.title,
                noteId: fullNote.id,
                uncheckedItems: uncheckedMatches,
              });
            }
          }
        }

        // Format results
        const totalMarkdownItems = uncheckedMarkdownItems.reduce(
          (total, item) => total + item.uncheckedItems.length,
          0
        );
        const totalTodoNotes = uncompletedTodos.length;

        if (totalMarkdownItems === 0 && totalTodoNotes === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No unchecked items found in "${targetNotebook.title}"${includeSubNotebooks ? ' and its sub-notebooks' : ''}.`,
              },
            ],
          };
        }

        let summary = `Found ${totalMarkdownItems + totalTodoNotes} unchecked items in "${targetNotebook.title}"${includeSubNotebooks ? ' and its sub-notebooks' : ''}:\n`;
        summary += `• ${totalMarkdownItems} markdown todo items (- [ ]) across ${uncheckedMarkdownItems.length} notes\n`;
        summary += `• ${totalTodoNotes} uncompleted Joplin todo notes\n\n`;

        let details = '';

        if (uncompletedTodos.length > 0) {
          details += '## 📝 Uncompleted Todo Notes\n\n';
          details += uncompletedTodos
            .map(todo => {
              return `**📓 ${todo.notebookTitle} → ☐ ${todo.noteTitle}** (ID: ${todo.noteId})\nUpdated: ${todo.updatedTime}`;
            })
            .join('\n\n---\n\n');

          if (uncheckedMarkdownItems.length > 0) {
            details += '\n\n';
          }
        }

        if (uncheckedMarkdownItems.length > 0) {
          details += '## ✓ Unchecked Markdown Items\n\n';
          details += uncheckedMarkdownItems
            .map(item => {
              const itemList = item.uncheckedItems
                .map(unchecked => `  ${unchecked}`)
                .join('\n');
              return `**📓 ${item.notebookTitle} → 📝 ${item.noteTitle}** (ID: ${item.noteId})\n${itemList}`;
            })
            .join('\n\n---\n\n');
        }

        return {
          content: [{ type: 'text' as const, text: summary + details }],
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
                  : `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
};

function getSubNotebooksRecursively(
  allNotebooks: JoplinNotebook[],
  parentId: string
): JoplinNotebook[] {
  const subNotebooks: JoplinNotebook[] = [];
  const directChildren = allNotebooks.filter(nb => nb.parent_id === parentId);

  for (const child of directChildren) {
    subNotebooks.push(child);
    const grandChildren = getSubNotebooksRecursively(allNotebooks, child.id);
    subNotebooks.push(...grandChildren);
  }

  return subNotebooks;
}
