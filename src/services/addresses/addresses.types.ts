import { PageInfo } from '../organizations/organizations.types.js';
import { Proposal } from '../proposals/listProposals.types.js';

export interface AddressProposalsInput {
  address: string;
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
}

export interface AddressProposalsResponse {
  proposals: {
    nodes: Proposal[];
    pageInfo: PageInfo;
  };
}

export interface AddressDAOProposalsInput {
  address: string;
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
}

export interface AddressDAOProposalsResponse {
  proposals: {
    nodes: (Proposal & {
      participationType?: string;
    })[];
    pageInfo: PageInfo;
  };
}

export interface Vote {
  id: string;
  voter: {
    address: string;
  };
  proposal: {
    id: string;
    governor: {
      id: string;
      organization: {
        id: string;
        name: string;
        slug: string;
      };
    };
  };
  type: 'for' | 'against' | 'abstain';
  amount: string;
  reason: string | null;
  block: {
    timestamp: string;
  };
}

export interface AddressVotesInput {
  address: string;
  organizationSlug: string;
}

export interface AddressVotesResponse {
  votes: {
    nodes: Vote[];
    pageInfo: {
      firstCursor: string;
      lastCursor: string;
    };
  };
}

export interface AddressCreatedProposalsInput {
  address: string;
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
}

export interface AddressCreatedProposalsResponse {
  proposals: {
    nodes: Array<{
      id: string;
      onchainId: string;
      originalId: string;
      governor: {
        id: string;
        name: string;
        organization: {
          id: string;
          name: string;
          slug: string;
        };
      };
      metadata: {
        title: string;
        description: string;
      };
      status: string;
      createdAt: string;
      block: {
        timestamp: string;
      };
      proposer: {
        address: string;
        name: string | null;
      };
      voteStats: {
        votesCount: string;
        votersCount: string;
        type: string;
        percent: string;
      };
    }>;
    pageInfo: {
      firstCursor: string;
      lastCursor: string;
    };
  };
} 