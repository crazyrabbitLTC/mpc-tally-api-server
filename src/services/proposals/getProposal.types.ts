import { AccountID, IntID } from './listProposals.types.js';

// Input Types
export interface ProposalInput {
  id?: IntID;
  onchainId?: string;
  governorId?: AccountID;
  includeArchived?: boolean;
  isLatest?: boolean;
}

export interface GetProposalVariables {
  input: ProposalInput;
}

// Response Types
export interface ProposalDetailsMetadata {
  title: string;
  description: string;
  discourseURL: string;
  snapshotURL: string;
}

export interface ProposalDetailsVoteStats {
  votesCount: string;
  votersCount: number;
  type: "for" | "against" | "abstain" | "pendingfor" | "pendingagainst" | "pendingabstain";
  percent: number;
}

export interface ProposalDetailsGovernor {
  id: AccountID;
  name: string;
  organization: {
    name: string;
    slug: string;
  };
}

export interface ProposalDetailsProposer {
  address: AccountID;
  name: string;
}

export interface ProposalDetails {
  id: IntID;
  onchainId: string;
  metadata: ProposalDetailsMetadata;
  status: "active" | "canceled" | "defeated" | "executed" | "expired" | "pending" | "queued" | "succeeded";
  quorum: string;
  voteStats: ProposalDetailsVoteStats[];
  governor: ProposalDetailsGovernor;
  proposer: ProposalDetailsProposer;
}

export interface ProposalDetailsResponse {
  proposal: ProposalDetails;
}

export interface GetProposalResponse {
  data: ProposalDetailsResponse;
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