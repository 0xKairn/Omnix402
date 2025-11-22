import express from 'express';
import cors from 'cors';
import rateLimit from "express-rate-limit";
import timeout from 'connect-timeout';
import { logInfo, logError } from './utils';

const app = express();

// Set request timeout to prevent hanging connections
app.use(timeout('20s'));
app.use((req, res, next) => {
    if (!req.timedout) next();
});

// Rate limiting to prevent DDoS attacks
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests'
});
app.use(limiter);

// Enhanced CORS configuration
app.use(cors({
    origin: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
}));

(async () => {
    try {
        logInfo("Starting Omnix402 API...");

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            logInfo(`HTTP Server running on port ${PORT}`);
        });

    } catch (error) {
        console.log(error)
        logError(`Failed to start server: ${error}`);
        process.exit(1);
    }
})();