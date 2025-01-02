import { gql } from 'graphql-request';

export const LIST_DELEGATES_QUERY = gql`
query Delegates($input: DelegatesInput!) {
  delegates(input: $input) {
    nodes {
      ... on Delegate {
        id
        account {
          address
          bio
          name
          picture
        }
        votesCount
        delegatorsCount
        statement {
          statementSummary
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