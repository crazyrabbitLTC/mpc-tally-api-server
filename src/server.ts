import { createServer } from '@modelcontextprotocol/sdk';
import { config } from 'dotenv';

config();

export async function startServer(port: number) {
  const server = createServer({
    // Add your server configuration here
  });

  await server.listen(port);
  console.log(`Server running on port ${port}`);
} 