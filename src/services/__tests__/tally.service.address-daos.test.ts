import { TallyService } from '../tally.service';
import 'dotenv/config';

describe('TallyService - Address DAOs', () => {
  let service: TallyService;

  beforeAll(() => {
    service = new TallyService({
      apiKey: process.env.TALLY_API_KEY || '',
    });
  });

  it('should fetch DAOs where an address has participated in proposals', async () => {
    const address = '0x1234567890123456789012345678901234567890';
    const result = await service.getAddressDAOProposals({ address });
    
    expect(result).toBeDefined();
    expect(result.proposals).toBeDefined();
    expect(Array.isArray(result.proposals.nodes)).toBe(true);
    
    if (result.proposals.nodes.length > 0) {
      const proposal = result.proposals.nodes[0];
      expect(proposal.id).toBeDefined();
      expect(proposal.status).toBeDefined();
      expect(proposal.voteStats).toBeDefined();
    }
  });

  it('should handle pagination correctly', async () => {
    const address = '0x1234567890123456789012345678901234567890';
    const firstPage = await service.getAddressDAOProposals({ 
      address,
      limit: 2 
    });
    
    expect(firstPage.proposals.pageInfo).toBeDefined();
    
    if (firstPage.proposals.nodes.length === 2) {
      const lastCursor = firstPage.proposals.pageInfo.lastCursor;
      expect(lastCursor).toBeDefined();
      
      const secondPage = await service.getAddressDAOProposals({
        address,
        limit: 2,
        afterCursor: lastCursor
      });
      
      expect(secondPage.proposals.nodes).toBeDefined();
      expect(Array.isArray(secondPage.proposals.nodes)).toBe(true);
      
      if (secondPage.proposals.nodes.length > 0) {
        expect(secondPage.proposals.nodes[0].id).not.toBe(firstPage.proposals.nodes[0].id);
      }
    }
  });

  it('should handle invalid addresses gracefully', async () => {
    const address = 'invalid-address';
    await expect(service.getAddressDAOProposals({ address }))
      .rejects
      .toThrow();
  });

  it('should handle addresses with no interaction history', async () => {
    const address = '0x' + '1'.repeat(40);
    const result = await service.getAddressDAOProposals({ address });
    
    expect(result.proposals).toBeDefined();
    expect(Array.isArray(result.proposals.nodes)).toBe(true);
    expect(result.proposals.pageInfo).toBeDefined();
  });
}); 