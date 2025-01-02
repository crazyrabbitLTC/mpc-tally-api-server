import { GraphQLClient } from 'graphql-request';
import { LIST_DAOS_QUERY } from './organizations.queries.js';
import { ListDAOsParams, OrganizationsInput, OrganizationsResponse } from './organizations.types.js';

export async function listDAOs(
  client: GraphQLClient,
  params: ListDAOsParams = {}
): Promise<OrganizationsResponse> {
  const input: OrganizationsInput = {
    sort: {
      sortBy: params.sortBy || "popular",
      isDescending: true
    },
    page: {
      limit: Math.min(params.limit || 20, 50)
    }
  };

  if (params.afterCursor) {
    input.page!.afterCursor = params.afterCursor;
  }

  if (params.beforeCursor) {
    input.page!.beforeCursor = params.beforeCursor;
  }

  try {
    const response = await client.request<OrganizationsResponse>(LIST_DAOS_QUERY, { input });
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch DAOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 