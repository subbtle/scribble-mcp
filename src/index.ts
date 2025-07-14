#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

// Read credentials from environment variables (set by Desktop Extension)
const SCRIBBLE_USERNAME = process.env.SCRIBBLE_USERNAME
const SCRIBBLE_ACCESS_CODE = process.env.SCRIBBLE_ACCESS_CODE

if (!SCRIBBLE_USERNAME || !SCRIBBLE_ACCESS_CODE) {
  console.error(
    "Missing required environment variables: SCRIBBLE_USERNAME and SCRIBBLE_ACCESS_CODE"
  )
  process.exit(1)
}

const server = new Server(
  {
    name: "scribble-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "getLatestNote",
        description: "Get the latest handwritten note for a user",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "getLatestNote") {
    try {
      const response = await fetch(
        "https://scribble-production-3976.up.railway.app/api/v1/notes/latest",
        {
          method: "GET",
          headers: {
            "x-username": SCRIBBLE_USERNAME,
            "x-access-code": SCRIBBLE_ACCESS_CODE,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      if (!data.imageUrl) {
        return {
          content: [
            {
              type: "text",
              text: "No image found for latest note",
            },
          ],
          isError: false,
        }
      }

      // Fetch the actual image data
      const imageResponse = await fetch(data.imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      }
      const imageBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString("base64")

      return {
        content: [
          {
            type: "image",
            data: base64Image,
            mimeType: "image/png",
          },
        ],
        isError: false,
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching latest note: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      }
    }
  }

  throw new Error("Tool not found")
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("Scribble MCP server running")
}

main().catch(console.error)
