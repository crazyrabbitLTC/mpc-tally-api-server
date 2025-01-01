import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type Tool,
  type TextContent
} from "@modelcontextprotocol/sdk/types.js";
import { TallyService } from './services/tally.service.js';

export class TallyServer {
  private server: Server;
  private service: TallyService;

  constructor(apiKey: string) {
    // Initialize service
    this.service = new TallyService({ apiKey });

    // Create server instance
    this.server = new Server(
      {
        name: "tally-api",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "list-daos",
          description: "List DAOs on Tally sorted by number of token holders and activity",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of DAOs to return (default: 20, max: 50)",
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination",
              },
            },
          },
        },
      ];

      return { tools };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      if (name === "list-daos") {
        try {
          const data = await this.service.listDAOs({
            limit: typeof args.limit === 'number' ? args.limit : undefined,
            afterCursor: typeof args.afterCursor === 'string' ? args.afterCursor : undefined,
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: TallyService.formatDAOList(data.organizations.nodes)
            }
          ];

          return { content };
        } catch (error) {
          throw new Error(`Error fetching DAOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Tally MCP Server running on stdio");
  }
} 