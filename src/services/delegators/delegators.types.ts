import { PageInfo } from '../organizations/organizations.types.js';

// Input Types
export interface GetDelegatorsParams {
  address: string;
  organizationId?: string;
  organizationSlug?: string;
  governorId?: string;
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  sortBy?: 'id' | 'votes';
  isDescending?: boolean;
}

// Response Types
export interface TokenInfo {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface Delegation {
  chainId: string;
  blockNumber: number;
  blockTimestamp: string;
  votes: string;
  delegator: {
    address: string;
    name?: string;
    picture?: string;
    twitter?: string;
    ens?: string;
  };
  token?: TokenInfo;
}

export interface DelegationsResponse {
  delegators: {
    nodes: Delegation[];
    pageInfo: PageInfo;
  };
}

export interface GetDelegatorsResponse {
  data: DelegationsResponse;
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