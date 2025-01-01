import { TallyService } from '../tally.service';

describe('TallyService - Delegates', () => {
  let tallyService: TallyService;

  beforeEach(() => {
    tallyService = new TallyService({
      apiKey: process.env.TALLY_API_KEY || 'test-api-key',
    });
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
    });

    it('should fetch delegates by organization slug', async () => {
      const result = await tallyService.listDelegates({
        organizationSlug: 'uniswap',
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result.delegates).toBeInstanceOf(Array);
      expect(result.delegates.length).toBeLessThanOrEqual(5);
    });

    it('should handle pagination correctly', async () => {
      // First page
      const firstPage = await tallyService.listDelegates({
        organizationSlug: 'uniswap',
        limit: 2,
      });

      expect(firstPage.delegates.length).toBe(2);
      expect(firstPage.pageInfo.lastCursor).toBeDefined();

      // Second page
      const secondPage = await tallyService.listDelegates({
        organizationSlug: 'uniswap',
        limit: 2,
        afterCursor: firstPage.pageInfo.lastCursor,
      });

      expect(secondPage.delegates.length).toBe(2);
      expect(secondPage.delegates[0].id).not.toBe(firstPage.delegates[0].id);
    });

    it('should apply filters correctly', async () => {
      const result = await tallyService.listDelegates({
        organizationSlug: 'uniswap',
        hasVotes: true,
        hasDelegators: true,
      });

      expect(result.delegates).toBeInstanceOf(Array);
      result.delegates.forEach(delegate => {
        expect(Number(delegate.votesCount)).toBeGreaterThan(0);
        expect(delegate.delegatorsCount).toBeGreaterThan(0);
      });
    });

    it('should throw error with invalid organization ID', async () => {
      await expect(
        tallyService.listDelegates({
          organizationId: 'invalid-id',
        })
      ).rejects.toThrow();
    });

    it('should throw error with invalid organization slug', async () => {
      await expect(
        tallyService.listDelegates({
          organizationSlug: 'this-dao-does-not-exist',
        })
      ).rejects.toThrow();
    });
  });
}); 