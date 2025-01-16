import { TallyService } from '../tally.service';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('TallyService - Address Votes', () => {
  let service: TallyService;

  beforeAll(() => {
    const apiKey = process.env.TALLY_API_KEY;
    if (!apiKey) {
      throw new Error('TALLY_API_KEY environment variable is required for tests');
    }
    console.log('Using API key:', apiKey.substring(0, 8) + '...');
    service = new TallyService({ apiKey });
  });

  it('should require an organizationSlug', async () => {
    // @ts-expect-error Testing invalid input
    await expect(service.getAddressVotes({ address: '0x123' })).rejects.toThrow(
      'organizationSlug is required'
    );
  });

  it('should fetch votes cast by an address in a specific organization', async () => {
    const result = await service.getAddressVotes({
      address: '0x1234567890123456789012345678901234567890',
      organizationSlug: 'uniswap'
    });

    expect(result).toBeDefined();
    expect(result.votes).toBeDefined();
    expect(result.votes.pageInfo).toBeDefined();
    if (result.votes.nodes.length > 0) {
      const vote = result.votes.nodes[0];
      expect(vote.id).toBeDefined();
      expect(vote.type).toBeDefined();
      expect(vote.amount).toBeDefined();
    }
  });

  it('should handle invalid organization slugs gracefully', async () => {
    await expect(
      service.getAddressVotes({
        address: '0x1234567890123456789012345678901234567890',
        organizationSlug: 'invalid-org'
      })
    ).rejects.toThrow('Failed to fetch DAO');
  });

  it('should handle invalid addresses gracefully', async () => {
    await expect(
      service.getAddressVotes({
        address: 'invalid-address',
        organizationSlug: 'uniswap'
      })
    ).rejects.toThrow('Failed to fetch address votes');
  });

  it('should return empty nodes array for address with no votes', async () => {
    const result = await service.getAddressVotes({
      address: '0x0000000000000000000000000000000000000000',
      organizationSlug: 'uniswap'
    });

    expect(result).toBeDefined();
    expect(result.votes.nodes).toHaveLength(0);
    expect(result.votes.pageInfo).toBeDefined();
  });
}); 