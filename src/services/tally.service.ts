import { GraphQLClient } from 'graphql-request';
import { listDAOs } from './organizations/listDAOs.js';
import { getDAO } from './organizations/getDAO.js';
import { listDelegates } from './delegates/listDelegates.js';
import { getDelegators } from './delegators/getDelegators.js';
import { listProposals } from './proposals/listProposals.js';
import { getProposal } from './proposals/getProposal.js';
import { getAddressProposals } from './addresses/getAddressProposals.js';
import { getAddressDAOProposals } from './addresses/getAddressDAOProposals.js';
import type { 
  Organization,
  OrganizationsResponse,
  ListDAOsParams,
} from './organizations/organizations.types.js';
import type { Delegate } from './delegates/delegates.types.js';
import type { Delegation, GetDelegatorsParams, TokenInfo } from './delegators/delegators.types.js';
import type { PageInfo } from './organizations/organizations.types.js';
import type { 
  ProposalsInput,
  ProposalsResponse,
  ProposalInput,
  ProposalDetailsResponse,
} from './proposals/index.js';
import type { AddressProposalsInput, AddressProposalsResponse } from './addresses/addresses.types.js';
import type { AddressDAOProposalsInput, AddressDAOProposalsResponse } from './addresses/addresses.types.js';

export interface TallyServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface OpenAIFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
    oneOf?: Array<{
      required: string[];
      properties: Record<string, unknown>;
    }>;
  };
}

export const OPENAI_FUNCTION_DEFINITIONS: OpenAIFunctionDefinition[] = [
  {
    name: "list-daos",
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
    name: "get-dao",
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
  },
  {
    name: "list-delegates",
    description: "List delegates for a specific organization with their metadata",
    parameters: {
      type: "object",
      required: ["organizationIdOrSlug"],
      properties: {
        organizationIdOrSlug: {
          type: "string",
          description: "The organization's ID, governor ID (eip155 format), or slug (e.g., 'arbitrum', 'eip155:1:123', or numeric ID)",
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
    parameters: {
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
    parameters: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Filter by organization ID (large integer as string)",
        },
        organizationSlug: {
          type: "string",
          description: "Filter by organization slug (e.g., 'uniswap'). Alternative to organizationId",
        },
        governorId: {
          type: "string",
          description: "Filter by governor ID",
        },
        includeArchived: {
          type: "boolean",
          description: "Include archived proposals",
        },
        isDraft: {
          type: "boolean",
          description: "Filter for draft proposals",
        },
        limit: {
          type: "number",
          description: "Maximum number of proposals to return (default: 20, max: 50)",
        },
        afterCursor: {
          type: "string",
          description: "Cursor for pagination (string ID)",
        },
        beforeCursor: {
          type: "string",
          description: "Cursor for previous page pagination (string ID)",
        },
        isDescending: {
          type: "boolean",
          description: "Sort in descending order (default: true)",
        },
      },
    },
  },
  {
    name: "get-proposal",
    description: "Get detailed information about a specific proposal. You must provide either the Tally ID (globally unique) or both onchainId and governorId (unique within a governor).",
    parameters: {
      type: "object",
      oneOf: [
        {
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "The proposal's Tally ID (globally unique across all governors)",
            },
            includeArchived: {
              type: "boolean",
              description: "Include archived proposals",
            },
            isLatest: {
              type: "boolean",
              description: "Get the latest version of the proposal",
            },
          },
        },
        {
          required: ["onchainId", "governorId"],
          properties: {
            onchainId: {
              type: "string",
              description: "The proposal's onchain ID (only unique within a governor)",
            },
            governorId: {
              type: "string",
              description: "The governor's ID (required when using onchainId)",
            },
            includeArchived: {
              type: "boolean",
              description: "Include archived proposals",
            },
            isLatest: {
              type: "boolean",
              description: "Get the latest version of the proposal",
            },
          },
        },
      ],
    },
  },
  {
    name: "get-address-proposals-created",
    description: "Returns proposals created by a given address",
    parameters: {
      type: "object",
      required: ["address"],
      properties: {
        address: {
          type: "string",
          description: "The Ethereum address",
        },
        limit: {
          type: "number",
          description: "Maximum number of proposals to return (default: 20, max: 50)",
        },
        afterCursor: {
          type: "string",
          description: "Cursor for pagination",
        },
      },
    },
  },
];

export class TallyService {
  private client: GraphQLClient;
  private static readonly DEFAULT_BASE_URL = 'https://api.tally.xyz/query';

  constructor(private config: TallyServiceConfig) {
    this.client = new GraphQLClient(config.baseUrl || TallyService.DEFAULT_BASE_URL, {
      headers: {
        'Api-Key': config.apiKey,
      },
    });
  }

  static getOpenAIFunctionDefinitions(): OpenAIFunctionDefinition[] {
    return OPENAI_FUNCTION_DEFINITIONS;
  }

  /**
   * Format a vote amount considering token decimals
   * @param {string} votes - The raw vote amount
   * @param {TokenInfo} token - Optional token info containing decimals and symbol
   * @returns {string} Formatted vote amount with optional symbol
   */
  private static formatVotes(votes: string, token?: TokenInfo): string {
    const val = BigInt(votes);
    const decimals = token?.decimals ?? 18;
    const denominator = BigInt(10 ** decimals);
    const formatted = (Number(val) / Number(denominator)).toLocaleString();
    return `${formatted}${token?.symbol ? ` ${token.symbol}` : ''}`;
  }

