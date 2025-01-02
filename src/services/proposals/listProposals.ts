import type { ListProposalsVariables, ListProposalsResponse } from './listProposals.types.js';

export const LIST_PROPOSALS_QUERY = `
  query GovernanceProposals($input: ProposalsInput!) {
    proposals(input: $input) {
      nodes {
        ... on Proposal {
          id
          onchainId
          status
          createdAt
          quorum
          metadata {
            description
            title
          }
          voteStats {
            votesCount
            percent
            type
            votersCount
          }
          governor {
            id
            name
            organization {
              name
              slug
            }
          }
        }
      }
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`;

export type { ListProposalsVariables, ListProposalsResponse }; 