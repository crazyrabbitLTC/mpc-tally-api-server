import { GraphQLClient } from 'graphql-request';
import { LIST_PROPOSALS_QUERY } from './proposals.queries.js';
import { getDAO } from '../organizations/getDAO.js';
import type { ProposalsInput, ProposalsResponse } from './listProposals.types.js';

export async function listProposals(
  client: GraphQLClient,
  input: ProposalsInput & { organizationSlug?: string }
): Promise<ProposalsResponse> {
  try {
    let apiInput: ProposalsInput = { ...input };
    delete (apiInput as any).organizationSlug;  // Remove organizationSlug before API call

    // If organizationSlug is provided but no organizationId, get the DAO first
    if (!apiInput.filters?.organizationId && input.organizationSlug) {
      const dao = await getDAO(client, input.organizationSlug);
      apiInput = {
        ...apiInput,
        filters: {
          ...apiInput.filters,
          organizationId: dao.id
        }
      };
    }

    const response = await client.request<ProposalsResponse>(LIST_PROPOSALS_QUERY, { input: apiInput });
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 