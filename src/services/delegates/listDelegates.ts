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

  // If organizationId is not provided but slug is, get the DAO first
  if (!organizationId && input.organizationSlug) {
    const dao = await getDAO(client, input.organizationSlug);
    organizationId = dao.id;
  }

  if (!organizationId) {
    throw new Error('Either organizationId or organizationSlug must be provided');
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