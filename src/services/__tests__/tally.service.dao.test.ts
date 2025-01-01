import { TallyService } from '../tally.service';
import { GraphQLClient } from 'graphql-request';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import dotenv from 'dotenv';

dotenv.config();

describe('TallyService - DAO', () => {
  let tallyService: TallyService;

  beforeEach(() => {
    tallyService = new TallyService({
      apiKey: process.env.TALLY_API_KEY || 'test-api-key',
    });
  });

  describe('getDAO', () => {
    it('should fetch complete DAO details', async () => {
      const dao = await tallyService.getDAO('uniswap');
      
      // Basic DAO properties
      expect(dao).toBeDefined();
      expect(dao.id).toBe('2206072050458560434');
      expect(dao.name).toBe('Uniswap');
      expect(dao.slug).toBe('uniswap');
      
      // Chain and contract IDs
      expect(dao.chainIds).toEqual(['eip155:1']);
      expect(dao.governorIds).toEqual(['eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3']);
      expect(dao.tokenIds).toEqual(['eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984']);
      
      // Stats and counters
      expect(typeof dao.proposalsCount).toBe('number');
      expect(dao.proposalsCount).toBeGreaterThanOrEqual(67);
      expect(typeof dao.delegatesCount).toBe('number');
      expect(dao.delegatesCount).toBeGreaterThanOrEqual(45989);
      expect(typeof dao.tokenOwnersCount).toBe('number');
      expect(dao.tokenOwnersCount).toBeGreaterThanOrEqual(356805);
      expect(typeof dao.hasActiveProposals).toBe('boolean');
      
      // Metadata
      expect(dao.metadata).toBeDefined();
      if (dao.metadata) {
        expect(dao.metadata.description).toBe('Uniswap is a decentralized protocol for automated liquidity provision on Ethereum.');
        expect(dao.metadata.icon).toMatch(/^https:\/\/static\.tally\.xyz\/.+/);
        
        // Check if socials exist in metadata
        expect(dao.metadata.socials).toBeDefined();
        if (dao.metadata.socials) {
          expect(dao.metadata.socials.website).toBeDefined();
          expect(dao.metadata.socials.discord).toBeDefined();
          expect(dao.metadata.socials.twitter).toBeDefined();
        }
      }

      // Features
      expect(Array.isArray(dao.features)).toBe(true);
      if (dao.features) {
        expect(dao.features).toHaveLength(2);
        expect(dao.features[0]).toEqual({
          name: 'EXCLUDE_TALLY_FEE',
          enabled: true
        });
        expect(dao.features[1]).toEqual({
          name: 'SHOW_UNISTAKER',
          enabled: true
        });
      }
    }, 60000);

    it('should handle non-existent DAO gracefully', async () => {
      const nonExistentSlug = 'non-existent-dao-123456789';
      
      try {
        await tallyService.getDAO(nonExistentSlug);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(String(error)).toContain('Failed to fetch DAO');
        expect(String(error)).toContain('Organization not found');
      }
    }, 60000);

    it('should handle invalid API responses', async () => {
      // Create a mock service that will throw an error
      const mockService = new TallyService({ 
        apiKey: 'invalid-key',
        baseUrl: 'https://invalid-url.example.com'
      });
      
      try {
        await mockService.getDAO('uniswap');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        const errorString = String(error);
        expect(
          errorString.includes('Failed to fetch DAO') || 
          errorString.includes('ENOTFOUND')
        ).toBe(true);
      }
    }, 10000);
  });
}); 