export const GET_DELEGATORS_QUERY = `
  query Delegators($input: DelegatorsInput!) {
    delegators(input: $input) {
      nodes {
        chainId
        blockNumber
        blockTimestamp
        votes
        delegator {
          address
          name
          picture
          twitter
          ens
        }
        token {
          id
          name
          symbol
          decimals
        }
      }
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`; 