# Omnix402 MCP Server

MCP server with x402 payment integration for the Omnix402 project.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables in `.env`:

```bash
cp .env-local .env
```

3. Build:

```bash
pnpm build
```

4. Run:

```bash
pnpm dev
```

## Configuration

Edit `.env` with:

- `PRIVATE_KEY`: Your Ethereum wallet private key (with USDC on Base Sepolia)
- `RESOURCE_SERVER_URL`: x402 server URL
- `ENDPOINT_PATH`: API endpoint path
