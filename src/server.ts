import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { version } from '../package.json';
import { JoplinMcpContext } from './context.js';
import { JoplinApiError, JoplinNote } from './joplin-client.js';

export interface CreateServerOptions {
  context: JoplinMcpContext;
}

export interface CreatedServer {
  server: Server;
  context: JoplinMcpContext;
}

export function createJoplinMcpServer(
  options: CreateServerOptions
): CreatedServer {
  const { context } = options;
  const { client: joplinClient } = context;

  const server = new Server(
    {
      name: 'mcp-joplin',
      version: version,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // ── Tool list ──────────────────────────────────────────────────────

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_note_content',
          description: 'Get the content of a specific note by ID',
          inputSchema: {
            type: 'object',
            properties: {
              noteId: {
                type: 'string',
                description: 'The ID of the note to retrieve',
              },
            },
            required: ['noteId'],
          },
        },
        {
          name: 'search_notes',
          description: 'Search for notes by query string',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query string',
              },
              limit: {
                type: 'number',
                description:
                  'Maximum number of results to return (default: 20)',
                default: 20,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'search_notebooks',
          description: 'Search for notebooks by name',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query string for notebook names',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'list_notebooks',
          description: 'List all notebooks in Joplin',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_notes',
          description: 'List notes in a specific notebook',
          inputSchema: {
            type: 'object',
            properties: {
              notebookId: {
                type: 'string',
                description: 'The ID of the notebook to list notes from',
              },
              limit: {
                type: 'number',
                description:
                  'Maximum number of results to return (default: 50)',
                default: 50,
              },
            },
            required: ['notebookId'],
          },
        },
        {
          name: 'list_sub_notebooks',
          description:
            'List sub-notebooks (child folders) in a specific notebook',
          inputSchema: {
            type: 'object',
            properties: {
              parentNotebookId: {
                type: 'string',
                description:
                  'The ID of the parent notebook to list sub-notebooks from',
              },
            },
            required: ['parentNotebookId'],
          },
        },
        {
          name: 'create_note',
          description: 'Create a new note in Joplin',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'The title of the new note',
              },
              body: {
                type: 'string',
                description: 'The content of the new note (Markdown format)',
              },
              notebookId: {
                type: 'string',
                description:
                  'The ID of the notebook to create the note in (optional)',
              },
            },
            required: ['title', 'body'],
          },
        },
        {
          name: 'create_notebook',
          description: 'Create a new notebook in Joplin',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'The title of the new notebook',
              },
              parentId: {
                type: 'string',
                description:
                  'The ID of the parent notebook (optional, for sub-notebooks)',
              },
            },
            required: ['title'],
          },
        },
        {
          name: 'delete_note',
          description: 'Delete a note from Joplin',
          inputSchema: {
            type: 'object',
            properties: {
              noteId: {
                type: 'string',
                description: 'The ID of the note to delete',
              },
              permanent: {
                type: 'boolean',
                description:
                  'Whether to permanently delete the note (default: false, moves to trash)',
                default: false,
              },
            },
            required: ['noteId'],
          },
        },
        {
          name: 'delete_notebook',
          description: 'Delete a notebook from Joplin',
          inputSchema: {
            type: 'object',
            properties: {
              notebookId: {
                type: 'string',
                description: 'The ID of the notebook to delete',
              },
              permanent: {
                type: 'boolean',
                description:
                  'Whether to permanently delete the notebook (default: false, moves to trash)',
                default: false,
              },
            },
            required: ['notebookId'],
          },
        },
        {
          name: 'move_note',
          description: 'Move a note to a different notebook',
          inputSchema: {
            type: 'object',
            properties: {
              noteId: {
                type: 'string',
                description: 'The ID of the note to move',
              },
              targetNotebookId: {
                type: 'string',
                description: 'The ID of the target notebook',
              },
            },
            required: ['noteId', 'targetNotebookId'],
          },
        },
        {
          name: 'scan_unchecked_items',
          description:
            'Scan a notebook and its sub-notebooks for unchecked items: both markdown todo items (- [ ]) and uncompleted Joplin todo notes',
          inputSchema: {
            type: 'object',
            properties: {
              notebook_id: {
                type: 'string',
                description: 'The ID of the notebook to scan',
              },
              include_sub_notebooks: {
                type: 'boolean',
                description:
                  'Whether to include sub-notebooks in the scan (default: true)',
                default: true,
              },
            },
            required: ['notebook_id'],
          },
        },
      ],
    };
  });

  // ── Tool dispatch ──────────────────────────────────────────────────

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;

    try {
      const typedArgs = args as Record<string, any>;

      switch (name) {
        case 'get_note_content':
          return await getNoteContent(typedArgs.noteId as string);

        case 'search_notes':
          return await searchNotes(
            typedArgs.query as string,
            typedArgs.limit as number
          );

        case 'search_notebooks':
          return await searchNotebooks(typedArgs.query as string);

        case 'list_notebooks':
          return await listNotebooks();

        case 'list_notes':
          return await listNotes(
            typedArgs.notebookId as string,
            typedArgs.limit as number
          );

        case 'list_sub_notebooks':
          return await listSubNotebooks(typedArgs.parentNotebookId as string);

        case 'create_note':
          return await createNote(
            typedArgs.title as string,
            typedArgs.body as string,
            typedArgs.notebookId as string
          );

        case 'create_notebook':
          return await createNotebook(
            typedArgs.title as string,
            typedArgs.parentId as string
          );

        case 'delete_note':
          return await deleteNote(
            typedArgs.noteId as string,
            typedArgs.permanent as boolean
          );

        case 'delete_notebook':
          return await deleteNotebook(
            typedArgs.notebookId as string,
            typedArgs.permanent as boolean
          );

        case 'move_note':
          return await moveNote(
            typedArgs.noteId as string,
            typedArgs.targetNotebookId as string
          );

        case 'scan_unchecked_items':
          return await scanUncheckedItems(
            typedArgs.notebook_id as string,
            typedArgs.include_sub_notebooks as boolean
          );

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof JoplinApiError
          ? `Joplin API Error: ${error.message}`
          : `Error: ${error instanceof Error ? error.message : String(error)}`;

      return {
        content: [
          {
            type: 'text',
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
  });

  // ── Resources ──────────────────────────────────────────────────────

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'joplin://notebooks',
          name: 'All Notebooks',
          description: 'List of all notebooks in Joplin',
          mimeType: 'application/json',
        },
        {
          uri: 'joplin://notes',
          name: 'All Notes',
          description: 'List of all notes in Joplin',
          mimeType: 'application/json',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async request => {
    const { uri } = request.params;

    switch (uri) {
      case 'joplin://notebooks': {
        const notebooks = await joplinClient.getNotebooks();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(notebooks, null, 2),
            },
          ],
        };
      }

      case 'joplin://notes': {
        const notes = await joplinClient.getNotes();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(notes, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  // ── Tool implementations ───────────────────────────────────────────

  async function getNoteContent(noteId: string): Promise<CallToolResult> {
    const note = await joplinClient.getNote(noteId);
    return {
      content: [{ type: 'text', text: `# ${note.title}\n\n${note.body}` }],
    };
  }

  async function searchNotes(
    query: string,
    limit: number = 20
  ): Promise<CallToolResult> {
    const results = await joplinClient.search(
      query,
      'note',
      'id,title,body,parent_id,updated_time'
    );
    const notes = results.items.slice(0, limit);

    const formattedResults = notes
      .map(
        (note: any) =>
          `**${note.title}** (ID: ${note.id})\nUpdated: ${new Date(note.updated_time).toLocaleString()}\nPreview: ${note.body?.substring(0, 100)}...`
      )
      .join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: formattedResults || 'No notes found matching your query.',
        },
      ],
    };
  }

  async function searchNotebooks(query: string): Promise<CallToolResult> {
    const allNotebooks = await joplinClient.getNotebooks();
    const queryLower = query.toLowerCase();

    const matchingNotebooks = allNotebooks.filter(notebook =>
      notebook.title.toLowerCase().includes(queryLower)
    );

    const formattedResults = matchingNotebooks
      .map(
        (notebook: any) =>
          `**${notebook.title}** (ID: ${notebook.id})\nCreated: ${new Date(notebook.created_time).toLocaleString()}`
      )
      .join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: formattedResults || 'No notebooks found matching your query.',
        },
      ],
    };
  }

  async function listNotebooks(): Promise<CallToolResult> {
    const notebooks = await joplinClient.getNotebooks();

    const formattedList = notebooks
      .map(
        notebook =>
          `**${notebook.title}** (ID: ${notebook.id})\nCreated: ${new Date(notebook.created_time).toLocaleString()}`
      )
      .join('\n\n---\n\n');

    return {
      content: [{ type: 'text', text: formattedList || 'No notebooks found.' }],
    };
  }

  async function listNotes(
    notebookId: string,
    limit: number = 50
  ): Promise<CallToolResult> {
    const results = await joplinClient.getNotesInNotebook(notebookId, {
      fields: 'id,title,updated_time,is_todo,todo_completed',
      limit,
    });

    const formattedList = results.items
      .map((note: any) => {
        const todoStatus = note.is_todo
          ? note.todo_completed
            ? ' ✅'
            : ' ☐'
          : '';
        return `**${note.title}**${todoStatus} (ID: ${note.id})\nUpdated: ${new Date(note.updated_time).toLocaleString()}`;
      })
      .join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: formattedList || 'No notes found in this notebook.',
        },
      ],
    };
  }

  async function listSubNotebooks(
    parentNotebookId: string
  ): Promise<CallToolResult> {
    const allNotebooks = await joplinClient.getNotebooks();
    const subNotebooks = allNotebooks.filter(
      notebook => notebook.parent_id === parentNotebookId
    );

    const formattedList = subNotebooks
      .map(
        notebook =>
          `**${notebook.title}** (ID: ${notebook.id})\nCreated: ${new Date(notebook.created_time).toLocaleString()}`
      )
      .join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: formattedList || 'No sub-notebooks found in this notebook.',
        },
      ],
    };
  }

  async function createNote(
    title: string,
    body: string,
    notebookId?: string
  ): Promise<CallToolResult> {
    const noteData: any = { title, body };
    if (notebookId) {
      noteData.parent_id = notebookId;
    }

    const note = await joplinClient.createNote(noteData);

    return {
      content: [
        {
          type: 'text',
          text: `Note created successfully!\n\n**Title:** ${note.title}\n**ID:** ${note.id}\n**Created:** ${new Date(note.created_time).toLocaleString()}`,
        },
      ],
    };
  }

  async function createNotebook(
    title: string,
    parentId?: string
  ): Promise<CallToolResult> {
    const notebookData: any = { title };
    if (parentId) {
      notebookData.parent_id = parentId;
    }

    const notebook = await joplinClient.createNotebook(notebookData);

    return {
      content: [
        {
          type: 'text',
          text: `Notebook created successfully!\n\n**Title:** ${notebook.title}\n**ID:** ${notebook.id}\n**Created:** ${new Date(notebook.created_time).toLocaleString()}`,
        },
      ],
    };
  }

  async function deleteNote(
    noteId: string,
    permanent: boolean = false
  ): Promise<CallToolResult> {
    await joplinClient.deleteNote(noteId, permanent);

    const action = permanent ? 'permanently deleted' : 'moved to trash';
    return {
      content: [{ type: 'text', text: `Note ${action} successfully.` }],
    };
  }

  async function deleteNotebook(
    notebookId: string,
    permanent: boolean = false
  ): Promise<CallToolResult> {
    await joplinClient.deleteNotebook(notebookId, permanent);

    const action = permanent ? 'permanently deleted' : 'moved to trash';
    return {
      content: [{ type: 'text', text: `Notebook ${action} successfully.` }],
    };
  }

  async function moveNote(
    noteId: string,
    targetNotebookId: string
  ): Promise<CallToolResult> {
    await joplinClient.updateNote(noteId, { parent_id: targetNotebookId });

    return {
      content: [
        {
          type: 'text',
          text: `Note moved successfully to notebook ${targetNotebookId}.`,
        },
      ],
    };
  }

  async function scanUncheckedItems(
    notebookId: string,
    includeSubNotebooks: boolean = true
  ): Promise<CallToolResult> {
    const allNotebooks = await joplinClient.getNotebooks();
    const targetNotebook = allNotebooks.find(nb => nb.id === notebookId);

    if (!targetNotebook) {
      return {
        content: [
          {
            type: 'text',
            text: `Notebook with ID ${notebookId} not found.`,
          },
        ],
        isError: true,
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
      const subNotebooks = getSubNotebooksRecursively(allNotebooks, notebookId);
      notebooksToScan.push(...subNotebooks);
    }

    // Get all notes with pagination support
    const allNotesResult = await joplinClient.getNotes();
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

        const fullNote = await joplinClient.getNote(note.id, 'title,body');
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
            type: 'text',
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
      content: [{ type: 'text', text: summary + details }],
    };
  }

  function getSubNotebooksRecursively(
    allNotebooks: any[],
    parentId: string
  ): any[] {
    const subNotebooks: any[] = [];
    const directChildren = allNotebooks.filter(nb => nb.parent_id === parentId);

    for (const child of directChildren) {
      subNotebooks.push(child);
      const grandChildren = getSubNotebooksRecursively(allNotebooks, child.id);
      subNotebooks.push(...grandChildren);
    }

    return subNotebooks;
  }

  return { server, context };
}
