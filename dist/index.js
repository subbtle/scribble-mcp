#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
const server = new Server({
    name: "scribble-mcp",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "getLatestNote",
                description: "Get the latest handwritten note for a user",
                inputSchema: {
                    type: "object",
                    properties: {
                        userName: {
                            type: "string",
                            description: "The username to get the latest note for",
                        },
                        accessCode: {
                            type: "string",
                            description: "The user's access code for authentication",
                        },
                    },
                    required: ["userName", "accessCode"],
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "getLatestNote") {
        const { userName, accessCode } = request.params.arguments;
        try {
            const response = await fetch("http://localhost:3001/api/v1/notes/latest", {
                method: "GET",
                headers: {
                    "x-username": userName,
                    "x-access-code": accessCode,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (!data.imageUrl) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "No image found for latest note",
                        },
                    ],
                    isError: false,
                };
            }
            return {
                content: [
                    {
                        type: "image",
                        data: data.imageUrl,
                        mimeType: "image/png",
                    },
                ],
                isError: false,
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching latest note: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }
    throw new Error("Tool not found");
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Scribble MCP server running");
}
main().catch(console.error);
