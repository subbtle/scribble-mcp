# scribble-mcp

This is part 2/2 of a prototype that connects iPad handwriting to chatbots (like Claude) via MCP. This repo is the MCP server that exposes `getLatestNote(userName, accessCode) : Image` that AI chatbots can call via MCP.

# Development

Package the extension in the `dxt` format:

```
npm run package
```
