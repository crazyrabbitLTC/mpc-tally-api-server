import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type Tool,
  type TextContent
} from "@modelcontextprotocol/sdk/types.js";
import { TallyService, type OrganizationsSortBy } from './services/tally.service.js';

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
          description: "List DAOs on Tally sorted by specified criteria",
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
              sortBy: {
                type: "string",
                enum: ["id", "name", "explore", "popular"],
                description: "How to sort the DAOs (default: popular). 'explore' prioritizes DAOs with live proposals",
              },
            },
          },
        },
        {
          name: "get-dao",
          description: "Get detailed information about a specific DAO",
          inputSchema: {
            type: "object",
            required: ["slug"],
            properties: {
              slug: {
                type: "string",
                description: "The DAO's slug (e.g., 'uniswap' or 'aave')",
              },
            },
          },
        },
        {
          name: "list-delegates",
          description: "List delegates for a specific organization with their metadata",
          inputSchema: {
            type: "object",
            required: ["organizationIdOrSlug"],
            properties: {
              organizationIdOrSlug: {
                type: "string",
                description: "The organization's ID or slug (e.g., 'arbitrum' or 'eip155:1:123')",
              },
              limit: {
                type: "number",
                description: "Maximum number of delegates to return (default: 20, max: 50)",
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination",
              },
              hasVotes: {
                type: "boolean",
                description: "Filter for delegates with votes",
              },
              hasDelegators: {
                type: "boolean",
                description: "Filter for delegates with delegators",
              },
              isSeekingDelegation: {
                type: "boolean",
                description: "Filter for delegates seeking delegation",
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
            sortBy: typeof args.sortBy === 'string' ? args.sortBy as OrganizationsSortBy : undefined,
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

      if (name === "get-dao") {
        try {
          if (typeof args.slug !== 'string') {
            throw new Error('slug must be a string');
          }

          const data = await this.service.getDAO(args.slug);
          const content: TextContent[] = [
            {
              type: "text",
              text: TallyService.formatDAO(data)
            }
          ];

          return { content };
        } catch (error) {
          throw new Error(`Error fetching DAO: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (name === "list-delegates") {
        try {
          if (typeof args.organizationIdOrSlug !== 'string') {
            throw new Error('organizationIdOrSlug must be a string');
          }

          const data = await this.service.listDelegates(
            args.organizationIdOrSlug,
            {
              limit: typeof args.limit === 'number' ? args.limit : undefined,
              afterCursor: typeof args.afterCursor === 'string' ? args.afterCursor : undefined,
              hasVotes: typeof args.hasVotes === 'boolean' ? args.hasVotes : undefined,
              hasDelegators: typeof args.hasDelegators === 'boolean' ? args.hasDelegators : undefined,
              isSeekingDelegation: typeof args.isSeekingDelegation === 'boolean' ? args.isSeekingDelegation : undefined,
            }
          );

          const content: TextContent[] = [
            {
              type: "text",
              text: TallyService.formatDelegatesList(data.delegates)
            }
          ];

          return { content };
        } catch (error) {
          throw new Error(`Error fetching delegates: ${error instanceof Error ? error.message : 'Unknown error'}`);
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