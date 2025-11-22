import express, { Response, Request, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from "express-rate-limit";
import timeout from 'connect-timeout';
import helmet from 'helmet';
import hpp from 'hpp';
import { logInfo, logError } from './utils';
import { connectDB } from './services/database.service';
import { EndpointRoute } from './routes/endpoint.route';
import { ethers } from 'ethers';
import { NETWORKS_DETAILS, WALLET } from './const';
import usdoABI from './abis/usdo.abi.json';

const app = express();

// Set trust proxy if behind a reverse proxy (like Nginx or AWS ELB)
app.set('trust proxy', 1);

// Enhanced Request logging middleware with execution time tracking
app.use((req, res, next) => {
    const start = process.hrtime();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    // const userAgent = req.headers['user-agent'] || 'unknown';
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Log request start
    // logInfo(`[REQUEST START] ${new Date().toISOString()} - ID: ${requestId} - IP: ${ip} - ${req.method} ${req.url}`);

    // Add request ID to response headers for tracking
    res.setHeader('X-Request-ID', requestId);

    // Override end function to calculate and log execution time
    const originalEnd = res.end;

    // Use proper TypeScript casting to fix the type error
    res.end = function (this: Response, chunk?: any, encoding?: BufferEncoding | (() => void), callback?: () => void): Response {
        const diff = process.hrtime(start);
        const time = diff[0] * 1000 + diff[1] / 1000000; // Convert to milliseconds

        // Log request completion with execution time and status code
        logInfo(`[REQUEST END] ${req.method} ${req.baseUrl + req.url.split("?")[0].slice(0, 50)} - IP: ${ip} - Status: ${res.statusCode} - Time: ${time.toFixed(2)}ms`);

        // Handle the various function signature overloads
        if (typeof encoding === 'function') {
            callback = encoding;
            encoding = undefined;
        }

        return originalEnd.call(this, chunk, encoding as BufferEncoding, callback);
    };

    next();
});

// Set request timeout to prevent hanging connections
app.use(timeout('20s'));
app.use((req, res, next) => {
    if (!req.timedout) next();
});

// Rate limiting to prevent DDoS attacks
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 200, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests'
});
app.use(limiter);

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Enhanced CORS configuration
app.use(cors({
    origin: true, // Allow all origins for development, restrict in production
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Payment'],
    credentials: true,
    maxAge: 86400 // 24 hours
}));

(async () => {
    try {
        logInfo("Starting Omnix402 API...");

        // Services
        await connectDB();

        // Routes
        const endpointRoute = new EndpointRoute();

        app.use('/api', endpointRoute.router);

        const sourceNetworkDetails = NETWORKS_DETAILS['polygon'];

        const sourceProvider = new ethers.providers.JsonRpcProvider(sourceNetworkDetails.rpcUrl);
        const sourceUSDOContract = new ethers.Contract(
            sourceNetworkDetails.USDOAddress,
            usdoABI,
            sourceProvider
        );
        console.log(await sourceUSDOContract.TRANSFER_WITH_AUTHORIZATION_TYPEHASH())
        console.log(await sourceUSDOContract.DOMAIN_SEPARATOR())

        const from = '0x0187523c9b2583B52c5Ca407b68A369F1a560F1B';
        const to = '0xa5cd4AD92FE9B4Ba7a4B8110c95BEAc5A02b68BB';
        const value = '10000';
        const validAfter = '1763834086'
        const validBefore = '1763837786';
        const nonce = '0x9f87993c6c1b7c5d36579040029b8e6afc68dc488823bb28ef1381c8f305e177';
        const data = '0x000000000000000000000000c8c5f4e85024ee85ddc9eac733056002e405ed830000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000021050000000000000000000000000187523c9b2583b52c5ca407b68a369f1a560f1b00000000000000000000000066fa4d79ca84016b42352be33c908dd812952ec8'

        // Get the correct TYPEHASH and DOMAIN_SEPARATOR from the contract
        const TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH = await sourceUSDOContract.TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH();
        const TRANSFER_WITH_AUTHORIZATION_TYPEHASH = await sourceUSDOContract.TRANSFER_WITH_AUTHORIZATION_TYPEHASH();
        const DOMAIN_SEPARATOR = await sourceUSDOContract.DOMAIN_SEPARATOR();

        logInfo(`TRANSFER_WITH_AUTHORIZATION_TYPEHASH: ${TRANSFER_WITH_AUTHORIZATION_TYPEHASH}`);
        logInfo(`TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH: ${TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH}`);
        logInfo(`DOMAIN_SEPARATOR: ${DOMAIN_SEPARATOR}`);

        // Build the struct hash exactly like in the Solidity test
        const structHash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'bytes32', 'bytes'],
                [
                    TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH,
                    from,
                    to,
                    value,
                    validAfter,
                    validBefore,
                    nonce,
                    data
                ]
            )
        );

        // Build the digest with EIP-712 standard
        const digest = ethers.utils.keccak256(
            ethers.utils.solidityPack(
                ['string', 'bytes32', 'bytes32'],
                ['\x19\x01', DOMAIN_SEPARATOR, structHash]
            )
        );

        logInfo(`Digest: ${digest}`);

        // Sign the digest directly (no arrayify needed)
        const signingKey = new ethers.utils.SigningKey(WALLET.privateKey);
        const signature = signingKey.signDigest(digest);

        const { v, r, s } = signature;

        logInfo(`Signature - v: ${v}, r: ${r}, s: ${s}`);

        // const txData = await sourceUSDOContract.populateTransaction['transferWithAuthorizationData(address,address,uint256,uint256,uint256,bytes32,bytes,uint8,bytes32,bytes32)'](
        //     from,
        //     to,
        //     value,
        //     validAfter,
        //     validBefore,
        //     nonce,
        //     data,
        //     v, r, s
        // );

        // const tx = {
        //     from: WALLET.address,
        //     to: sourceNetworkDetails.USDOAddress,
        //     data: txData.data,
        //     gasLimit: ethers.BigNumber.from(1000000)
        // };

        // const gas = await sourceProvider.estimateGas(tx);

        const PORT = process.env.PORT || 3022;
        app.listen(PORT, () => {
            logInfo(`HTTP Server running on port ${PORT}`);
        });
    } catch (error) {
        console.log(error)
        logError(`Failed to start server: ${error}`);
        process.exit(1);
    }
})();