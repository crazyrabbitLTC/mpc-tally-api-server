import { describe, test, expect, beforeAll } from "bun:test";
import { TallyService } from "../../../services/tally.service.js";

describe("Tally API Server - Integration Tests", () => {
  let tallyService: TallyService;

  beforeAll(() => {
    // Initialize with the real Tally API
    tallyService = new TallyService({
      apiKey: process.env.TALLY_API_KEY || "test_api_key",
      baseUrl: "https://api.tally.xyz/query"
    });
  });

  test("should list DAOs", async () => {
    const daos = await tallyService.listDAOs({
      limit: 5
    });

    expect(daos).toBeDefined();
    expect(Array.isArray(daos.organizations.nodes)).toBe(true);
    expect(daos.organizations.nodes.length).toBeLessThanOrEqual(5);
  });

  test("should fetch DAO details", async () => {
    const daoId = "uniswap"; // Using Uniswap as it's a well-known DAO
    const dao = await tallyService.getDAO(daoId);

    expect(dao).toBeDefined();
    expect(dao.id).toBeDefined();
    expect(dao.slug).toBe(daoId);
  });

  test("should list proposals", async () => {
    // First get a valid DAO to use its governanceId
    const dao = await tallyService.getDAO("uniswap");
    // Log the governorIds to debug
    console.log("DAO Governor IDs:", dao.governorIds);

    const proposals = await tallyService.listProposals({
      filters: {
        governorId: dao.governorIds?.[0],
        organizationId: dao.id
      },
      page: {
        limit: 5
      }
    });

    expect(proposals).toBeDefined();
    expect(Array.isArray(proposals.proposals.nodes)).toBe(true);
    expect(proposals.proposals.nodes.length).toBeLessThanOrEqual(5);
  });

  test("should fetch proposal details", async () => {
    // First get a valid DAO to use its governanceId
    const dao = await tallyService.getDAO("uniswap");
    console.log("DAO Governor IDs for proposal:", dao.governorIds);
    
    const proposals = await tallyService.listProposals({
      filters: {
        governorId: dao.governorIds?.[0],
        organizationId: dao.id
      },
      page: {
        limit: 1
      }
    });

    // Log the proposal details to debug
    console.log("First proposal:", proposals.proposals.nodes[0]);
    
    const proposal = await tallyService.getProposal({
      id: proposals.proposals.nodes[0].id
    });

    expect(proposal).toBeDefined();
    expect(proposal.proposal.id).toBeDefined();
  });

  test("should list delegates", async () => {
    // First get a valid DAO to use its ID
    const dao = await tallyService.getDAO("uniswap");
    
    const delegates = await tallyService.listDelegates({
      organizationId: dao.id,
      limit: 5
    });

    expect(delegates).toBeDefined();
    expect(Array.isArray(delegates.delegates)).toBe(true);
    expect(delegates.delegates.length).toBeLessThanOrEqual(5);
  });

  test("should handle errors gracefully", async () => {
    const invalidDaoId = "non-existent-dao";
    
    try {
      await tallyService.getDAO(invalidDaoId);
      throw new Error("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
    }
  });
}); 