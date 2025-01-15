import { GraphQLClient } from 'graphql-request';
import { LIST_DELEGATES_QUERY } from './delegates.queries.js';
import { DelegatesResponse, Delegate } from './delegates.types.js';
import { PageInfo } from '../organizations/organizations.types.js';
import { getDAO } from '../organizations/getDAO.js';

export async function listDelegates(
  client: GraphQLClient,
  input: {
    organizationId?: string;
    organizationSlug?: string;
    governorId?: string;
    limit?: number;
    afterCursor?: string;
    beforeCursor?: string;
    hasVotes?: boolean;
    hasDelegators?: boolean;
    isSeekingDelegation?: boolean;
  }
): Promise<{
  delegates: Delegate[];
  pageInfo: PageInfo;
}> {
  let organizationId = input.organizationId;

  // If we got a governor ID instead of organization ID, treat it as such
  if (organizationId?.startsWith('eip155:')) {
    if (!input.organizationSlug) {
      throw new Error('Organization slug is required when using a governor ID as organization ID');
    }
    const dao = await getDAO(client, input.organizationSlug);
    organizationId = dao.id;
  }

  // If organizationId is not provided but slug is, get the DAO first
  if (!organizationId && input.organizationSlug) {
    const dao = await getDAO(client, input.organizationSlug);
    organizationId = dao.id;
  }

  // If we have a governorId but no organization info, get the DAO
  if (!organizationId && input.governorId) {
    // We'll need to fetch the DAO using the governorId
    // This might require additional API support or a different approach
    throw new Error('Using governorId without organizationSlug is not currently supported. Please provide organizationSlug.');
  }

  if (!organizationId) {
    throw new Error('Either organizationId, organizationSlug, or governorId with organizationSlug must be provided');
  }

  try {
    const response = await client.request<DelegatesResponse>(LIST_DELEGATES_QUERY, {
      input: {
        filters: {
          organizationId,
          hasVotes: input.hasVotes,
          hasDelegators: input.hasDelegators,
          isSeekingDelegation: input.isSeekingDelegation,
        },
        sort: {
          isDescending: true,
          sortBy: 'votes',
        },
        page: {
          limit: Math.min(input.limit || 20, 50),
          afterCursor: input.afterCursor,
          beforeCursor: input.beforeCursor,
        },
      },
    });

    return {
      delegates: response.delegates.nodes,
      pageInfo: response.delegates.pageInfo,
    };
  } catch (error) {
    throw new Error(`Failed to fetch delegates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 