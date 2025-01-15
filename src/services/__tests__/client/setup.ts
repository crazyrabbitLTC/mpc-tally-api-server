import { beforeAll } from "bun:test";
import dotenv from "dotenv";

beforeAll(() => {
  // Load environment variables
  dotenv.config();

  // Ensure we have the required API key
  if (!process.env.TALLY_API_KEY) {
    throw new Error("TALLY_API_KEY environment variable is required for tests");
  }
}); 