import chalk from 'chalk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { networkDetail, NETWORKS_DETAILS, PacketData, RECEIVE_WITH_AUTHORIZATION_TYPEHASH } from './const';

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

export async function checkIfDestHasEnoughUSDC(
    networkDetail: networkDetail,
    amount: string
): Promise<boolean> {
    try {
        const provider = new ethers.providers.JsonRpcProvider(networkDetail.rpcUrl);
        const usdcContract = new ethers.Contract(
            networkDetail.USDCAddress,
            [
                'function balanceOf(address owner) view returns (uint256)'
            ],
            provider
        );

        const balance: ethers.BigNumber = await usdcContract.balanceOf(networkDetail.USDOAddress);
        const amountBN = ethers.BigNumber.from(amount);

        return balance.gte(amountBN);
    } catch (error) {
        logError(`Error checking USDC balance: ${error}`);
        return false;
    }
}

export function decodePacket(encodedPayload: string): PacketData {
    const data = ethers.utils.arrayify(encodedPayload)
    const version = data[0]
    if (version !== 1) {
        throw new Error(`Unsupported packet version: ${version}`)
    }
    let offset = 1

    const nonceBytes = data.slice(offset, offset + 8)
    const nonce = BigInt('0x' + Buffer.from(nonceBytes).toString('hex'))
    offset += 8

    const srcEidBytes = data.slice(offset, offset + 4)
    const srcEid = parseInt(Buffer.from(srcEidBytes).toString('hex'), 16)
    offset += 4

    const senderBytes = data.slice(offset, offset + 32)
    const sender = '0x' + Buffer.from(senderBytes).toString('hex')
    offset += 32

    const dstEidBytes = data.slice(offset, offset + 4)
    const dstEid = parseInt(Buffer.from(dstEidBytes).toString('hex'), 16)
    offset += 4

    const receiverBytes = data.slice(offset, offset + 32)
    const receiver = '0x' + Buffer.from(receiverBytes).toString('hex')
    offset += 32

    const guidBytes = data.slice(offset, offset + 32)
    const guid = '0x' + Buffer.from(guidBytes).toString('hex')
    offset += 32

    const messageBytes = data.slice(offset)
    const message = '0x' + Buffer.from(messageBytes).toString('hex')

    return {
        nonce,
        srcEid,
        sender,
        dstEid,
        receiver: '0x' + receiver.slice(-40),
        guid,
        message,
    }
}

export function getChainNameById(chainId: number): string {
    for (const [networkName, details] of Object.entries(NETWORKS_DETAILS)) {
        if (details.chainId === chainId) {
            return networkName;
        }
    }

    return 'unknown';
}

export function buildTransferAuthorizationDigest(
    from: string,
    to: string,
    value: string,
    validAfter: number,
    validBefore: number,
    nonce: string
): string {
    const structHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'bytes32'],
            [
                RECEIVE_WITH_AUTHORIZATION_TYPEHASH,
                from,
                to,
                value,
                validAfter,
                validBefore,
                nonce
            ]
        )
    );

    let digest = getHashTypedDataForUSDC(structHash);
    return digest;
}

export function getHashTypedDataForUSDC(structHash: string): string {
    const USDC_DOMAIN_SEPARATOR = '0x02fa7265e7c5d81118673727957699e4d68f74cd74b7db77da710fe8a2c7834f';

    const digest = ethers.utils.keccak256(
        ethers.utils.concat([
            '0x1901',
            USDC_DOMAIN_SEPARATOR,
            structHash
        ])
    );

    return digest;
}