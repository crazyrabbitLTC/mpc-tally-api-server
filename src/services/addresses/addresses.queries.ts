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

export const GET_ADDRESS_DAO_PROPOSALS_QUERY = gql`
  query GetAddressDAOSProposals($input: ProposalsInput!, $address: Address!) {
    proposals(input: $input) {
      nodes {
        ... on Proposal {
          id
          createdAt
          onchainId
          originalId
          metadata {
            description
          }
          governor {
            id
            organization {
              id
              name
              slug
            }
          }
          block {
            timestamp
          }
          proposer {
            address
          }
          creator {
            address
          }
          start {
            ... on Block {
              timestamp
            }
            ... on BlocklessTimestamp {
              timestamp
            }
          }
          status
          voteStats {
            votesCount
            votersCount
            type
            percent
          }
          participationType(address: $address)
        }
      }
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`;

const VOTE_FIELDS = gql`
  fragment VoteFields on Vote {
    id
    voter {
      address
    }
    proposal {
      id
      governor {
        id
        organization {
          id
          name
          slug
        }
      }
    }
    type
    amount
    reason
    block {
      timestamp
    }
  }
`;

export const GET_ADDRESS_VOTES_QUERY = gql`
  ${VOTE_FIELDS}
  query GetVotes($input: VotesInput!) {
    votes(input: $input) {
      nodes {
        ... on Vote {
          ...VoteFields
        }
      }
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`; 