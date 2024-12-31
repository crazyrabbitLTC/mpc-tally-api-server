#!/usr/bin/env node
import { startServer } from './server.js';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

startServer(port).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 