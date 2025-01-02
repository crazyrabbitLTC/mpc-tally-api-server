import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type Tool,
  type TextContent
} from "@modelcontextprotocol/sdk/types.js";
import { TallyService } from './services/tally.service.js';
import type { OrganizationsSortBy } from './services/organizations/organizations.types.js';

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
        {
          name: "get-delegators",
          description: "Get list of delegators for a specific address",
          inputSchema: {
            type: "object",
            required: ["address"],
            properties: {
              address: {
                type: "string",
                description: "The Ethereum address to get delegators for (0x format)",
              },
              organizationId: {
                type: "string",
                description: "Filter by specific organization ID",
              },
              organizationSlug: {
                type: "string",
                description: "Filter by organization slug (e.g., 'uniswap'). Alternative to organizationId",
              },
              governorId: {
                type: "string",
                description: "Filter by specific governor ID",
              },
              limit: {
                type: "number",
                description: "Maximum number of delegators to return (default: 20, max: 50)",
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination",
              },
              beforeCursor: {
                type: "string",
                description: "Cursor for previous page pagination",
              },
              sortBy: {
                type: "string",
                enum: ["id", "votes"],
                description: "How to sort the delegators (default: id)",
              },
              isDescending: {
                type: "boolean",
                description: "Sort in descending order (default: true)",
              },
            },
          },
        },
        {
          name: "list-proposals",
          description: "List proposals for a specific organization or governor",
          inputSchema: {
            type: "object",
            properties: {
              organizationId: {
                type: "string",
                description: "Filter by organization ID (large integer as string)"
              },
              organizationSlug: {
                type: "string",
                description: "Filter by organization slug (e.g., 'uniswap'). Alternative to organizationId"
              },
              governorId: {
                type: "string",
                description: "Filter by governor ID"
              },
              includeArchived: {
                type: "boolean",
                description: "Include archived proposals"
              },
              isDraft: {
                type: "boolean",
                description: "Filter for draft proposals"
              },
              limit: {
                type: "number",
                description: "Maximum number of proposals to return (default: 20, max: 50)"
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination (string ID)"
              },
              beforeCursor: {
                type: "string",
                description: "Cursor for previous page pagination (string ID)"
              },
              isDescending: {
                type: "boolean",
                description: "Sort in descending order (default: true)"
              },
            },
          },
        },
        {
          name: "get-proposal",
          description: "Get detailed information about a specific proposal. You must provide either the Tally ID (globally unique) or both onchainId and governorId (unique within a governor).",
          inputSchema: {
            type: "object",
            oneOf: [
              {
                required: ["id"],
                properties: {
                  id: {
                    type: "string",
                    description: "The proposal's Tally ID (globally unique across all governors)"
                  },
                  includeArchived: {
                    type: "boolean",
                    description: "Include archived proposals"
                  },
                  isLatest: {
                    type: "boolean",
                    description: "Get the latest version of the proposal"
                  }
                }
              },
              {
                required: ["onchainId", "governorId"],
                properties: {
                  onchainId: {
                    type: "string",
                    description: "The proposal's onchain ID (only unique within a governor)"
                  },
                  governorId: {
                    type: "string",
                    description: "The governor's ID (required when using onchainId)"
                  },
                  includeArchived: {
                    type: "boolean",
                    description: "Include archived proposals"
                  },
                  isLatest: {
                    type: "boolean",
                    description: "Get the latest version of the proposal"
                  }
                }
              }
            ]
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

          // Determine if the input is an ID or slug
          // If it contains 'eip155' or is numeric, treat as ID, otherwise as slug
          const isId = args.organizationIdOrSlug.includes('eip155') || /^\d+$/.test(args.organizationIdOrSlug);
          
          const data = await this.service.listDelegates({
            ...(isId ? { organizationId: args.organizationIdOrSlug } : { organizationSlug: args.organizationIdOrSlug }),
            limit: typeof args.limit === 'number' ? args.limit : undefined,
            afterCursor: typeof args.afterCursor === 'string' ? args.afterCursor : undefined,
            hasVotes: typeof args.hasVotes === 'boolean' ? args.hasVotes : undefined,
            hasDelegators: typeof args.hasDelegators === 'boolean' ? args.hasDelegators : undefined,
            isSeekingDelegation: typeof args.isSeekingDelegation === 'boolean' ? args.isSeekingDelegation : undefined,
          });

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

      if (name === "get-delegators") {
        try {
          if (typeof args.address !== 'string') {
            throw new Error('address must be a string');
          }

          const data = await this.service.getDelegators({
            address: args.address,
            organizationId: typeof args.organizationId === 'string' ? args.organizationId : undefined,
            organizationSlug: typeof args.organizationSlug === 'string' ? args.organizationSlug : undefined,
            governorId: typeof args.governorId === 'string' ? args.governorId : undefined,
            limit: typeof args.limit === 'number' ? args.limit : undefined,
            afterCursor: typeof args.afterCursor === 'string' ? args.afterCursor : undefined,
            beforeCursor: typeof args.beforeCursor === 'string' ? args.beforeCursor : undefined,
            sortBy: typeof args.sortBy === 'string' ? args.sortBy as 'id' | 'votes' : undefined,
            isDescending: typeof args.isDescending === 'boolean' ? args.isDescending : undefined,
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: TallyService.formatDelegatorsList(data.delegators)
            }
          ];

          return { content };
        } catch (error) {
          throw new Error(`Error fetching delegators: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (name === "list-proposals") {
        try {
          const data = await this.service.listProposals({
            filters: {
              organizationId: typeof args.organizationId === 'string' ? args.organizationId.toString() : undefined,
              governorId: typeof args.governorId === 'string' ? args.governorId : undefined,
              includeArchived: typeof args.includeArchived === 'boolean' ? args.includeArchived : undefined,
              isDraft: typeof args.isDraft === 'boolean' ? args.isDraft : undefined,
            },
            organizationSlug: typeof args.organizationSlug === 'string' ? args.organizationSlug : undefined,
            page: {
              limit: typeof args.limit === 'number' ? args.limit : undefined,
              afterCursor: typeof args.afterCursor === 'string' ? args.afterCursor.toString() : undefined,
              beforeCursor: typeof args.beforeCursor === 'string' ? args.beforeCursor.toString() : undefined,
            },
            sort: typeof args.isDescending === 'boolean' ? {
              isDescending: args.isDescending,
              sortBy: "id"
            } : undefined
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: TallyService.formatProposalsList(data.proposals.nodes)
            }
          ];

          return { content };
        } catch (error) {
          throw new Error(`Error fetching proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (name === "get-proposal") {
        try {
          // If we have just an ID, we can use it directly
          if (typeof args.id === 'string') {
            const data = await this.service.getProposal({
              id: args.id,
              includeArchived: typeof args.includeArchived === 'boolean' ? args.includeArchived : undefined,
              isLatest: typeof args.isLatest === 'boolean' ? args.isLatest : undefined,
            });
            return {
              content: [{
                type: "text",
                text: TallyService.formatProposal(data.proposal)
              }]
            };
          }
          
          // If we have onchainId and governorId, use them together
          if (typeof args.onchainId === 'string' && typeof args.governorId === 'string') {
            const data = await this.service.getProposal({
              onchainId: args.onchainId,
              governorId: args.governorId,
              includeArchived: typeof args.includeArchived === 'boolean' ? args.includeArchived : undefined,
              isLatest: typeof args.isLatest === 'boolean' ? args.isLatest : undefined,
            });
            return {
              content: [{
                type: "text",
                text: TallyService.formatProposal(data.proposal)
              }]
            };
          }

          throw new Error('Must provide either id or both onchainId and governorId');
        } catch (error) {
          throw new Error(`Error fetching proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
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