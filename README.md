# MCP Joplin Server

A Model Context Protocol (MCP) server that integrates with Joplin notes, allowing AI clients (like Perplexity) to access and manipulate your notebooks and notes through Joplin's Web Clipper API.

## Features

- 🔍 **Search Functionality**: Search notes and notebooks page-by-page
- 📖 **Content Reading**: Get complete content of specific notes
- 🧭 **Notebook Navigation**: Navigate root notebooks and direct child notebooks
- 📝 **Creation Features**: Create new notes and notebooks
- ✏️ **Update/Edit Features**: Update note content, append to notes, and rename notebooks
- 🗑️ **Deletion Features**: Delete notes and notebooks (supports trash or permanent deletion)
- 🔄 **Move Functionality**: Move notes to different notebooks
- 📋 **Paginated Lists**: List notes with safe cursor-style pagination; no default full dumps
- 🖼️ **Image Support**: List images attached to notes, retrieve image content, and attach local images to notes

## Requirements

1. **Joplin Desktop** - Ensure it's installed and running
2. **Node.js 20** - Required to run the MCP server
3. **Web Clipper Enabled** - Enable Web Clipper service in Joplin

## Installation & Setup

### 1. Enable Joplin Web Clipper

1. Open Joplin desktop application
2. Go to **Tools → Options → Web Clipper**
3. Check **Enable Web Clipper Service**
4. Note the **port number** displayed (usually 41184)
5. **Copy the API Token** (if authentication is required)

### 2. Install MCP Joplin Server

```bash
# Clone or download this project
cd mcp-joplin

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

### 3. Test Execution

```bash
# Run directly (will auto-detect Joplin service)
npm start

# Or specify port
npm start -- --port 41184

# Or specify token (if needed)
npm start -- --token YOUR_API_TOKEN

# Or specify a full Joplin API base URL instead of auto-discovered localhost port
npm start -- --base-url http://localhost:41184

# View help
npm start -- --help
```

### 4. Using npx

```bash
# Global installation (recommended)
npm install -g .

# Then use anywhere
npx mcp-joplin

# Or run locally
npx . --port 41184

