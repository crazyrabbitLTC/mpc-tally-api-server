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
  slug?: string;
  name?: string;
}

export interface OrganizationsInput {
  filters?: OrganizationsFiltersInput;
  page?: PageInput;
  sort?: OrganizationsSortInput;
  search?: string;
}

export interface ListDAOsParams {
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  sortBy?: OrganizationsSortBy;
  slug?: string;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  chainIds: string[];
  tokenIds?: string[];
  governorIds?: string[];
  metadata?: {
    description?: string;
    icon?: string;
    websiteUrl?: string;
    twitter?: string;
    discord?: string;
    github?: string;
    termsOfService?: string;
    governanceUrl?: string;
    socials?: {
      website?: string;
      discord?: string;
      telegram?: string;
      twitter?: string;
      discourse?: string;
      others?: Array<{
        label: string;
        value: string;
      }>;
    };
    karmaName?: string;
  };
  features?: Array<{
    name: string;
    enabled: boolean;
  }>;
  hasActiveProposals: boolean;
  proposalsCount: number;
  delegatesCount: number;
  tokenOwnersCount: number;
  stats?: {
    proposalsCount: number;
    activeProposalsCount: number;
    tokenHoldersCount: number;
    votersCount: number;
    delegatesCount: number;
    delegatedVotesCount: string;
  };
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

interface GetDAOResponse {
  organizations: {
    nodes: Organization[];
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

  private static readonly GET_DAO_QUERY = gql`
    query OrganizationBySlug($input: OrganizationInput!) {
      organization(input: $input) {
        id
        name
        slug
        chainIds
        governorIds
        tokenIds
        metadata {
          description
          icon
          socials {
            website
            discord
            telegram
            twitter
            discourse
            others {
              label
              value
            }
          }
          karmaName
        }
        features {
          name
          enabled
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

    if (params.slug) {
      input.search = params.slug;
      input.page!.limit = 1;
    }

    try {
      return await this.client.request(TallyService.LIST_DAOS_QUERY, { input });
    } catch (error) {
      throw new Error(`Failed to fetch DAOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific DAO by its slug
   * @param {string} slug - The DAO's slug (e.g., "uniswap" or "aave")
   * @returns {Promise<Organization>} The DAO's details
   * @throws {Error} When the API request fails or DAO is not found
   */
  async getDAO(slug: string): Promise<Organization> {
    try {
      const input = { slug };
      const response = await this.client.request<{ organization: Organization }>(TallyService.GET_DAO_QUERY, { input });
      
      if (!response.organization) {
        throw new Error(`DAO not found: ${slug}`);
      }
      
      // Map the response to match our Organization interface
      const dao: Organization = {
        ...response.organization,
        metadata: {
          ...response.organization.metadata,
          websiteUrl: response.organization.metadata?.socials?.website || undefined,
          discord: response.organization.metadata?.socials?.discord || undefined,
          twitter: response.organization.metadata?.socials?.twitter || undefined,
        },
        hasActiveProposals: false,
        proposalsCount: 0,
        delegatesCount: 0,
        tokenOwnersCount: 0
      };
      
      return dao;
    } catch (error) {
      throw new Error(`Failed to fetch DAO: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  /**
   * Format a single DAO's details into a human-readable string
   * @param {Organization} dao - The DAO to format
   * @returns {string} Formatted string representation
   */
  static formatDAO(dao: Organization): string {
    return `${dao.name} (${dao.slug})\n` +
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
      `Chain IDs: ${dao.chainIds.join(', ')}\n` +
      `Token IDs: ${dao.tokenIds?.join(', ') || 'N/A'}\n` +
      `Governor IDs: ${dao.governorIds?.join(', ') || 'N/A'}`;
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
    },
    {
      name: "get_dao",
      description: "Get detailed information about a specific DAO",
      parameters: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: {
            type: "string",
            description: "The DAO's slug (e.g., 'uniswap' or 'aave')",
          },
        },
      },
    }];
  }
} 