import { gql } from 'graphql-request';

export const GET_DELEGATORS_QUERY = gql`
    query GetDelegators($input: DelegationsInput!) {
      delegators(input: $input) {
        nodes {
          ... on Delegation {
            chainId
            delegator {
              address
              name
              picture
              twitter
              ens
            }
            blockNumber
            blockTimestamp
            votes
            token {
              id
              name
              symbol
              decimals
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