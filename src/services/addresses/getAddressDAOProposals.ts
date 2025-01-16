import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_DAO_PROPOSALS_QUERY } from './addresses.queries.js';
import { getDAO } from '../organizations/getDAO.js';
import { AddressDAOProposalsInput, AddressDAOProposalsResponse } from './addresses.types.js';

export async function getAddressDAOProposals(
  client: GraphQLClient,
  input: AddressDAOProposalsInput
): Promise<AddressDAOProposalsResponse> {
  try {
    if (!input.address) {
      throw new Error('Address is required');
    }

    // Get governorId from organizationSlug if provided
    let governorId = input.governorId;
    if (!governorId && input.organizationSlug) {
      const dao = await getDAO(client, input.organizationSlug);
      if (dao.governorIds && dao.governorIds.length > 0) {
        governorId = dao.governorIds[0];
      }
    }

    if (!governorId) {
      throw new Error('Either governorId or organizationSlug is required');
    }

    const response = await client.request(GET_ADDRESS_DAO_PROPOSALS_QUERY, {
      input: {
        filters: {
          governorId
        },
        page: {
          limit: input.limit || 20,
          afterCursor: input.afterCursor
        }
      },
      address: input.address
    });

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch DAO proposals: ${error.message}`);
  }
} 