# Or connect to a specific Joplin API base URL
npx . --base-url http://localhost:41184
```

## MCP Client Configuration

### Configure Perplexity or other MCP clients

Add the following configuration to your MCP client configuration file:

#### 🔐 Configuration (API Token Required)

This MCP server requires a Joplin API token to function properly:

```json
{
  "mcpServers": {
    "joplin": {
      "command": "npx",
      "args": [
        "/ABSOLUTE/PATH/TO/mcp-joplin",
        "--port",
        "41184",
        "--token",
        "YOUR_API_TOKEN"
      ]
    }
  }
}
```

> 💡 **Important**: The API token is required for this MCP server to work properly.
> Use `--base-url` instead of `--port` when the Joplin API is exposed at a specific URL, for example through a tunnel or non-local host. `--base-url` can also be set with `JOPLIN_BASE_URL`.

### Claude Desktop Configuration Example

#### Claude Desktop Configuration

In `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "joplin": {
      "command": "npx",
      "args": [
        "/Users/yourusername/path/to/mcp-joplin",
        "--token",
        "YOUR_API_TOKEN"
      ]
    }
  }
}
```

## Available MCP Tools

### Pagination rules

The collection tools `search_notes`, `search_notebooks`, and `list_notes` use cursor-style pagination:

- `first` is optional and defaults to a safe page size; it never means "all results".
- `first` is capped at `100`.
- `after` is an opaque cursor returned as `endCursor` by the previous page.
- Responses include `pageInfo` metadata: `returnedCount`, `pageSize`, `hasNextPage`, and `endCursor` when another page exists.
- Cursors are scoped to the original request parameters. Use `endCursor` only with the same tool arguments.
- If `hasNextPage` is `true`, the response is incomplete. Continue with `after=endCursor` before concluding coverage.

### 1. get_note_content

Get the complete content of a specific note

```
Parameters:
- noteId (string) - The ID of the note to retrieve
- includeImages (boolean, optional) - Whether to list attached image metadata (default: true)
```

### 2. search_notes

Search one paginated page of notes

```
Parameters:
- query (string) - Search keywords
- first (number, optional) - Page size (default: 20, max: 100); this never means all results
- after (string, optional) - Opaque cursor from the previous page endCursor
```

### 3. search_notebooks

Search one paginated page of notebooks

```
Parameters:
- query (string) - Search keywords using Joplin folder search syntax. Use `*` for wildcard/prefix matches, e.g. `archive*` matches `archive-250124`; plain `archive` only matches a notebook titled exactly `archive`.
- first (number, optional) - Page size (default: 20, max: 100); this never means all results
- after (string, optional) - Opaque cursor from the previous page endCursor
```

### 4. list_root_notebooks

List top-level/root notebooks from the Joplin folder tree

```
Parameters: None
```

### 5. list_notes

List one paginated page of notes in a specific notebook

```
Parameters:
- notebookId (string) - The ID of the notebook
- first (number, optional) - Page size (default: 50, max: 100); this never means all results
- after (string, optional) - Opaque cursor from the previous page endCursor
```

### 5.1. list_sub_notebooks

List direct child notebooks within a specific notebook. This uses Joplin's folder tree hierarchy and is not cursor-paginated.

```
Parameters:
- parentNotebookId (string) - The ID of the parent notebook
```

### 6. create_note

Create a new note

```
Parameters:
- title (string) - Note title
- body (string) - Note content (Markdown format)
- notebookId (string, optional) - Target notebook ID
```

### 7. create_notebook

Create a new notebook

```
Parameters:
- title (string) - Notebook title
- parentId (string, optional) - Parent notebook ID (for sub-notebooks)
```

### 8. delete_note

Delete a note

```
Parameters:
- noteId (string) - ID of the note to delete
- permanent (boolean, optional) - Whether to permanently delete (default: false, moves to trash)
```

### 9. delete_notebook

Delete a notebook

```
Parameters:
- notebookId (string) - ID of the notebook to delete
- permanent (boolean, optional) - Whether to permanently delete (default: false, moves to trash)
```

### 10. move_note

Move a note to a different notebook

```
Parameters:
- noteId (string) - ID of the note to move
- targetNotebookId (string) - Target notebook ID
```

### 11. update_note

Update an existing note title and/or body

```
Parameters:
- noteId (string) - ID of the note to update
- title (string, optional) - New note title
- body (string, optional) - New note content (full replacement, not a patch)
```

Notes:

- At least one of `title` or `body` must be provided
- Use this when replacing note content or renaming a note

### 12. append_to_note

Append content to the end of an existing note

```
Parameters:
- noteId (string) - ID of the note to append to
- content (string) - Content to append
- separator (string, optional) - Separator inserted before appended content (default: "\n\n")
```

Notes:

- Use this for logs, meeting notes, supplementary info, or test results
- Prefer this over `update_note` when the intent is to add content without replacing the existing body

### 13. update_notebook

Update an existing notebook title

```
Parameters:
- notebookId (string) - ID of the notebook to update
- title (string) - New notebook title
```

### 14. list_note_images

List image resources attached to a specific note. Supports both Joplin API resource index and note body markdown image reference parsing.

```
Parameters:
- noteId (string) - The ID of the note whose images to list
```

Returns a JSON array with image id, title, mime type, file size, and markdown reference.

### 15. get_note_image

Retrieve an image resource from Joplin by resource ID and return the image content directly.

```
Parameters:
- resourceId (string) - The ID of the image resource to retrieve
```

Supported image types: PNG, JPEG, GIF, WebP.

### 16. attach_image_to_note

Attach a local image file to a Joplin note and insert a markdown image reference into the note body.

```
Parameters:
- noteId (string) - The ID of the note to attach the image to
- filePath (string) - Absolute path to the local image file to attach
- altText (string, optional) - Alt text for the markdown image
- title (string, optional) - Title to use for the Joplin image resource (default: filename)
- position ('end' | 'start', optional) - Where to insert the markdown image (default: end)
- separator (string, optional) - Separator between note body and inserted markdown (default: "\\n\\n")
```

Supported image types: PNG, JPEG, GIF, WebP. Max file size: 3MB. SVG is not supported.

## Editing Semantics

- Use `update_note` to replace a note's title and/or body
- Use `append_to_note` to add content to the end of a note while preserving existing content
- Use `move_note` to change which notebook a note belongs to
- Use `update_notebook` to rename a notebook

## Usage Examples

### Conversation examples in AI clients:

```
You: "Search for notes containing 'Python'"
AI: Using search_notes tool to search for relevant notes...
AI: If pageInfo.hasNextPage is true, continue with after=endCursor before summarizing all matches.

