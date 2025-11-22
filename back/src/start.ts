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
import { CallRepository } from './repositories/call.repository';
import { DemoRoute } from './routes/demo.route';

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

function addressToBytes32(address: string): string {
    return ethers.utils.hexZeroPad(ethers.utils.getAddress(address), 32);
}

(async () => {
    try {
        logInfo("Starting Omnix402 API...");

        // Services
        await connectDB();

        // Repositories
        const callRepository = new CallRepository();

        // Routes
        const endpointRoute = new EndpointRoute(callRepository);
        const demoRoute = new DemoRoute(callRepository);

        app.use('/api', endpointRoute.router);
        app.use('/demo', demoRoute.router);

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