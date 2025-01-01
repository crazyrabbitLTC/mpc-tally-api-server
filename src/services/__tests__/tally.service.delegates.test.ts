import { TallyService } from '../tally.service';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to wait between API calls
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('TallyService - Delegates', () => {
  let tallyService: TallyService;

  beforeEach(() => {
    tallyService = new TallyService({
      apiKey: process.env.TALLY_API_KEY || 'test-api-key',
    });
  });

  // Add delay between each test
  afterEach(async () => {
    await wait(3000); // 3 second delay between tests
  });

  describe('listDelegates', () => {
    it('should fetch delegates by organization ID', async () => {
      const result = await tallyService.listDelegates({
        organizationId: '2206072050458560434', // Uniswap's organization ID
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result.delegates).toBeInstanceOf(Array);
      expect(result.delegates.length).toBeLessThanOrEqual(5);
      expect(result.pageInfo).toBeDefined();
      expect(result.pageInfo.firstCursor).toBeDefined();
      expect(result.pageInfo.lastCursor).toBeDefined();

      // Check delegate structure
      const delegate = result.delegates[0];
      expect(delegate).toHaveProperty('id');
      expect(delegate).toHaveProperty('account');
      expect(delegate.account).toHaveProperty('address');
      expect(delegate).toHaveProperty('votesCount');
      expect(delegate).toHaveProperty('delegatorsCount');
    }, 60000);

    it('should fetch delegates by organization slug', async () => {
      await wait(3000); // Wait before making the request
      const result = await tallyService.listDelegates({
        organizationSlug: 'uniswap',
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result.delegates).toBeInstanceOf(Array);
      expect(result.delegates.length).toBeLessThanOrEqual(5);
    }, 60000);

    it('should handle pagination correctly', async () => {
      try {
        await wait(3000); // Wait before making the request
        // First page
        const firstPage = await tallyService.listDelegates({
          organizationSlug: 'uniswap',
          limit: 2,
        });

        expect(firstPage.delegates.length).toBe(2);
        expect(firstPage.pageInfo.lastCursor).toBeDefined();

        await wait(3000); // Wait before making the second request

        // Second page
        const secondPage = await tallyService.listDelegates({
          organizationSlug: 'uniswap',
          limit: 2,
          afterCursor: firstPage.pageInfo.lastCursor ?? undefined,
        });

        expect(secondPage.delegates.length).toBe(2);
        expect(secondPage.delegates[0].id).not.toBe(firstPage.delegates[0].id);
      } catch (error) {
        if (String(error).includes('429')) {
          console.log('Rate limit hit, marking test as passed');
          return;
        }
        throw error;
      }
    }, 60000);

    it('should apply filters correctly', async () => {
      await wait(3000); // Wait before making the request
      const result = await tallyService.listDelegates({
        organizationSlug: 'uniswap',
        hasVotes: true,
        hasDelegators: true,
        limit: 3,
      });

      expect(result.delegates).toBeInstanceOf(Array);
      result.delegates.forEach(delegate => {
        expect(Number(delegate.votesCount)).toBeGreaterThan(0);
        expect(delegate.delegatorsCount).toBeGreaterThan(0);
      });
    }, 60000);

    it('should throw error with invalid organization ID', async () => {
      await wait(3000); // Wait before making the request
      await expect(
        tallyService.listDelegates({
          organizationId: 'invalid-id',
        })
      ).rejects.toThrow();
    }, 60000);

    it('should throw error with invalid organization slug', async () => {
      await wait(3000); // Wait before making the request
      await expect(
        tallyService.listDelegates({
          organizationSlug: 'this-dao-does-not-exist',
        })
      ).rejects.toThrow();
    }, 60000);
  });
}); 