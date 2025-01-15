import { gql } from 'graphql-request';

export const GET_ADDRESS_PROPOSALS_QUERY = gql`
  query GetAddressCreatedProposals($input: ProposalsInput!) {
    proposals(input: $input) {
      nodes {
        ... on Proposal {
          id
          onchainId
          originalId
          governor {
            id
          }
          metadata {
            description
          }
          status
          createdAt
          block {
            timestamp
          }
          voteStats {
            votesCount
            votersCount
            type
            percent
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