import { TallyService } from '../tally.service';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.TALLY_API_KEY;
if (!apiKey) {
  throw new Error('TALLY_API_KEY environment variable is required');
}

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('TallyService - getDelegators', () => {
  const service = new TallyService({ apiKey });

  // Test constants
  const UNISWAP_ORG_ID = '2206072050458560434';
  const UNISWAP_SLUG = 'uniswap';
  const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  // Add delay between each test
  beforeEach(async () => {
    await delay(1000); // 1 second delay between tests
  });

  it('should fetch delegators using organization ID', async () => {
    const result = await service.getDelegators({
      address: VITALIK_ADDRESS,
      organizationId: UNISWAP_ORG_ID,
      limit: 5,
      sortBy: 'votes',
      isDescending: true
    });

    // Check response structure
    expect(result).toHaveProperty('delegators');
    expect(result).toHaveProperty('pageInfo');
    expect(Array.isArray(result.delegators)).toBe(true);
    
    // Check pageInfo structure
    expect(result.pageInfo).toHaveProperty('firstCursor');
    expect(result.pageInfo).toHaveProperty('lastCursor');

    // If there are delegators, check their structure
    if (result.delegators.length > 0) {
      const delegation = result.delegators[0];
      expect(delegation).toHaveProperty('chainId');
      expect(delegation).toHaveProperty('delegator');
      expect(delegation).toHaveProperty('blockNumber');
      expect(delegation).toHaveProperty('blockTimestamp');
      expect(delegation).toHaveProperty('votes');
      
      // Check delegator structure
      expect(delegation.delegator).toHaveProperty('address');
      
      // Check token structure if present
      if (delegation.token) {
        expect(delegation.token).toHaveProperty('id');
        expect(delegation.token).toHaveProperty('name');
        expect(delegation.token).toHaveProperty('symbol');
        expect(delegation.token).toHaveProperty('decimals');
      }
    }
  });

  it('should fetch delegators using organization slug', async () => {
    const result = await service.getDelegators({
      address: VITALIK_ADDRESS,
      organizationSlug: UNISWAP_SLUG,
      limit: 5,
      sortBy: 'votes',
      isDescending: true
    });

    expect(result).toHaveProperty('delegators');
    expect(result).toHaveProperty('pageInfo');
    expect(Array.isArray(result.delegators)).toBe(true);

    await delay(1000); // Add delay before second API call

    // Results should be the same whether using ID or slug
    const resultWithId = await service.getDelegators({
      address: VITALIK_ADDRESS,
      organizationId: UNISWAP_ORG_ID,
      limit: 5,
      sortBy: 'votes',
      isDescending: true
    });

    // Compare the results after sorting by blockNumber to ensure consistent comparison
    const sortByBlockNumber = (a: any, b: any) => a.blockNumber - b.blockNumber;
    const sortedSlugResults = [...result.delegators].sort(sortByBlockNumber);
    const sortedIdResults = [...resultWithId.delegators].sort(sortByBlockNumber);

    // Compare the first delegator if exists
    if (sortedSlugResults.length > 0 && sortedIdResults.length > 0) {
      expect(sortedSlugResults[0].blockNumber).toBe(sortedIdResults[0].blockNumber);
      expect(sortedSlugResults[0].votes).toBe(sortedIdResults[0].votes);
    }
  });

  it('should handle pagination correctly', async () => {
    // First page with smaller limit to ensure multiple pages
    const firstPage = await service.getDelegators({
      address: VITALIK_ADDRESS,
      organizationId: UNISWAP_ORG_ID, // Using ID instead of slug for consistency
      limit: 1, // Request just 1 item to ensure we have more pages
      sortBy: 'votes',
      isDescending: true
    });

    // Verify first page structure
    expect(firstPage).toHaveProperty('delegators');
    expect(firstPage).toHaveProperty('pageInfo');
    expect(Array.isArray(firstPage.delegators)).toBe(true);
    expect(firstPage.delegators.length).toBe(1); // Should have exactly 1 item
    expect(firstPage.pageInfo).toHaveProperty('firstCursor');
    expect(firstPage.pageInfo).toHaveProperty('lastCursor');
    expect(firstPage.pageInfo.lastCursor).toBeTruthy(); // Ensure we have a cursor for next page
    
    // Store first page data for comparison
    const firstPageDelegator = firstPage.delegators[0];
    
    await delay(1000); // Add delay before fetching second page

    // Only proceed if we have a valid cursor
    if (firstPage.pageInfo.lastCursor) {
      // Fetch second page using lastCursor from first page
      const secondPage = await service.getDelegators({
        address: VITALIK_ADDRESS,
        organizationId: UNISWAP_ORG_ID,
        limit: 1,
        afterCursor: firstPage.pageInfo.lastCursor,
        sortBy: 'votes',
        isDescending: true
      });

      // Verify second page structure
      expect(secondPage).toHaveProperty('delegators');
      expect(secondPage).toHaveProperty('pageInfo');
      expect(Array.isArray(secondPage.delegators)).toBe(true);

      // If we got results in second page, verify they're different
      if (secondPage.delegators.length > 0) {
        const secondPageDelegator = secondPage.delegators[0];
        // Ensure we got a different delegator
        expect(secondPageDelegator.delegator.address).not.toBe(firstPageDelegator.delegator.address);
        // Since we sorted by votes descending, second page votes should be less than or equal
        expect(BigInt(secondPageDelegator.votes) <= BigInt(firstPageDelegator.votes)).toBe(true);
      }
    }
  });

  it('should handle sorting by blockNumber', async () => {
    const result = await service.getDelegators({
      address: VITALIK_ADDRESS,
      organizationSlug: UNISWAP_SLUG,
      limit: 5,
      sortBy: 'votes',
      isDescending: true
    });

    expect(result).toHaveProperty('delegators');
    expect(Array.isArray(result.delegators)).toBe(true);

    // Verify the results are sorted
    if (result.delegators.length > 1) {
      const votes = result.delegators.map(d => BigInt(d.votes));
      const isSorted = votes.every((v, i) => i === 0 || v <= votes[i - 1]);
      expect(isSorted).toBe(true);
    }
  });

  it('should handle errors for invalid address', async () => {
    await expect(service.getDelegators({
      address: 'invalid-address',
      organizationSlug: UNISWAP_SLUG
    })).rejects.toThrow();
  });

  it('should handle errors for invalid organization slug', async () => {
    await expect(service.getDelegators({
      address: VITALIK_ADDRESS,
      organizationSlug: 'invalid-org-slug'
    })).rejects.toThrow();
  });

  it('should handle errors when neither organizationId/Slug nor governorId is provided', async () => {
    await expect(service.getDelegators({
      address: VITALIK_ADDRESS
    })).rejects.toThrow('Either organizationId/organizationSlug or governorId must be provided');
  });

  it('should format delegators list correctly', () => {
    const mockDelegators = [{
      chainId: 'eip155:1',
      delegator: {
        address: '0x123',
        name: 'Test Delegator',
        ens: 'test.eth'
      },
      blockNumber: 12345,
      blockTimestamp: '2023-01-01T00:00:00Z',
      votes: '1000000000000000000',
      token: {
        id: 'token-id',
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18
      }
    }];

    const formatted = TallyService.formatDelegatorsList(mockDelegators);
    expect(typeof formatted).toBe('string');
    expect(formatted).toContain('Test Delegator');
    expect(formatted).toContain('0x123');
    expect(formatted).toContain('Test Token');
  });
}); 