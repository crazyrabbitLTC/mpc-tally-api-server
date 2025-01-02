import { TallyService } from '../tally.service';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.TALLY_API_KEY;
if (!apiKey) {
  throw new Error('TALLY_API_KEY environment variable is required');
}

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('TallyService - Proposals', () => {
  const service = new TallyService({ apiKey });

  // Test constants
  const UNISWAP_ORG_ID = '2206072050458560434';
  const UNISWAP_GOVERNOR_ID = 'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3';

  // Add delay between each test
  beforeEach(async () => {
    await delay(1000); // 1 second delay between tests
  });

  describe('listProposals', () => {
    it('should list proposals with basic filters', async () => {
      const result = await service.listProposals({
        filters: {
          organizationId: UNISWAP_ORG_ID
        },
        page: {
          limit: 5
        }
      });

      // Check response structure
      expect(result).toHaveProperty('proposals');
      expect(result.proposals).toHaveProperty('nodes');
      expect(Array.isArray(result.proposals.nodes)).toBe(true);

      // If there are proposals, check their structure
      if (result.proposals.nodes.length > 0) {
        const proposal = result.proposals.nodes[0];
        expect(proposal).toHaveProperty('id');
        expect(proposal).toHaveProperty('onchainId');
        expect(proposal).toHaveProperty('status');
        expect(proposal).toHaveProperty('metadata');
        expect(proposal).toHaveProperty('voteStats');
        expect(proposal).toHaveProperty('governor');

        // Check metadata structure
        expect(proposal.metadata).toHaveProperty('title');
        expect(proposal.metadata).toHaveProperty('description');

        // Check governor structure
        expect(proposal.governor).toHaveProperty('id');
        expect(proposal.governor).toHaveProperty('name');
        expect(proposal.governor.organization).toHaveProperty('name');
        expect(proposal.governor.organization).toHaveProperty('slug');
      }
    });

    it('should handle pagination correctly', async () => {
      // First page with smaller limit
      const firstPage = await service.listProposals({
        filters: {
          organizationId: UNISWAP_ORG_ID
        },
        page: {
          limit: 2
        }
      });

      expect(firstPage.proposals.nodes.length).toBe(2);
      expect(firstPage.proposals.pageInfo).toHaveProperty('lastCursor');
      const firstPageIds = firstPage.proposals.nodes.map(p => p.id);

      await delay(1000);

      // Fetch second page
      const secondPage = await service.listProposals({
        filters: {
          organizationId: UNISWAP_ORG_ID
        },
        page: {
          limit: 2,
          afterCursor: firstPage.proposals.pageInfo.lastCursor
        }
      });

      expect(secondPage.proposals.nodes.length).toBe(2);
      const secondPageIds = secondPage.proposals.nodes.map(p => p.id);

      // Verify pages contain different proposals
      expect(firstPageIds).not.toEqual(secondPageIds);
    });

    it('should apply all filters correctly', async () => {
      const result = await service.listProposals({
        filters: {
          organizationId: UNISWAP_ORG_ID,
          governorId: UNISWAP_GOVERNOR_ID,
          includeArchived: true,
          isDraft: false
        },
        page: {
          limit: 3
        },
        sort: {
          isDescending: true,
          sortBy: "id"
        }
      });

      expect(result.proposals.nodes.length).toBeLessThanOrEqual(3);
      if (result.proposals.nodes.length > 1) {
        // Verify sorting
        const ids = result.proposals.nodes.map(p => BigInt(p.id));
        const isSorted = ids.every((id, i) => i === 0 || id <= ids[i - 1]);
        expect(isSorted).toBe(true);
      }
    });
  });

  describe('getProposal', () => {
    let proposalId: string;

    beforeAll(async () => {
      // Get a real proposal ID from the list
      const response = await service.listProposals({
        filters: {
          organizationId: UNISWAP_ORG_ID
        },
        page: {
          limit: 1
        }
      });

      if (response.proposals.nodes.length === 0) {
        throw new Error('No proposals found for testing');
      }

      proposalId = response.proposals.nodes[0].id;
      console.log('Using proposal ID:', proposalId);
    });

    it('should get proposal by ID', async () => {
      const result = await service.getProposal({
        id: proposalId
      });

      expect(result).toHaveProperty('proposal');
      const proposal = result.proposal;

      // Check basic properties
      expect(proposal).toHaveProperty('id');
      expect(proposal).toHaveProperty('onchainId');
      expect(proposal).toHaveProperty('status');
      expect(proposal).toHaveProperty('metadata');
      expect(proposal).toHaveProperty('voteStats');
      expect(proposal).toHaveProperty('governor');

      // Check metadata
      expect(proposal.metadata).toHaveProperty('title');
      expect(proposal.metadata).toHaveProperty('description');
      expect(proposal.metadata).toHaveProperty('discourseURL');
      expect(proposal.metadata).toHaveProperty('snapshotURL');

      // Check vote stats
      expect(Array.isArray(proposal.voteStats)).toBe(true);
      if (proposal.voteStats.length > 0) {
        expect(proposal.voteStats[0]).toHaveProperty('votesCount');
        expect(proposal.voteStats[0]).toHaveProperty('votersCount');
        expect(proposal.voteStats[0]).toHaveProperty('type');
        expect(proposal.voteStats[0]).toHaveProperty('percent');
      }
    });

    it('should get proposal by onchain ID', async () => {
      // First get a proposal with an onchain ID
      const listResponse = await service.listProposals({
        filters: {
          organizationId: UNISWAP_ORG_ID
        },
        page: {
          limit: 5
        }
      });

      const proposalWithOnchainId = listResponse.proposals.nodes.find(p => p.onchainId);
      if (!proposalWithOnchainId) {
        console.log('No proposal with onchain ID found, skipping test');
        return;
      }

      const result = await service.getProposal({
        onchainId: proposalWithOnchainId.onchainId,
        governorId: UNISWAP_GOVERNOR_ID
      });

      expect(result).toHaveProperty('proposal');
      expect(result.proposal.onchainId).toBe(proposalWithOnchainId.onchainId);
    });

    it('should include archived proposals', async () => {
      const result = await service.getProposal({
        id: proposalId,
        includeArchived: true
      });

      expect(result).toHaveProperty('proposal');
      expect(result.proposal.id).toBe(proposalId);
    });

    it('should handle errors for invalid proposal ID', async () => {
      await expect(service.getProposal({
        id: 'invalid-id'
      })).rejects.toThrow();
    });

    it('should handle errors when using onchainId without governorId', async () => {
      await expect(service.getProposal({
        onchainId: '1'
      })).rejects.toThrow();
    });

    it('should format proposal correctly', () => {
      const mockProposal = {
        id: '123',
        onchainId: '1',
        status: 'active' as const,
        quorum: '1000000',
        metadata: {
          title: 'Test Proposal',
          description: 'Test Description',
          discourseURL: 'https://example.com',
          snapshotURL: 'https://snapshot.org'
        },
        start: {
          timestamp: '2023-01-01T00:00:00Z'
        },
        end: {
          timestamp: '2023-01-08T00:00:00Z'
        },
        executableCalls: [{
          value: '0',
          target: '0x123',
          calldata: '0x',
          signature: 'test()',
          type: 'call'
        }],
        voteStats: [{
          votesCount: '1000000000000000000',
          votersCount: 100,
          type: 'for' as const,
          percent: 75
        }],
        governor: {
          id: 'gov-1',
          chainId: 'eip155:1',
          name: 'Test Governor',
          token: {
            decimals: 18
          },
          organization: {
            name: 'Test Org',
            slug: 'test'
          }
        },
        proposer: {
          address: '0x123',
          name: 'Test Proposer',
          picture: 'https://example.com/avatar.png'
        }
      };

      const formatted = TallyService.formatProposal(mockProposal);
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('Test Proposal');
      expect(formatted).toContain('Test Description');
      expect(formatted).toContain('Test Governor');
    });
  });
}); 