  async listDAOs(params: ListDAOsParams = {}): Promise<OrganizationsResponse> {
    return listDAOs(this.client, params);
  }

  async getDAO(slug: string): Promise<Organization> {
    return getDAO(this.client, slug);
  }

  public async listDelegates(input: {
    organizationId?: string;
    organizationSlug?: string;
    limit?: number;
    afterCursor?: string;
    beforeCursor?: string;
    hasVotes?: boolean;
    hasDelegators?: boolean;
    isSeekingDelegation?: boolean;
  }): Promise<{
    delegates: Delegate[];
    pageInfo: PageInfo;
  }> {
    return listDelegates(this.client, input);
  }

  async getDelegators(params: GetDelegatorsParams): Promise<{
    delegators: Delegation[];
    pageInfo: PageInfo;
  }> {
    return getDelegators(this.client, params);
  }

  async listProposals(input: ProposalsInput & { organizationSlug?: string }): Promise<ProposalsResponse> {
    return listProposals(this.client, input);
  }

  async getProposal(input: ProposalInput & { organizationSlug?: string }): Promise<ProposalDetailsResponse> {
    return getProposal(this.client, input);
  }

  async getAddressProposals(input: AddressProposalsInput): Promise<AddressProposalsResponse> {
    return getAddressProposals(this.client, input);
  }

  async getAddressDAOProposals(input: AddressDAOProposalsInput): Promise<AddressDAOProposalsResponse> {
    return getAddressDAOProposals(this.client, input);
  }

  // Keep the formatting utility functions in the service
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

  static formatDelegatesList(delegates: Delegate[]): string {
    return `Found ${delegates.length} delegates:\n\n` +
      delegates.map(delegate =>
        `${delegate.account.name || delegate.account.address}\n` +
        `Address: ${delegate.account.address}\n` +
        `Votes: ${delegate.votesCount}\n` +
        `Delegators: ${delegate.delegatorsCount}\n` +
        `Bio: ${delegate.account.bio || 'No bio available'}\n` +
        `Statement: ${delegate.statement?.statementSummary || 'No statement available'}\n` +
        '---'
      ).join('\n\n');
  }

  static formatDelegatorsList(delegators: Delegation[]): string {
    return `Found ${delegators.length} delegators:\n\n` +
      delegators.map(delegation =>
        `${delegation.delegator.name || delegation.delegator.ens || delegation.delegator.address}\n` +
        `Address: ${delegation.delegator.address}\n` +
        `Votes: ${TallyService.formatVotes(delegation.votes, delegation.token)}\n` +
        `Delegated at: Block ${delegation.blockNumber} (${new Date(delegation.blockTimestamp).toLocaleString()})\n` +
        `${delegation.token ? `Token: ${delegation.token.symbol} (${delegation.token.name})\n` : ''}` +
        '---'
      ).join('\n\n');
  }

  static formatProposalsList(proposals: ProposalsResponse['proposals']['nodes']): string {
    return `Found ${proposals.length} proposals:\n\n` +
      proposals.map(proposal =>
        `${proposal.metadata.title}\n` +
        `Tally ID: ${proposal.id}\n` +
        `Onchain ID: ${proposal.onchainId}\n` +
        `Status: ${proposal.status}\n` +
        `Created: ${new Date(proposal.createdAt).toLocaleString()}\n` +
        `Quorum: ${proposal.quorum}\n` +
        `Organization: ${proposal.governor.organization.name} (${proposal.governor.organization.slug})\n` +
        `Governor: ${proposal.governor.name}\n` +
        `Vote Stats:\n${proposal.voteStats.map(stat =>
          `  ${stat.type}: ${stat.percent.toFixed(2)}% (${stat.votesCount} votes from ${stat.votersCount} voters)`
        ).join('\n')}\n` +
        `Description: ${proposal.metadata.description.slice(0, 200)}${proposal.metadata.description.length > 200 ? '...' : ''}\n` +
        '---'
      ).join('\n\n');
  }

  static formatProposal(proposal: ProposalDetailsResponse['proposal']): string {
    return `${proposal.metadata.title}\n` +
      `Tally ID: ${proposal.id}\n` +
      `Onchain ID: ${proposal.onchainId}\n` +
      `Status: ${proposal.status}\n` +
      `Quorum: ${proposal.quorum}\n` +
      `Organization: ${proposal.governor.organization.name} (${proposal.governor.organization.slug})\n` +
      `Governor: ${proposal.governor.name}\n` +
      `Proposer: ${proposal.proposer.name || proposal.proposer.address}\n` +
      `Vote Stats:\n${proposal.voteStats.map(stat =>
        `  ${stat.type}: ${stat.percent.toFixed(2)}% (${stat.votesCount} votes from ${stat.votersCount} voters)`
      ).join('\n')}\n` +
      `Description:\n${proposal.metadata.description}\n` +
      `Links:\n` +
      `  Discourse: ${proposal.metadata.discourseURL || 'N/A'}\n` +
      `  Snapshot: ${proposal.metadata.snapshotURL || 'N/A'}`;
  }
} 