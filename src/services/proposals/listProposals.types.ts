// Basic Types
export type AccountID = string;
export type IntID = string;

// Input Types
export interface ProposalsInput {
  filters?: {
    governorId?: AccountID;
    organizationId?: IntID;
    includeArchived?: boolean;
    isDraft?: boolean;
  };
  page?: {
    afterCursor?: string;
    beforeCursor?: string;
    limit?: number; // max 50
  };
  sort?: {
    isDescending: boolean;
    sortBy: "id"; // default sorts by date
  };
}

export interface ListProposalsVariables {
  input: ProposalsInput;
}

// Response Types
export interface ProposalVoteStats {
  votesCount: string;
  percent: number;
  type: "for" | "against" | "abstain" | "pendingfor" | "pendingagainst" | "pendingabstain";
  votersCount: number;
}

export interface ProposalMetadata {
  description: string;
  title: string;
}

export interface ProposalGovernor {
  id: AccountID;
  name: string;
  organization: {
    name: string;
    slug: string;
  };
}

export interface Proposal {
  id: IntID;
  onchainId: string;
  status: "active" | "canceled" | "defeated" | "executed" | "expired" | "pending" | "queued" | "succeeded";
  createdAt: string;
  quorum: string;
  metadata: ProposalMetadata;
  voteStats: ProposalVoteStats[];
  governor: ProposalGovernor;
}

export interface ProposalsResponse {
  proposals: {
    nodes: Proposal[];
    pageInfo: {
      firstCursor: string;
      lastCursor: string;
    };
  };
}

export interface ListProposalsResponse {
  data: ProposalsResponse;
  errors?: Array<{
    message: string;
    path: string[];
    extensions: {
      code: number;
      status: {
        code: number;
        message: string;
      };
    };
  }>;
} 