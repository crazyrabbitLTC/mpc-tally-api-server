export const LIST_DAOS_QUERY = `
  query Organizations($input: OrganizationsInput!) {
    organizations(input: $input) {
      nodes {
        ... on Organization {
          id
          name
          slug
          chainIds
          proposalsCount
          hasActiveProposals
          tokenOwnersCount
          delegatesCount
        }
      }
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`;

export const GET_DAO_QUERY = `
  query OrganizationBySlug($input: OrganizationInput!) {
    organization(input: $input) {
      id
      name
      slug
      chainIds
      governorIds
      tokenIds
      hasActiveProposals
      proposalsCount
      delegatesCount
      tokenOwnersCount
      metadata {
        description
        icon
        socials {
          website
          discord
          telegram
          twitter
          discourse
          others {
            label
            value
          }
        }
        karmaName
      }
      features {
        name
        enabled
      }
    }
  }
`; 