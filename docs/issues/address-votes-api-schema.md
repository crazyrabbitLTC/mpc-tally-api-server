# Issue: Unable to Fetch Address Votes Due to API Schema Mismatch

## Problem Description
When attempting to fetch votes for a specific address using the Tally API, we consistently encounter 422 errors, suggesting a mismatch between our GraphQL queries and the API's schema.

## Current Implementation
Files involved:
- `src/services/addresses/addresses.types.ts`
- `src/services/addresses/addresses.queries.ts`
- `src/services/addresses/getAddressVotes.ts`
- `src/services/__tests__/tally.service.address-votes.test.ts`

## Attempted Approaches
We've tried several GraphQL queries to fetch votes, all resulting in 422 errors:

1. First attempt - Using account query:
```graphql
query GetAddressVotes($input: VotesInput!) {
  account(address: $address) {
    votes {
      nodes {
        ... on Vote {
          id
          type
          amount
          reason
          createdAt
        }
      }
    }
  }
}
```

2. Second attempt - Using separate queries for vote types:
```graphql
query GetAddressVotes($forInput: VotesInput!, $againstInput: VotesInput!, $abstainInput: VotesInput!) {
  forVotes: votes(input: $forInput) {
    nodes {
      ... on Vote {
        isBridged
        voter {
          name
          picture
          address
          twitter
        }
        amount
        type
        chainId
      }
    }
  }
  againstVotes: votes(input: $againstInput) {
    // Similar structure
  }
  abstainVotes: votes(input: $abstainInput) {
    // Similar structure
  }
}
```

3. Third attempt - Using simpler votes query:
```graphql
query GetAddressVotes($input: VotesInput!) {
  votes(input: $input) {
    nodes {
      id
      voter {
        address
      }
      proposal {
        id
      }
      support
      weight
      reason
      createdAt
    }
    pageInfo {
      firstCursor
      lastCursor
    }
  }
}
```

## Error Response
All attempts result in a 422 error with no detailed error message in the response:
```json
{
  "response": {
    "status": 422,
    "headers": {
      "content-type": "application/json"
    }
  }
}
```

## Impact
This issue affects our ability to:
1. Fetch voting history for addresses
2. Display vote details
3. Analyze voting patterns

## Questions
1. What is the correct schema for fetching votes?
2. Are there required fields or filters we're missing?
3. Has the API schema changed recently?

## Next Steps
1. Need clarification on the correct API schema
2. May need to update our types and queries
3. Consider if there's a different approach if this one is deprecated

## Related Files
- `src/services/addresses/addresses.types.ts`
- `src/services/addresses/addresses.queries.ts`
- `src/services/addresses/getAddressVotes.ts`
- `src/services/__tests__/tally.service.address-votes.test.ts` 