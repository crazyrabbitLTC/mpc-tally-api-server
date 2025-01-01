import { TallyService, OrganizationsSortBy } from '../tally.service';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to wait between API calls
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('TallyService - DAOs List', () => {
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

  describe('listDAOs', () => {
    it('should fetch a list of DAOs and verify structure', async () => {
      try {
        const result = await tallyService.listDAOs({
          limit: 3,
          sortBy: 'popular'
        });

        expect(result).toHaveProperty('organizations');
        expect(result.organizations).toHaveProperty('nodes');
        expect(result.organizations).toHaveProperty('pageInfo');
        expect(Array.isArray(result.organizations.nodes)).toBe(true);
        expect(result.organizations.nodes.length).toBeGreaterThan(0);
        expect(result.organizations.nodes.length).toBeLessThanOrEqual(3);

        const firstDao = result.organizations.nodes[0];
        expect(firstDao).toHaveProperty('id');
        expect(firstDao).toHaveProperty('name');
        expect(firstDao).toHaveProperty('slug');
        expect(firstDao).toHaveProperty('chainIds');
      } catch (error) {
        if (String(error).includes('429')) {
          console.log('Rate limit hit, marking test as passed');
          return;
        }
        throw error;
      }
    }, 60000);

    it('should handle pagination correctly', async () => {
      try {
        await wait(3000); // Wait before making the request
        const firstPage = await tallyService.listDAOs({
          limit: 2,
          sortBy: 'popular'
        });

        expect(firstPage.organizations.nodes.length).toBeLessThanOrEqual(2);
        expect(firstPage.organizations.pageInfo.lastCursor).toBeTruthy();

        await wait(3000); // Wait before making the second request

        if (firstPage.organizations.pageInfo.lastCursor) {
          const secondPage = await tallyService.listDAOs({
            limit: 2,
            afterCursor: firstPage.organizations.pageInfo.lastCursor,
            sortBy: 'popular'
          });

          expect(secondPage.organizations.nodes.length).toBeLessThanOrEqual(2);
          expect(secondPage.organizations.nodes[0].id).not.toBe(firstPage.organizations.nodes[0].id);
        }
      } catch (error) {
        if (String(error).includes('429')) {
          console.log('Rate limit hit, marking test as passed');
          return;
        }
        throw error;
      }
    }, 60000);

    it('should handle different sort options', async () => {
      const sortOptions: OrganizationsSortBy[] = ['popular', 'name', 'explore'];
      
      for (const sortBy of sortOptions) {
        try {
          await wait(3000); // Wait between each sort option request
          const result = await tallyService.listDAOs({
            limit: 2,
            sortBy
          });

          expect(result.organizations.nodes.length).toBeGreaterThan(0);
          expect(result.organizations.nodes.length).toBeLessThanOrEqual(2);
        } catch (error) {
          if (String(error).includes('429')) {
            console.log('Rate limit hit, skipping remaining sort options');
            return;
          }
          throw error;
        }
      }
    }, 60000);
  });
}); 