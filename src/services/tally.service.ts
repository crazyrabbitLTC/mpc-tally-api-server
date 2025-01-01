import { GraphQLClient, gql } from 'graphql-request';

export interface TallyServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Organization {
  name: string;
  slug: string;
  tokenOwnersCount: number;
  delegatesCount: number;
  proposalsCount: number;
  hasActiveProposals: boolean;
  metadata?: {
    description?: string;
  };
}

export interface PageInfo {
  firstCursor: string | null;
  lastCursor: string | null;
  count: number;
}

export interface OrganizationsResponse {
  organizations: {
    nodes: Organization[];
    pageInfo: PageInfo;
  };
}

export interface ListDAOsParams {
  limit?: number;
  afterCursor?: string;
}

export class TallyService {
  private client: GraphQLClient;
  private static readonly DEFAULT_BASE_URL = 'https://api.tally.xyz/query';

  // GraphQL Queries
  private static readonly LIST_DAOS_QUERY = gql`
    query Organizations($input: OrganizationsInput) {
      organizations(input: $input) {
        nodes {
          ... on Organization {
            id
            name
            slug
            tokenOwnersCount
            delegatesCount
            proposalsCount
            hasActiveProposals
            metadata {
              description
            }
          }
        }
        pageInfo {
          firstCursor
          lastCursor
          count
        }
      }
    }
  `;

  constructor(private config: TallyServiceConfig) {
    this.client = new GraphQLClient(config.baseUrl || TallyService.DEFAULT_BASE_URL, {
      headers: {
        'Api-Key': config.apiKey,
      },
    });
  }

  /**
   * List DAOs sorted by popularity (token holders and activity)
   * @param {ListDAOsParams} params - Parameters for listing DAOs
   * @returns {Promise<OrganizationsResponse>} List of DAOs and pagination info
   * @throws {Error} When the API request fails
   */
  async listDAOs(params: ListDAOsParams = {}): Promise<OrganizationsResponse> {
    const limit = Math.min(params.limit || 20, 50);
    const input = {
      sort: {
        sortBy: "popular",
        isDescending: true,
      },
      page: {
        limit,
        afterCursor: params.afterCursor,
      },
    };

    try {
      return await this.client.request(TallyService.LIST_DAOS_QUERY, { input });
    } catch (error) {
      throw new Error(`Failed to fetch DAOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get OpenAI function definitions for the service
   * These match the MCP tool schemas but in OpenAI's format
   */
  static getOpenAIFunctionDefinitions() {
    return [{
      name: "list_daos",
      description: "List DAOs on Tally sorted by number of token holders and activity",
      parameters: {
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
    }];
  }

  /**
   * Format a list of DAOs into a human-readable string
   * @param {Organization[]} daos - List of DAOs to format
   * @returns {string} Formatted string representation
   */
  static formatDAOList(daos: Organization[]): string {
    return `Found ${daos.length} DAOs:\n\n` + 
      daos.map(dao => 
        `${dao.name} (${dao.slug})\n` +
        `Token Holders: ${dao.tokenOwnersCount}\n` +
        `Delegates: ${dao.delegatesCount}\n` +
        `Proposals: ${dao.proposalsCount}\n` +
        `Active Proposals: ${dao.hasActiveProposals ? 'Yes' : 'No'}\n` +
        `Description: ${dao.metadata?.description || 'No description available'}\n` +
        '---'
      ).join('\n\n');
  }
} 