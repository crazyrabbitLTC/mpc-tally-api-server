import { PageInfo } from '../organizations/organizations.types.js';

// Input Types
export interface ListDelegatesInput {
  organizationId?: string;
  organizationSlug?: string;
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  hasVotes?: boolean;
  hasDelegators?: boolean;
  isSeekingDelegation?: boolean;
}

// Response Types
export interface Delegate {
  id: string;
  account: {
    address: string;
    bio?: string;
    name?: string;
    picture?: string | null;
  };
  votesCount: string;
  delegatorsCount: number;
  statement?: {
    statementSummary?: string;
  };
}

export interface DelegatesResponse {
  delegates: {
    nodes: Delegate[];
    pageInfo: PageInfo;
  };
}

export interface ListDelegatesResponse {
  data: DelegatesResponse;
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