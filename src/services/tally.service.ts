import { GraphQLClient, gql } from 'graphql-request';

export interface TallyServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

export type OrganizationsSortBy = "id" | "name" | "explore" | "popular";

export interface OrganizationsSortInput {
  isDescending: boolean;
  sortBy: OrganizationsSortBy;
}

export interface PageInput {
  afterCursor?: string;
  beforeCursor?: string;
  limit?: number;
}

export interface OrganizationsFiltersInput {
  hasLogo?: boolean;
  chainId?: string;
  isMember?: boolean;
  address?: string;
}

export interface OrganizationsInput {
  filters?: OrganizationsFiltersInput;
  page?: PageInput;
  sort?: OrganizationsSortInput;
}

export interface ListDAOsParams {
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  sortBy?: OrganizationsSortBy;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  chainIds: string[];
  metadata?: {
    description?: string;
    icon?: string;
    websiteUrl?: string;
    twitter?: string;
    discord?: string;
    github?: string;
    termsOfService?: string;
    governanceUrl?: string;
  };
  hasActiveProposals: boolean;
  proposalsCount: number;
  delegatesCount: number;
  tokenOwnersCount: number;
}

export interface PageInfo {
  firstCursor: string | null;
  lastCursor: string | null;
}

export interface OrganizationsResponse {
  organizations: {
    nodes: Organization[];
    pageInfo: PageInfo;
  };
}

export class TallyService {
  private client: GraphQLClient;
  private static readonly DEFAULT_BASE_URL = 'https://api.tally.xyz/query';

  // GraphQL Queries
  private static readonly LIST_DAOS_QUERY = gql`
    query Organizations($input: OrganizationsInput!) {
      organizations(input: $input) {
        nodes {
          ... on Organization {
            id
            name
            slug
            chainIds
            proposalsCount
            hasActiveProposals
            tokenOwnersCount
            delegatesCount
          }
        }
        pageInfo {
          firstCursor
          lastCursor
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
   * List DAOs sorted by specified criteria
   * @param {ListDAOsParams} params - Parameters for listing DAOs
   * @returns {Promise<OrganizationsResponse>} List of DAOs and pagination info
   * @throws {Error} When the API request fails
   */
  async listDAOs(params: ListDAOsParams = {}): Promise<OrganizationsResponse> {
    const input: OrganizationsInput = {
      sort: {
        sortBy: params.sortBy || "popular",
        isDescending: true
      },
      page: {
        limit: Math.min(params.limit || 20, 50)
      }
    };

    if (params.afterCursor) {
      input.page!.afterCursor = params.afterCursor;
    }

    if (params.beforeCursor) {
      input.page!.beforeCursor = params.beforeCursor;
    }

    try {
      return await this.client.request(TallyService.LIST_DAOS_QUERY, { input });
    } catch (error) {
      throw new Error(`Failed to fetch DAOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get OpenAI function definitions for the service
   */
  static getOpenAIFunctionDefinitions() {
    return [{
      name: "list_daos",
      description: "List DAOs on Tally sorted by specified criteria",
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
          sortBy: {
            type: "string",
            enum: ["id", "name", "explore", "popular"],
            description: "How to sort the DAOs (default: popular). 'explore' prioritizes DAOs with live proposals",
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
        `Website: ${dao.metadata?.websiteUrl || 'N/A'}\n` +
        `Twitter: ${dao.metadata?.twitter || 'N/A'}\n` +
        `Discord: ${dao.metadata?.discord || 'N/A'}\n` +
        `GitHub: ${dao.metadata?.github || 'N/A'}\n` +
        `Governance: ${dao.metadata?.governanceUrl || 'N/A'}\n` +
        '---'
      ).join('\n\n');
  }
} 