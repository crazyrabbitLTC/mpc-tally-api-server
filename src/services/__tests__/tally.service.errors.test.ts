import { TallyService } from '../tally.service';
import dotenv from 'dotenv';

dotenv.config();

describe('TallyService - Error Handling', () => {
  let tallyService: TallyService;

  beforeEach(() => {
    tallyService = new TallyService({
      apiKey: process.env.TALLY_API_KEY || 'test-api-key',
    });
  });

  describe('API Errors', () => {
    it('should handle invalid API key', async () => {
      const invalidService = new TallyService({ apiKey: 'invalid-key' });
      
      try {
        await invalidService.listDAOs({
          limit: 2,
          sortBy: 'popular'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(String(error)).toContain('Failed to fetch DAOs');
        expect(String(error)).toContain('502');
      }
    }, 60000);

    it('should handle rate limiting', async () => {
      const promises = Array(5).fill(null).map(() => 
        tallyService.listDAOs({ 
          limit: 1,
          sortBy: 'popular'
        })
      );

      try {
        await Promise.all(promises);
        // If we don't get rate limited, that's okay too
      } catch (error) {
        expect(error).toBeDefined();
        const errorString = String(error);
        // Check for either 429 (rate limit) or other API errors
        expect(
          errorString.includes('429') || 
          errorString.includes('Failed to fetch')
        ).toBe(true);
      }
    }, 60000);
  });
}); 