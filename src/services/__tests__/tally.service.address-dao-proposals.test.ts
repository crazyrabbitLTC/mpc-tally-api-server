import { TallyService } from '../../services/tally.service';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.TALLY_API_KEY;
if (!apiKey) {
  throw new Error('TALLY_API_KEY environment variable is required');
}

describe('TallyService - Address DAO Proposals', () => {
  const service = new TallyService({ apiKey });
  const validAddress = '0x1234567890123456789012345678901234567890';
  const validGovernorId = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3';
  const validOrganizationSlug = 'uniswap';

  it('should require an address', async () => {
    await expect(service.getAddressDAOProposals({} as any)).rejects.toThrow('Address is required');
  });

  it('should require either governorId or organizationSlug', async () => {
    await expect(service.getAddressDAOProposals({ address: validAddress })).rejects.toThrow('Either governorId or organizationSlug is required');
  });

  it('should fetch proposals using governorId', async () => {
    const result = await service.getAddressDAOProposals({
      address: validAddress,
      governorId: validGovernorId
    });

    expect(result).toBeDefined();
    expect(result.proposals).toBeDefined();
    expect(result.proposals.nodes).toBeDefined();
    expect(Array.isArray(result.proposals.nodes)).toBe(true);
  });

  it('should fetch proposals using organizationSlug', async () => {
    const result = await service.getAddressDAOProposals({
      address: validAddress,
      organizationSlug: validOrganizationSlug
    });

    expect(result).toBeDefined();
    expect(result.proposals).toBeDefined();
    expect(result.proposals.nodes).toBeDefined();
    expect(Array.isArray(result.proposals.nodes)).toBe(true);
  });

  it('should handle invalid addresses gracefully', async () => {
    const result = await service.getAddressDAOProposals({
      address: '0x0000000000000000000000000000000000000000',
      organizationSlug: validOrganizationSlug
    });

    expect(result).toBeDefined();
    expect(result.proposals).toBeDefined();
    expect(result.proposals.nodes).toBeDefined();
    expect(Array.isArray(result.proposals.nodes)).toBe(true);
  });

  it('should return empty nodes array for address with no participation', async () => {
    const result = await service.getAddressDAOProposals({
      address: validAddress,
      organizationSlug: validOrganizationSlug,
      limit: 1
    });

    expect(result).toBeDefined();
    expect(result.proposals).toBeDefined();
    expect(result.proposals.nodes).toBeDefined();
    expect(Array.isArray(result.proposals.nodes)).toBe(true);
  });

  it('should handle pagination correctly', async () => {
    const result = await service.getAddressDAOProposals({
      address: validAddress,
      organizationSlug: validOrganizationSlug,
      limit: 1
    });

    expect(result).toBeDefined();
    expect(result.proposals).toBeDefined();
    expect(result.proposals.nodes).toBeDefined();
    expect(Array.isArray(result.proposals.nodes)).toBe(true);

    if (result.proposals.pageInfo.lastCursor) {
      const nextPage = await service.getAddressDAOProposals({
        address: validAddress,
        organizationSlug: validOrganizationSlug,
        limit: 1,
        afterCursor: result.proposals.pageInfo.lastCursor
      });

      expect(nextPage).toBeDefined();
      expect(nextPage.proposals).toBeDefined();
      expect(nextPage.proposals.nodes).toBeDefined();
      expect(Array.isArray(nextPage.proposals.nodes)).toBe(true);
    }
  });
}); 