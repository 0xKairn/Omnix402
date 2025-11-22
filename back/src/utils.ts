import chalk from 'chalk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

export function logSuccess(message: string) {
    console.log(chalk.green.bold('[SUCCESS]') + ' ' + chalk.green(message));
}

export function logError(message: string) {
    console.log(chalk.red.bold('[ERROR]') + ' ' + chalk.red(message));
}

export function logInfo(message: string) {
    console.log(chalk.blue.bold('[INFO]') + ' ' + chalk.blue(message));
}

export function logWarning(message: string) {
    console.log(chalk.yellow.bold('[WARNING]') + ' ' + chalk.yellow(message));
}