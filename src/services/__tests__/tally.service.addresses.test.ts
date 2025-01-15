import { TallyService } from '../tally.service';
import dotenv from 'dotenv';

dotenv.config();

describe('TallyService - Addresses', () => {
  let tallyService: TallyService;

  beforeEach(() => {
    tallyService = new TallyService({
      apiKey: process.env.TALLY_API_KEY || 'test-api-key',
    });
  });

  describe('getAddressProposals', () => {
    it('should fetch proposals created by an address in Uniswap', async () => {
      // Using a known address that has created proposals (Uniswap Governance)
      const result = await tallyService.getAddressProposals({
        address: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result.proposals).toBeDefined();
      expect(result.proposals.nodes).toBeInstanceOf(Array);
      expect(result.proposals.nodes.length).toBeLessThanOrEqual(5);
      expect(result.proposals.pageInfo).toBeDefined();

      // Check proposal structure
      if (result.proposals.nodes.length > 0) {
        const proposal = result.proposals.nodes[0];
        expect(proposal).toHaveProperty('id');
        expect(proposal).toHaveProperty('onchainId');
        expect(proposal).toHaveProperty('metadata');
        expect(proposal).toHaveProperty('status');
        expect(proposal).toHaveProperty('voteStats');
      }
    }, 60000);

    it('should handle pagination correctly', async () => {
      // First page
      const firstPage = await tallyService.getAddressProposals({
        address: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
        limit: 2,
      });

      expect(firstPage.proposals.nodes.length).toBeLessThanOrEqual(2);
      expect(firstPage.proposals.pageInfo).toBeDefined();

      if (firstPage.proposals.nodes.length === 2 && firstPage.proposals.pageInfo.lastCursor) {
        // Second page
        const secondPage = await tallyService.getAddressProposals({
          address: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
          limit: 2,
          afterCursor: firstPage.proposals.pageInfo.lastCursor,
        });

        expect(secondPage.proposals.nodes.length).toBeLessThanOrEqual(2);
        if (secondPage.proposals.nodes.length > 0 && firstPage.proposals.nodes.length > 0) {
          expect(secondPage.proposals.nodes[0].id).not.toBe(firstPage.proposals.nodes[0].id);
        }
      }
    }, 60000);

    it('should handle invalid address gracefully', async () => {
      await expect(
        tallyService.getAddressProposals({
          address: 'invalid-address',
        })
      ).rejects.toThrow();
    });

    it('should handle address with no proposals', async () => {
      const result = await tallyService.getAddressProposals({
        address: '0x0000000000000000000000000000000000000000',
      });

      expect(result.proposals.nodes).toBeInstanceOf(Array);
      expect(result.proposals.nodes.length).toBe(0);
    }, 60000);
  });
}); 