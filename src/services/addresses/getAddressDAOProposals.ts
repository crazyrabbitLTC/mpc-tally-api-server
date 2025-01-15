import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_DAO_PROPOSALS_QUERY } from './addresses.queries.js';
import type { AddressDAOProposalsInput, AddressDAOProposalsResponse } from './addresses.types.js';
import { getDAO } from '../organizations/getDAO.js';

export async function getAddressDAOProposals(
  client: GraphQLClient,
  input: AddressDAOProposalsInput
): Promise<AddressDAOProposalsResponse> {
  try {
    // Get Uniswap DAO as a default context for proposals
    const dao = await getDAO(client, 'uniswap');

    const response = await client.request<AddressDAOProposalsResponse>(
      GET_ADDRESS_DAO_PROPOSALS_QUERY,
      {
        input: {
          filters: {
            organizationId: dao.id,
          },
          page: {
            limit: Math.min(input.limit || 20, 50),
            afterCursor: input.afterCursor,
            beforeCursor: input.beforeCursor,
          },
        },
        address: input.address,
      }
    );

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch address DAO proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 