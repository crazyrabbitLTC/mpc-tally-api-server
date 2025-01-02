import type { GetProposalVariables, GetProposalResponse } from './getProposal.types.js';

export const GET_PROPOSAL_QUERY = `
  query ProposalDetails($input: ProposalInput!) {
    proposal(input: $input) {
      id
      onchainId
      metadata {
        title
        description
        discourseURL
        snapshotURL
      }
      status
      quorum
      voteStats {
        votesCount
        votersCount
        type
        percent
      }
      governor {
        id
        name
        organization {
          name
          slug
        }
      }
      proposer {
        address
        name
      }
    }
  }
`;

export type { GetProposalVariables, GetProposalResponse }; 