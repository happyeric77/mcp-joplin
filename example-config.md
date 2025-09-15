# Example MCP Client Configuration

## Claude Desktop Configuration

Create or edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "joplin": {
      "command": "npx",
      "args": [
        "/ABSOLUTE/PATH/TO/mcp-joplin"
        "--port",
        "41184",
        "--token",
        "YOUR_JOPLIN"
      ]
    }
  }
}
```

## Opencode Configuration

Create or edit `~/.config/opencode/config.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "joplin": {
      "type": "local",
      "enabled": true,
      "command": [
        "npx",
        "/ABSOLUTE/PATH/TO/mcp-joplin",
        "--port",
        "41184",
        "--token",
        "YOUR_JOPLIN"
      ]
    }
  }
}
```

## Perplexity Configuration

For Perplexity or other MCP clients, follow their specific configuration format but use similar command structure:

```json
{
  "args": [
    "/ABSOLUTE/PATH/TO/mcp-joplin",
    "--port",
    "41184",
    "--token",
    "YOUR_JOPLIN"
  ],
  "command": "npx",
  "useBuiltInNode": true
}
```

## Getting Joplin API Token

1. Open Joplin Desktop
2. Go to **Tools → Options → Web Clipper**
3. Enable **Web Clipper Service**
4. Copy the **token** shown in the interface
5. Note the **port** number (usually 41184)

## Testing the Connection

Before configuring your MCP client, test the server manually:

```bash
# Test basic connection
npm start

# Test with specific parameters
npm start -- --port 41184 --token YOUR_TOKEN

# Check help
npm start -- --help
```

