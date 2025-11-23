# Omnix402 API Usage Guide

This guide explains how to interact with the Omnix402 API to enable cross-chain payments using the X402 protocol.

## Overview

The Omnix402 API acts as a bridge between different blockchain networks, enabling seamless cross-chain USDC transfers with payment authorization signatures (EIP-3009).

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### 1. Health Check

Check if the API is running.

**Endpoint:** `GET /endpoint/health`

**Response:**

```json
{
	"status": "OK"
}
```

---

### 2. Get Payment Requirements

Retrieve payment requirements for a protected resource, modified to support cross-chain payments.

**Endpoint:** `GET /endpoint?endpoint=<PROTECTED_URL>&network=<SOURCE_NETWORK>`

**Query Parameters:**

-   `endpoint` (required): URL-encoded URL of the protected resource
-   `network` (required): Source blockchain network (`polygon`, `base`, etc.)

**Example Request:**

```javascript
const endpoint = encodeURIComponent("https://api.example.com/protected-resource");
const network = "polygon";

const response = await fetch(`http://localhost:3000/api/endpoint?endpoint=${endpoint}&network=${network}`);

const requirements = await response.json();
```

**Response (402 Payment Required):**

```json
{
	"accepts": [
		{
			"network": "polygon",
			"payTo": "0x...",
			"asset": "0x...",
			"maxAmountRequired": "1000000",
			"extra": "USDO",
			"data": "0x..."
		}
	]
}
```

**Important Fields:**

-   `network`: The source network where you need to make the payment
-   `payTo`: USDO contract address on the source network
-   `maxAmountRequired`: Payment amount in USDC (with 6 decimals, e.g., 1000000 = 1 USDC)
-   `data`: Encoded data for cross-chain routing

---

### 3. Execute X402 Payment

Execute a cross-chain payment with EIP-3009 authorization.

**Endpoint:** `POST /endpoint?endpoint=<PROTECTED_URL>`

**Headers:**

-   `x-payment`: Base64-encoded JSON payload containing the payment authorization

**Query Parameters:**

-   `endpoint` (required): URL-encoded URL of the protected resource

**Payment Payload Structure:**

```typescript
interface X402Payload {
	x402Version: 1;
	scheme: "exact";
	network: string; // Source network name
	payload: {
		signature: string; // EIP-712 signature
		authorization: {
			from: string; // Sender address
			to: string; // USDO contract address
			value: string; // Amount in USDC (6 decimals)
			validAfter: string;
			validBefore: string;
			nonce: string; // Random bytes32
			data?: string; // Optional: encoded routing data
		};
	};
}
```

**Example: Building and Sending Payment**

```javascript
import { ethers } from "ethers";

// Step 1: Get payment requirements
const endpoint = "https://api.example.com/protected-resource";
const network = "polygon";

const requirementsResponse = await fetch(`http://localhost:3000/api/endpoint?endpoint=${encodeURIComponent(endpoint)}&network=${network}`);
const requirements = await requirementsResponse.json();
const accept = requirements.accepts[0];

// Step 2: Build EIP-3009 authorization
const wallet = new ethers.Wallet(PRIVATE_KEY);
const usdoContract = new ethers.Contract(accept.payTo, USDO_ABI, provider);

// Get contract constants
const TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH = await usdoContract.TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH();
const DOMAIN_SEPARATOR = await usdoContract.DOMAIN_SEPARATOR();

// Create authorization parameters
const now = Math.floor(Date.now() / 1000);
const validAfter = now - 60;
const validBefore = now + 3600;
const nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));

// Build EIP-712 struct hash
const structHash = ethers.utils.keccak256(
	ethers.utils.defaultAbiCoder.encode(
		["bytes32", "address", "address", "uint256", "uint256", "uint256", "bytes32", "bytes"],
		[
			TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH,
			wallet.address,
			accept.payTo,
			accept.maxAmountRequired,
			validAfter,
			validBefore,
			nonce,
			accept.data || "0x",
		]
	)
);

// Build EIP-712 digest
const digest = ethers.utils.keccak256(ethers.utils.solidityPack(["string", "bytes32", "bytes32"], ["\x19\x01", DOMAIN_SEPARATOR, structHash]));

// Sign the digest
const signingKey = new ethers.utils.SigningKey(wallet.privateKey);
const signature = signingKey.signDigest(digest);
const compactSignature = ethers.utils.joinSignature(signature);

// Step 3: Build X402 payload
const x402Payload = {
	x402Version: 1,
	scheme: "exact",
	network: network,
	payload: {
		signature: compactSignature,
		authorization: {
			from: wallet.address,
			to: accept.payTo,
			value: accept.maxAmountRequired.toString(),
			validAfter: validAfter.toString(),
			validBefore: validBefore.toString(),
			nonce: nonce,
			data: accept.data,
		},
	},
};

// Step 4: Encode payload and send payment request
const base64Payload = Buffer.from(JSON.stringify(x402Payload)).toString("base64");

const paymentResponse = await fetch(`http://localhost:3000/api/endpoint?endpoint=${encodeURIComponent(endpoint)}`, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		"X-Payment": base64Payload,
	},
});

// Step 5: Handle response
if (paymentResponse.ok) {
	const resourceData = await paymentResponse.json();
	const paymentProof = paymentResponse.headers.get("X-Payment-Response");

	console.log("Protected resource accessed successfully!");
	console.log("Resource data:", resourceData);
	console.log("Payment proof:", paymentProof);
} else {
	const error = await paymentResponse.json();
	console.error("Payment failed:", error);
}
```

**Success Response (200 OK):**

```json
{
	// Protected resource data
	"data": "...",
	"message": "..."
}
```

**Response Headers:**

-   `X-Payment-Response`: Payment proof from destination chain

---

## Flow Diagram

```
User → GET /endpoint (with network) → API
  ↓
API fetches original requirements and modifies for cross-chain
  ↓
User receives modified payment requirements (402)
  ↓
User builds EIP-3009 authorization & signs
  ↓
User → POST /endpoint (with X-Payment header) → API
  ↓
API executes cross-chain flow:
  1. Submits payment on source chain
  2. Waits for confirmation
  3. Processes cross-chain message on destination
  4. Requests protected resource with CDP signature
  ↓
API → Returns resource data + payment proof → User
```

---

## Error Responses

### 400 Bad Request

```json
{
	"error": "Invalid parameters"
}
```

or

```json
{
	"error": "Unauthorized network"
}
```

or

```json
{
	"error": "Insufficient USDC balance in destination"
}
```

### 500 Internal Server Error

```json
{
	"error": "Internal Server Error"
}
```

or

```json
{
	"error": "Internal Server Error during bridge"
}
```

---

## Supported Networks

-   `polygon`
-   `base`
-   (Add more networks as they are supported)

---

## Notes

1. **Gas Price**: The API automatically adjusts gas prices (2x base price) for faster confirmations
2. **Parallel Execution**: Cross-chain transactions are optimized with parallel signing and execution
3. **Payment Proof**: The destination chain payment proof is returned in the `X-Payment-Response` header
4. **Security**: All signatures must be valid EIP-712 signatures for EIP-3009 authorization

---

## Demo Endpoint

For testing purposes, a demo endpoint is available:

**Endpoint:** `GET /demo`

This endpoint demonstrates the full X402 flow with a hardcoded protected resource and automatically handles the entire process.

**Response:**

```json
{
	"callId": "..."
}
```

You can track the demo progress by querying:

**Endpoint:** `GET /demo/call?callId=<CALL_ID>`

---

## Support

For issues or questions, please refer to the project documentation or contact the development team.
