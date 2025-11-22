# Omnix Protocol Deployment Guide

## Prerequisites

1. Have `.env` file configured with `PRIVATE_KEY`
2. Have funds on Base and Polygon for gas fees

## Step 0: Compile contracts

```bash
pnpm compile
```

This will compile all smart contracts and generate artifacts needed for deployment.

## Step 1: Deploy contracts on Base and Polygon

### Option A: Deploy each component separately (recommended for debugging)

```bash
# Deploy OmnixDVN
pnpm hardhat lz:deploy --tags OmnixDVN

# Deploy OmnixExecutor
pnpm hardhat lz:deploy --tags OmnixExecutor

# Deploy OmnixRouter
pnpm hardhat lz:deploy --tags OmnixRouter

# Deploy USDO (automatically configures with OmnixRouter)
pnpm hardhat lz:deploy --tags USDO
```

The system will prompt you to select networks (choose `base` and `polygon` for both).

### Option B: Deploy all at once

```bash
pnpm hardhat lz:deploy --tags OmnixDVN,OmnixExecutor,OmnixRouter,USDO
```

Select `base` and `polygon` when prompted.

**What gets deployed:**

- OmnixDVN (on Base and Polygon)
- OmnixExecutor (on Base and Polygon)
- OmnixRouter (on Base and Polygon)
- USDO (on Base and Polygon, automatically authorized with OmnixRouter)

## Step 2: Configure OmnixRouter

```bash
pnpm hardhat lz:deploy --tags ConfigureOmnixRouter
```

Select `base` and `polygon` when prompted.

**What gets configured:**

- Base OmnixRouter: mapping to Polygon (chainId 137, EID 30109)
- Polygon OmnixRouter: mapping to Base (chainId 8453, EID 30184)

## Step 3: Update layerzero.simple-worker.config.ts

Edit the file `layerzero.simple-worker.config.ts`, SECTION 4, with the deployed addresses:

```typescript
const customExecutorsByEid: Record<number, { address: string }> = {
  [EndpointId.BASE_V2_MAINNET]: {
    address: "0x4894cFD59ac3757e7de5FD302Ea8032F8aB71f65",
  },
  [EndpointId.POLYGON_V2_MAINNET]: {
    address: "0x4894cFD59ac3757e7de5FD302Ea8032F8aB71f65",
  },
};

const customDVNsByEid: Record<number, { address: string }> = {
  [EndpointId.BASE_V2_MAINNET]: {
    address: "0x5b0399fc7ee8d6f2DC21e57EFa54D9D3703702f2",
  },
  [EndpointId.POLYGON_V2_MAINNET]: {
    address: "0x5b0399fc7ee8d6f2DC21e57EFa54D9D3703702f2",
  },
};
```

**Note:** These are the actual deployed addresses from our deployment. If you redeploy, update these addresses.

## Step 4: Wire LayerZero contracts

```bash
pnpm hardhat lz:oapp:wire --oapp-config layerzero.simple-worker.config.ts
```

**What gets configured:**

- Peers between USDO Base ↔ USDO Polygon
- OmnixDVN as custom DVN
- OmnixExecutor as custom Executor
- Gas limits (200k)
- Bidirectional configuration

## Verification

### Check deployed addresses

```bash
# List all Base deployments
ls -la ./deployments/base/

# List all Polygon deployments
ls -la ./deployments/polygon/
```

### Verify configuration

```bash
# View current config
pnpm hardhat lz:oapp:config:get --oapp-config layerzero.simple-worker.config.ts
```

## Important deployed addresses

### Base Mainnet (ChainId: 8453, EID: 30184)

- **OmnixDVN**: `0x5b0399fc7ee8d6f2DC21e57EFa54D9D3703702f2`
- **OmnixExecutor**: `0x4894cFD59ac3757e7de5FD302Ea8032F8aB71f65`
- **OmnixRouter**: `0xC1333a31EE5f3F302CB0428921f2908e6CAddEb1`
- **USDO**: `0x5FAC7F2c99d9e06deff2f579FDE67a2eCDf0E0aC`

### Polygon Mainnet (ChainId: 137, EID: 30109)

- **OmnixDVN**: `0x5b0399fc7ee8d6f2DC21e57EFa54D9D3703702f2`
- **OmnixExecutor**: `0x4894cFD59ac3757e7de5FD302Ea8032F8aB71f65`
- **OmnixRouter**: `0xC1333a31EE5f3F302CB0428921f2908e6CAddEb1`
- **USDO**: `0x5FAC7F2c99d9e06deff2f579FDE67a2eCDf0E0aC`

## Useful commands

### Redeploy a specific contract

```bash
# Redeploy only USDO on Base
pnpm hardhat lz:deploy --tags USDO --network base --reset
```

### Verify contracts on block explorers

```bash
# Base
npx hardhat verify --network base <CONTRACT_ADDRESS>

# Polygon
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

## Troubleshooting

### Reset and redeploy

```bash
# Delete existing deployments
rm -rf ./deployments/base/*
rm -rf ./deployments/polygon/*

# Redeploy from scratch
# Start again from Step 1
```

### Deployment logs

Logs are automatically displayed during deployment. If needed, add `--verbose`:

```bash
pnpm hardhat lz:deploy --tags USDO --network base --verbose
```

## Complete deployment order (all commands)

```bash
# 0. Compile contracts
pnpm compile

# 1. Deploy all contracts on Base and Polygon
pnpm hardhat lz:deploy --tags OmnixDVN,OmnixExecutor,OmnixRouter,USDO
# Select: base, polygon

# 2. Configure OmnixRouter cross-chain routes
pnpm hardhat lz:deploy --tags ConfigureOmnixRouter
# Select: base, polygon

# 3. Update layerzero.simple-worker.config.ts with deployed addresses
# (see Step 3 above for exact addresses)

# 4. Wire LayerZero OApp configuration
pnpm hardhat lz:oapp:wire --oapp-config layerzero.simple-worker.config.ts

# 5. Verify configuration (optional)
pnpm hardhat lz:oapp:config:get --oapp-config layerzero.simple-worker.config.ts
```

## Quick reference: Retrieve addresses from deployments

```bash
# Get addresses from deployment files
cat ./deployments/base/OmnixDVN.json | grep '"address"'
cat ./deployments/base/OmnixExecutor.json | grep '"address"'
cat ./deployments/base/OmnixRouter.json | grep '"address"'
cat ./deployments/base/USDO.json | grep '"address"'

cat ./deployments/polygon/OmnixDVN.json | grep '"address"'
cat ./deployments/polygon/OmnixExecutor.json | grep '"address"'
cat ./deployments/polygon/OmnixRouter.json | grep '"address"'
cat ./deployments/polygon/USDO.json | grep '"address"'
```

## Deployment complete!

The protocol is now deployed and operational on Base and Polygon with:

- Custom DVN and Executor (zero fees)
- Bridging via OmniRouter
- EIP3009 signatures support
- LayerZero messaging configured
