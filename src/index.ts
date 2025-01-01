#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { TallyServer } from './server.js';

// Load environment variables
dotenv.config();

const apiKey = process.env.TALLY_API_KEY;
if (!apiKey) {
  console.error("Error: TALLY_API_KEY environment variable is required");
  process.exit(1);
}

// Create and start the server
const server = new TallyServer(apiKey);
server.start().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 