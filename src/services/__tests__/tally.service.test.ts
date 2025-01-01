import { TallyService } from '../tally.service';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.TALLY_API_KEY;
if (!apiKey) {
  throw new Error('TALLY_API_KEY environment variable is required');
}

describe('TallyService', () => {
  let tallyService: TallyService;

  beforeAll(() => {
    tallyService = new TallyService({ apiKey });
  });

  describe('getDAO', () => {
    it('should fetch Uniswap DAO details', async () => {
      const dao = await tallyService.getDAO('uniswap');
      expect(dao).toBeDefined();
      expect(dao.name).toBe('Uniswap');
      expect(dao.slug).toBe('uniswap');
      expect(dao.chainIds).toContain('eip155:1');
      expect(dao.governorIds).toBeDefined();
      expect(dao.tokenIds).toBeDefined();
      expect(dao.metadata).toBeDefined();
      if (dao.metadata) {
        expect(dao.metadata.icon).toBeDefined();
      }
    }, 30000);
  });

  describe('listDelegates', () => {
    it('should fetch delegates for Uniswap', async () => {
      const result = await tallyService.listDelegates({
        organizationSlug: 'uniswap',
        limit: 20,
        hasVotes: true
      });

      // Check the structure of the response
      expect(result).toHaveProperty('delegates');
      expect(result).toHaveProperty('pageInfo');
      expect(Array.isArray(result.delegates)).toBe(true);
      
      // Check that we got some delegates
      expect(result.delegates.length).toBeGreaterThan(0);

      // Check the structure of a delegate
      const firstDelegate = result.delegates[0];
      expect(firstDelegate).toHaveProperty('id');
      expect(firstDelegate).toHaveProperty('account');
      expect(firstDelegate).toHaveProperty('votesCount');
      expect(firstDelegate).toHaveProperty('delegatorsCount');
      
      // Check account properties
      expect(firstDelegate.account).toHaveProperty('address');
      expect(typeof firstDelegate.account.address).toBe('string');
      
      // Check that votesCount is a string (since it's a large number)
      expect(typeof firstDelegate.votesCount).toBe('string');
      
      // Check that delegatorsCount is a number
      expect(typeof firstDelegate.delegatorsCount).toBe('number');

      // Log the first delegate for manual inspection
    }, 30000);

    it('should handle pagination correctly', async () => {
      // First page
      const firstPage = await tallyService.listDelegates({
        organizationSlug: 'uniswap',
        limit: 10
      });

      expect(firstPage.delegates.length).toBeLessThanOrEqual(10);
      expect(firstPage.pageInfo.lastCursor).toBeTruthy();

      // Second page using the cursor only if it's not null
      if (firstPage.pageInfo.lastCursor) {
        const secondPage = await tallyService.listDelegates({
          organizationSlug: 'uniswap',
          limit: 10,
          afterCursor: firstPage.pageInfo.lastCursor
        });

        expect(secondPage.delegates.length).toBeLessThanOrEqual(10);
        expect(secondPage.delegates[0].id).not.toBe(firstPage.delegates[0].id);
      }
    }, 30000);
  });
}); 