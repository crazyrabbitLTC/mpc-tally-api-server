import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_DAO_PROPOSALS_QUERY } from './addresses.queries.js';
import { AddressDAOProposalsInput, AddressDAOProposalsResponse } from './addresses.types.js';

export async function getAddressDAOProposals(
  client: GraphQLClient,
  input: AddressDAOProposalsInput
): Promise<AddressDAOProposalsResponse> {
  try {
    if (!input.address) {
      throw new Error('Address is required');
    }

    if (!input.governorId) {
      throw new Error('GovernorId is required');
    }

    const response = await client.request(GET_ADDRESS_DAO_PROPOSALS_QUERY, {
      input: {
        filters: {
          governorId: input.governorId
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