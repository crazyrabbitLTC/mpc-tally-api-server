import { TallyService } from '../tally.service';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.TALLY_API_KEY;
if (!apiKey) {
  throw new Error('TALLY_API_KEY environment variable is required');
}

describe('TallyService - getDelegators', () => {
  const service = new TallyService({ apiKey });

  // Test constants
  const UNISWAP_ORG_ID = '2206072050458560434';
  const UNISWAP_SLUG = 'uniswap';
  const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

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

    // Results should be the same whether using ID or slug
    const resultWithId = await service.getDelegators({
      address: VITALIK_ADDRESS,
      organizationId: UNISWAP_ORG_ID,
      limit: 5,
      sortBy: 'votes',
      isDescending: true
    });

    // Compare the first delegator if exists
    if (result.delegators.length > 0 && resultWithId.delegators.length > 0) {
      expect(result.delegators[0].blockNumber).toBe(resultWithId.delegators[0].blockNumber);
      expect(result.delegators[0].votes).toBe(resultWithId.delegators[0].votes);
    }
  });

  it('should handle pagination correctly', async () => {
    // First page
    const firstPage = await service.getDelegators({
      address: VITALIK_ADDRESS,
      organizationSlug: UNISWAP_SLUG,
      limit: 2,
      sortBy: 'votes',
      isDescending: true
    });

    // If there's a lastCursor, fetch next page
    if (firstPage.pageInfo.lastCursor) {
      const secondPage = await service.getDelegators({
        address: VITALIK_ADDRESS,
        organizationSlug: UNISWAP_SLUG,
        limit: 2,
        afterCursor: firstPage.pageInfo.lastCursor,
        sortBy: 'votes',
        isDescending: true
      });

      expect(secondPage).toHaveProperty('delegators');
      expect(secondPage).toHaveProperty('pageInfo');
      
      // Ensure we got different results
      if (firstPage.delegators.length > 0 && secondPage.delegators.length > 0) {
        expect(firstPage.delegators[0].blockNumber).not.toBe(secondPage.delegators[0].blockNumber);
      }
    }
  });

  it('should handle sorting by id', async () => {
    const result = await service.getDelegators({
      address: VITALIK_ADDRESS,
      organizationSlug: UNISWAP_SLUG,
      limit: 5,
      sortBy: 'id',
      isDescending: true
    });

    expect(result).toHaveProperty('delegators');
    expect(Array.isArray(result.delegators)).toBe(true);
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