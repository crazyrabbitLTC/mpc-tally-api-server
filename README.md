# MPC Tally API Server

A Model Context Protocol (MCP) server for interacting with the Tally API. This server allows AI agents to fetch information about DAOs, including their governance data, proposals, and metadata.

<a href="https://glama.ai/mcp/servers/xqt9xzqlm6"><img width="380" height="200" src="https://glama.ai/mcp/servers/xqt9xzqlm6/badge" alt="MPC Tally API Server MCP server" /></a>

## Features

- List DAOs sorted by popularity or exploration status
- Fetch comprehensive DAO metadata including social links and governance information
- Pagination support for handling large result sets
- Built with TypeScript and GraphQL
- Full test coverage with Bun's test runner

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mpc-tally-api-server.git
cd mpc-tally-api-server

# Install dependencies
bun install

# Build the project
bun run build
```

## Configuration

1. Create a `.env` file in the root directory:
```env
TALLY_API_KEY=your_api_key_here
```

2. Get your API key from [Tally](https://tally.xyz)

⚠️ **Security Note**: Keep your API key secure:
- Never commit your `.env` file
- Don't expose your API key in logs or error messages
- Rotate your API key if it's ever exposed
- Use environment variables for configuration

## Usage

### Running the Server

```bash
# Start the server
bun run start

# Development mode with auto-reload
bun run dev
```

### Claude Desktop Configuration

Add the following to your Claude Desktop configuration:

```json
{
  "tally": {
    "command": "node",
    "args": [
      "/path/to/mpc-tally-api-server/build/index.js"
    ],
    "env": {
      "TALLY_API_KEY": "your_api_key_here"
    }
  }
}
```

## Available Scripts

- `bun run clean` - Clean the build directory
- `bun run build` - Build the project
- `bun run start` - Run the built server
- `bun run dev` - Run in development mode with auto-reload
- `bun test` - Run tests
- `bun test --watch` - Run tests in watch mode
- `bun test --coverage` - Run tests with coverage

## API Functions

The server exposes the following MCP functions:

### list_daos
Lists DAOs sorted by specified criteria.

Parameters:
- `limit` (optional): Maximum number of DAOs to return (default: 20, max: 50)
- `afterCursor` (optional): Cursor for pagination
- `sortBy` (optional): How to sort the DAOs (default: popular)
  - Options: "id", "name", "explore", "popular"

## License

MIT 
