import { TallyService, type Organization } from '../tally.service.js';
import { describe, test, expect, beforeAll, beforeEach, mock } from 'bun:test';
import { gql } from 'graphql-request';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Mock GraphQL client
class MockGraphQLClient {
  endpoint: string;
  requestConfig: any;
  mockRequest: ReturnType<typeof mock>;

  constructor(endpoint: string, config: any) {
    this.endpoint = endpoint;
    this.requestConfig = config;
    this.mockRequest = mock(() => Promise.resolve({
      organizations: {
        nodes: [],
        pageInfo: { firstCursor: null, lastCursor: null }
      }
    }));
  }

  request = (...args: any[]) => this.mockRequest(...args);
}

// Live test configuration
const LIVE_API_KEY = process.env.TALLY_API_KEY;
console.log('API Key available:', LIVE_API_KEY ? '✓' : '✗');
const runLiveTests = !!LIVE_API_KEY;

(runLiveTests ? describe : describe.skip)('TallyService Live Tests', () => {
  let service: TallyService;

  beforeAll(() => {
    service = new TallyService({ apiKey: LIVE_API_KEY! });
  });

  test('should fetch DAOs from the live API', async () => {
    try {
      const response = await service.listDAOs({ limit: 5, sortBy: 'popular' });
      console.log('Live API Response:', response);
      expect(response.organizations.nodes.length).toBeGreaterThan(0);
      expect(response.organizations.nodes[0]).toHaveProperty('id');
      expect(response.organizations.nodes[0]).toHaveProperty('name');
    } catch (error) {
      console.error('Error fetching from live API:', error);
      throw error;
    }
  });
});

describe('TallyService', () => {
  let service: TallyService;
  let mockClient: MockGraphQLClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    mockClient = new MockGraphQLClient('https://api.tally.xyz/query', {
      headers: { 'Api-Key': mockApiKey }
    });
    service = new TallyService({ apiKey: mockApiKey });
    (service as any).client = mockClient;
  });

  describe('constructor', () => {
    test('should initialize with default base URL when not provided', () => {
      const service = new TallyService({ apiKey: 'test' });
      const client = (service as any).client;
      expect(client.url).toBe('https://api.tally.xyz/query');
    });

    test('should initialize with custom base URL when provided', () => {
      const customUrl = 'https://custom.api.xyz';
      const service = new TallyService({ apiKey: 'test', baseUrl: customUrl });
      const client = (service as any).client;
      expect(client.url).toBe(customUrl);
    });

    test('should set API key in headers', () => {
      const service = new TallyService({ apiKey: 'test-key' });
      const client = (service as any).client;
      expect(client.requestConfig.headers['Api-Key']).toBe('test-key');
    });
  });

  describe('listDAOs', () => {
    const mockOrganization: Organization = {
      id: '1',
      slug: 'test-dao',
      name: 'Test DAO',
      chainIds: ['eip155:1'],
      metadata: {
        description: 'Test Description',
        websiteUrl: 'https://test.com'
      },
      hasActiveProposals: true,
      proposalsCount: 5,
      delegatesCount: 10,
      tokenOwnersCount: 100
    };

    test('should format the input correctly', async () => {
      mockClient.mockRequest.mockImplementation(() => Promise.resolve({
        organizations: {
          nodes: [mockOrganization],
          pageInfo: {
            firstCursor: null,
            lastCursor: null
          }
        }
      }));

      await service.listDAOs({
        limit: 10,
        sortBy: 'popular'
      });

      expect(mockClient.mockRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: {
            sort: {
              sortBy: 'popular',
              isDescending: true
            },
            page: {
              limit: 10
            }
          }
        })
      );
    });

    test('should handle different sort options', async () => {
      mockClient.mockRequest.mockImplementation(() => Promise.resolve({
        organizations: { nodes: [mockOrganization], pageInfo: { firstCursor: null, lastCursor: null } }
      }));

      await service.listDAOs({ sortBy: 'explore' });
      
      expect(mockClient.mockRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: {
            sort: {
              sortBy: 'explore',
              isDescending: true
            },
            page: {
              limit: 20
            }
          }
        })
      );
    });

    test('should format the response correctly with full metadata', () => {
      const orgWithFullMetadata: Organization = {
        ...mockOrganization,
        metadata: {
          description: 'Full Description',
          websiteUrl: 'https://test.com',
          icon: 'https://icon.com',
          twitter: '@test',
          discord: 'discord.gg/test',
          github: 'github.com/test',
          termsOfService: 'https://tos.com',
          governanceUrl: 'https://gov.com'
        }
      };

      const formatted = TallyService.formatDAOList([orgWithFullMetadata]);
      expect(formatted).toContain('Full Description');
      expect(formatted).toContain('@test');
      expect(formatted).toContain('discord.gg/test');
      expect(formatted).toContain('github.com/test');
    });

    test('should handle missing metadata gracefully', () => {
      const orgWithoutMetadata: Organization = {
        ...mockOrganization,
        metadata: undefined
      };

      const formatted = TallyService.formatDAOList([orgWithoutMetadata]);
      expect(formatted).toContain('No description available');
      expect(formatted).toContain('N/A');
    });

    test('should handle pagination cursors', async () => {
      mockClient.mockRequest.mockImplementation(() => Promise.resolve({
        organizations: {
          nodes: [mockOrganization],
          pageInfo: {
            firstCursor: 'first',
            lastCursor: 'last'
          }
        }
      }));

      await service.listDAOs({
        afterCursor: 'cursor123'
      });

      expect(mockClient.mockRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: {
            sort: {
              sortBy: 'popular',
              isDescending: true
            },
            page: {
              limit: 20,
              afterCursor: 'cursor123'
            }
          }
        })
      );
    });

    test('should handle GraphQL errors', async () => {
      const errorMessage = 'GraphQL Error';
      mockClient.mockRequest.mockImplementation(() => Promise.reject(new Error(errorMessage)));

      await expect(service.listDAOs()).rejects.toThrow(`Failed to fetch DAOs: ${errorMessage}`);
    });

    test('should handle empty response', async () => {
      mockClient.mockRequest.mockImplementation(() => Promise.resolve({
        organizations: {
          nodes: [],
          pageInfo: { firstCursor: null, lastCursor: null }
        }
      }));

      const result = await service.listDAOs();
      expect(result.organizations.nodes).toHaveLength(0);
      
      const formatted = TallyService.formatDAOList(result.organizations.nodes);
      expect(formatted).toContain('Found 0 DAOs');
    });
  });
}); 