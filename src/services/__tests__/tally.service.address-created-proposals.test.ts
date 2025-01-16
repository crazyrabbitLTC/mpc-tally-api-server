import { TallyService } from '../tally.service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('TallyService - Address Created Proposals', () => {
  let service: TallyService;

  beforeAll(() => {
    const apiKey = process.env.TALLY_API_KEY;
    if (!apiKey) {
      throw new Error('TALLY_API_KEY environment variable is required for tests');
    }
    console.log('Using API key:', apiKey.substring(0, 8) + '...');
    service = new TallyService({ apiKey });
  });

  it('should require an address', async () => {
    // @ts-expect-error Testing invalid input
    await expect(service.getAddressCreatedProposals({})).rejects.toThrow(
      'address is required'
    );
  });

  it('should fetch proposals created by an address', async () => {
    const result = await service.getAddressCreatedProposals({
      address: '0x1234567890123456789012345678901234567890'
    });

    expect(result).toBeDefined();
    expect(result.proposals).toBeDefined();
    expect(result.proposals.pageInfo).toBeDefined();
    if (result.proposals.nodes.length > 0) {
      const proposal = result.proposals.nodes[0];
      expect(proposal.id).toBeDefined();
      expect(proposal.metadata.title).toBeDefined();
      expect(proposal.status).toBeDefined();
      expect(proposal.proposer.address).toBeDefined();
      expect(proposal.governor.organization.slug).toBeDefined();
      expect(proposal.voteStats.votesCount).toBeDefined();
    }
  });

  it('should handle invalid addresses gracefully', async () => {
    await expect(
      service.getAddressCreatedProposals({
        address: 'invalid-address'
      })
    ).rejects.toThrow('Failed to fetch created proposals');
  });

  it('should return empty nodes array for address with no proposals', async () => {
    const result = await service.getAddressCreatedProposals({
      address: '0x0000000000000000000000000000000000000000'
    });

    expect(result).toBeDefined();
    expect(result.proposals.nodes).toHaveLength(0);
    expect(result.proposals.pageInfo).toBeDefined();
  });

  it('should handle pagination correctly', async () => {
    const firstPage = await service.getAddressCreatedProposals({
      address: '0x1234567890123456789012345678901234567890',
      limit: 1
    });

    expect(firstPage.proposals.nodes.length).toBeLessThanOrEqual(1);

    if (firstPage.proposals.nodes.length === 1 && firstPage.proposals.pageInfo.lastCursor) {
      const secondPage = await service.getAddressCreatedProposals({
        address: '0x1234567890123456789012345678901234567890',
        limit: 1,
        afterCursor: firstPage.proposals.pageInfo.lastCursor
      });

      expect(secondPage.proposals.nodes.length).toBeLessThanOrEqual(1);
      if (secondPage.proposals.nodes.length === 1) {
        expect(secondPage.proposals.nodes[0].id).not.toBe(firstPage.proposals.nodes[0].id);
      }
    }
  });
}); 