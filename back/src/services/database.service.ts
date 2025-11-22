import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logError, logSuccess } from '../utils';

// Charger les variables d'environnement
dotenv.config();
const mongoURI = process.env.MONGODB_URI!;

export async function connectDB() {
    try {
        await mongoose.connect(mongoURI);
        logSuccess('Successfully connected to MongoDB');
    } catch (err) {
        logError('Error connecting to MongoDB: ' + err);
        process.exit(1); // Arrête le processus en cas d'erreur
    }
};