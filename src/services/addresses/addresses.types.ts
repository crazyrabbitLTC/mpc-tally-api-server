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