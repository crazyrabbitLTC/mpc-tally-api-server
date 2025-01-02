export const LIST_DELEGATES_QUERY = `
  query Delegates($input: DelegatesInput!) {
    delegates(input: $input) {
      nodes {
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
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`; 