You: "Create a new notebook called 'Learning Plan'"
AI: Using create_notebook tool to create a new notebook...

You: "Create a note about JavaScript in the Learning Plan notebook"
AI: Using list_root_notebooks and list_sub_notebooks to navigate to the notebook ID, then using create_note to create the note...

You: "Show the complete content of a specific note"
AI: Using get_note_content tool to retrieve note content...

You: "Update the title of note abc123 to Weekly Review"
AI: Using update_note tool to rename the note...

You: "Append these test results to note abc123"
AI: Using append_to_note tool to add the new content to the end of the note...

You: "Rename the notebook 'Recipes' to 'Cooking'"
AI: Using update_notebook tool to rename the notebook...

You: "List images attached to note abc123"
AI: Using list_note_images tool to retrieve image metadata...

You: "Show me the image with resource ID def456"
AI: Using get_note_image tool to retrieve and display the image...

You: "Attach this screenshot to note abc123"
AI: Using attach_image_to_note tool to upload the image and embed it in the note...
```

## Troubleshooting

### Connection Issues

1. **Confirm Joplin is running**
   - Joplin desktop application must remain open

2. **Check Web Clipper settings**
   - Ensure Web Clipper service is enabled
   - Check port settings (default 41184)

3. **View error messages**
   ```bash
   # Use verbose mode to see errors
   DEBUG=* npm start
   ```

### Common Errors

- **"Joplin Web Clipper service not found"**: Ensure Joplin is running and Web Clipper is enabled
- **"Connection refused"**: Check if port settings are correct
- **"Unauthorized" or "403 Forbidden"**: API token is required (see instructions below)

### 🔑 API Token Required

**API Token is required for this MCP server to function properly.**

### Getting an API Token

1. In Joplin go to **Tools → Options → Web Clipper**
2. Copy the displayed **token**
3. Add `--token YOUR_TOKEN` to the startup command

## Development

```bash
# Run in development mode
npm run dev

# Compile
npm run build

# Prepare for publishing
npm run prepublishOnly
```

## Technical Architecture

- **Language**: TypeScript/Node.js
- **MCP SDK**: @modelcontextprotocol/sdk
- **HTTP Client**: axios
- **CLI**: commander
- **API**: Joplin Web Clipper API

### Technical Details

- **Pagination Handling**: Collection tools request one Joplin page at a time using native `page` / `limit` parameters. They expose MCP-friendly `first` / `after` inputs and opaque cursors.
- **No Full-Dump Defaults**: The server does not fetch every note or notebook by default, and it does not expose legacy full-dump resources.
- **Notebook Search**: Uses Joplin's `/search` endpoint with `type=folder` and page-based pagination.
- **Notebook Navigation**: Uses Joplin's folder tree for `list_root_notebooks` and direct-child `list_sub_notebooks` navigation; tree navigation is not fake-paginated.
- **Error Handling**: Complete error handling mechanism, including Joplin API errors, invalid pagination cursors, and network connection errors
- **Auto-detection**: Supports automatic detection of Joplin Web Clipper port (41184-41194)

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!

## Support

If you encounter problems, please:

1. Check if Joplin Web Clipper is running normally
2. Review error messages and logs
3. Submit an Issue with detailed error information
