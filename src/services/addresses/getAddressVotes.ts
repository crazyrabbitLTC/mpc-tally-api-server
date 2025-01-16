import { GraphQLClient } from 'graphql-request';
import { GET_ADDRESS_VOTES_QUERY } from './addresses.queries.js';
import { AddressVotesInput, AddressVotesResponse } from './addresses.types.js';
import { getDAO } from '../organizations/getDAO.js';
import { listProposals } from '../proposals/listProposals.js';

export async function getAddressVotes(
  client: GraphQLClient,
  input: AddressVotesInput
): Promise<AddressVotesResponse> {
  try {
    if (!input.organizationSlug) {
      throw new Error('organizationSlug is required to fetch address votes');
    }

    // Step 1: Get the organization
    const dao = await getDAO(client, input.organizationSlug);

    // Step 2: Get proposals for this organization
    const proposals = await listProposals(client, {
      filters: {
        organizationId: dao.id
      },
      page: {
        limit: 100 // Get a reasonable number of proposals
      }
    });

    // Step 3: Get votes for these proposals
    const response = await client.request(GET_ADDRESS_VOTES_QUERY, {
      input: {
        filters: {
          proposalIds: proposals.proposals.nodes.map(p => p.id),
          voter: input.address
        }
      }
    });

    // Transform the response to match our expected types
    return {
      votes: {
        nodes: response.votes?.nodes || [],
        pageInfo: response.votes?.pageInfo || {
          firstCursor: '',
          lastCursor: ''
        }
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch address votes: ${error.message}`);
  }
} 