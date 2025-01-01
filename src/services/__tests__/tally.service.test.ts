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

  test('should fetch a specific DAO from the live API', async () => {
    try {
      const dao = await service.getDAO('aave');
      console.log('Live DAO Response:', dao);
      expect(dao).toHaveProperty('id');
      expect(dao).toHaveProperty('name');
      expect(dao).toHaveProperty('metadata');
      expect(dao.slug).toBe('aave');
      
      const formatted = TallyService.formatDAO(dao);
      console.log('Formatted DAO:\n', formatted);
      expect(formatted).toContain('Aave');
      expect(formatted).toContain('Token Holders:');
      expect(formatted).toContain('Delegates:');
    } catch (error) {
      console.error('Error fetching DAO from live API:', error);
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
      tokenIds: ['eip155:1/erc20:0x123'],
      governorIds: ['eip155:1:0x456'],
      metadata: {
        description: 'Test Description',
        icon: 'https://icon.com',
        websiteUrl: 'https://test.com',
        discord: 'discord.gg/test',
        twitter: '@test',
        socials: {
          website: 'https://test.com',
          discord: 'discord.gg/test',
          twitter: '@test',
          telegram: null,
          discourse: null,
          others: null
        },
        karmaName: null
      },
      features: [],
      hasActiveProposals: false,
      proposalsCount: 0,
      delegatesCount: 0,
      tokenOwnersCount: 0,
      stats: {
        proposalsCount: 0,
        activeProposalsCount: 0,
        tokenHoldersCount: 0,
        votersCount: 0,
        delegatesCount: 0,
        delegatedVotesCount: '0'
      }
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

  describe('getDAO', () => {
    const mockOrganization: Organization = {
      id: '1',
      slug: 'test-dao',
      name: 'Test DAO',
      chainIds: ['eip155:1'],
      tokenIds: ['eip155:1/erc20:0x123'],
      governorIds: ['eip155:1:0x456'],
      metadata: {
        description: 'Test Description',
        icon: 'https://icon.com',
        websiteUrl: 'https://test.com',
        discord: 'discord.gg/test',
        twitter: '@test',
        socials: {
          website: 'https://test.com',
          discord: 'discord.gg/test',
          twitter: '@test',
          telegram: null,
          discourse: null,
          others: null
        },
        karmaName: null
      },
      features: [],
      hasActiveProposals: false,
      proposalsCount: 0,
      delegatesCount: 0,
      tokenOwnersCount: 0,
      stats: {
        proposalsCount: 0,
        activeProposalsCount: 0,
        tokenHoldersCount: 0,
        votersCount: 0,
        delegatesCount: 0,
        delegatedVotesCount: '0'
      }
    };

    test('should fetch a specific DAO by slug', async () => {
      mockClient.mockRequest.mockImplementation(() => Promise.resolve({
        organization: mockOrganization
      }));

      const result = await service.getDAO('test-dao');
      expect(result).toEqual(mockOrganization);
      expect(mockClient.mockRequest).toHaveBeenCalledWith(
        TallyService.GET_DAO_QUERY,
        {
          input: { slug: 'test-dao' }
        }
      );
    });

    test('should throw error when DAO is not found', async () => {
      mockClient.mockRequest.mockImplementation(() => Promise.resolve({
        organizations: {
          nodes: []
        }
      }));

      await expect(service.getDAO('non-existent')).rejects.toThrow('DAO not found: non-existent');
    });

    test('should handle API errors', async () => {
      const errorMessage = 'API Error';
      mockClient.mockRequest.mockImplementation(() => Promise.reject(new Error(errorMessage)));

      await expect(service.getDAO('test-dao')).rejects.toThrow(`Failed to fetch DAO: ${errorMessage}`);
    });

    test('should format DAO details correctly', () => {
      const formatted = TallyService.formatDAO(mockOrganization);
      
      expect(formatted).toContain('Test DAO (test-dao)');
      expect(formatted).toContain('Token Holders: 0');
      expect(formatted).toContain('Delegates: 0');
      expect(formatted).toContain('Proposals: 0');
      expect(formatted).toContain('Active Proposals: No');
      expect(formatted).toContain('Description: Test Description');
      expect(formatted).toContain('Website: https://test.com');
      expect(formatted).toContain('Twitter: @test');
      expect(formatted).toContain('Discord: discord.gg/test');
      expect(formatted).toContain('Chain IDs: eip155:1');
      expect(formatted).toContain('Token IDs: eip155:1/erc20:0x123');
      expect(formatted).toContain('Governor IDs: eip155:1:0x456');
    });

    test('should handle missing optional fields in formatting', () => {
      const minimalDao: Organization = {
        id: '1',
        slug: 'minimal-dao',
        name: 'Minimal DAO',
        chainIds: ['eip155:1'],
        hasActiveProposals: false,
        proposalsCount: 0,
        delegatesCount: 0,
        tokenOwnersCount: 0
      };

      const formatted = TallyService.formatDAO(minimalDao);
      
      expect(formatted).toContain('Minimal DAO (minimal-dao)');
      expect(formatted).toContain('Description: No description available');
      expect(formatted).toContain('Website: N/A');
      expect(formatted).toContain('Twitter: N/A');
      expect(formatted).toContain('Discord: N/A');
      expect(formatted).toContain('GitHub: N/A');
      expect(formatted).toContain('Token IDs: N/A');
      expect(formatted).toContain('Governor IDs: N/A');
    });
  });
}); 