import { gql } from 'graphql-request';

export const LIST_PROPOSALS_QUERY = gql`
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
            discourseURL
            snapshotURL
          }
          start {
            ... on Block {
              timestamp
            }
            ... on BlocklessTimestamp {
              timestamp
            }
          }
          end {
            ... on Block {
              timestamp
            }
            ... on BlocklessTimestamp {
              timestamp
            }
          }
          executableCalls {
            value
            target
            calldata
            signature
            type
          }
          voteStats {
            votesCount
            percent
            type
            votersCount
          }
          governor {
            id
            chainId
            name
            token {
              decimals
            }
            organization {
              name
              slug
            }
          }
          proposer {
            address
            name
            picture
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

export const GET_PROPOSAL_QUERY = gql`
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
      start {
        ... on Block {
          timestamp
        }
        ... on BlocklessTimestamp {
          timestamp
        }
      }
      end {
        ... on Block {
          timestamp
        }
        ... on BlocklessTimestamp {
          timestamp
        }
      }
      executableCalls {
        value
        target
        calldata
        signature
        type
      }
      voteStats {
        votesCount
        votersCount
        type
        percent
      }
      governor {
        id
        chainId
        name
        token {
          decimals
        }
        organization {
          name
          slug
        }
      }
      proposer {
        address
        name
        picture
      }
    }
  }
`; 