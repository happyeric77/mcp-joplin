# MCP Joplin Server

A Model Context Protocol (MCP) server that integrates with Joplin notes, allowing AI clients (like Perplexity) to access and manipulate your notebooks and notes through Joplin's Web Clipper API.

## Features

- 🔍 **Search Functionality**: Search notes and notebooks
- 📖 **Content Reading**: Get complete content of specific notes
- 📝 **Creation Features**: Create new notes and notebooks
- 🗑️ **Deletion Features**: Delete notes and notebooks (supports trash or permanent deletion)
- 🔄 **Move Functionality**: Move notes to different notebooks
- 📋 **List Functionality**: List all notebooks and notes within specific notebooks

## Requirements

1. **Joplin Desktop** - Ensure it's installed and running
2. **Node.js 18+** - Required to run the MCP server
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

### 1. get_note_content
Get the complete content of a specific note
```
Parameters: noteId (string) - The ID of the note
```

### 2. search_notes
Search for notes
```
Parameters: 
- query (string) - Search keywords
- limit (number, optional) - Result limit (default: 20)
```

### 3. search_notebooks
Search for notebooks
```
Parameters: query (string) - Search keywords
```

### 4. list_notebooks
List all notebooks
```
Parameters: None
```

### 5. list_notes
List notes in a specific notebook
```
Parameters:
- notebookId (string) - The ID of the notebook
- limit (number, optional) - Result limit (default: 50)
```

### 5.1. list_sub_notebooks
List sub-notebooks within a specific notebook
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

### 11. list_sub_notebooks
List sub-notebooks within a specific notebook
```
Parameters:
- parentNotebookId (string) - The ID of the parent notebook
```

### 12. scan_unchecked_items
Scan notebooks and sub-notebooks for uncompleted todo items (- [ ])
```
Parameters:
- notebookId (string) - ID of the notebook to scan
- includeSubNotebooks (boolean, optional) - Whether to recursively scan sub-notebooks (default: true)
```

## Usage Examples

### Conversation examples in AI clients:

```
You: "Search for notes containing 'Python'"
AI: Using search_notes tool to search for relevant notes...

You: "Create a new notebook called 'Learning Plan'"
AI: Using create_notebook tool to create a new notebook...

You: "Create a note about JavaScript in the Learning Plan notebook"
AI: Using list_notebooks to find the notebook ID, then using create_note to create the note...

You: "Show the complete content of a specific note"
AI: Using get_note_content tool to retrieve note content...

You: "Scan my project notebook for all uncompleted todo items"
AI: Using scan_unchecked_items tool to scan all sub-notebooks...
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

- **Notebook Search**: Due to limitations in Joplin's search API for folder searches, we use client-side filtering to implement notebook search functionality
- **Pagination Handling**: Automatically handles Joplin API's pagination mechanism (default 100 items per page), ensuring complete notebook and note lists are retrieved, solving the issue of incomplete sub-notebook display
- **Error Handling**: Complete error handling mechanism, including Joplin API errors and network connection errors
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