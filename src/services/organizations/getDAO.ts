import { GraphQLClient } from 'graphql-request';
import { GET_DAO_QUERY } from './organizations.queries.js';
import { Organization } from './organizations.types.js';

export async function getDAO(
  client: GraphQLClient,
  slug: string
): Promise<Organization> {
  try {
    const input = { slug };
    const response = await client.request<{ organization: Organization }>(GET_DAO_QUERY, { input });
    
    if (!response.organization) {
      throw new Error(`DAO not found: ${slug}`);
    }
    
    // Map the response to match our Organization interface
    const dao: Organization = {
      ...response.organization,
      metadata: {
        ...response.organization.metadata,
        websiteUrl: response.organization.metadata?.socials?.website || undefined,
        discord: response.organization.metadata?.socials?.discord || undefined,
        twitter: response.organization.metadata?.socials?.twitter || undefined,
      }
    };
    
    return dao;
  } catch (error) {
    throw new Error(`Failed to fetch DAO: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 