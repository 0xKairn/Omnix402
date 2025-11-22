import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export const WALLET = new ethers.Wallet(process.env.PRIVATE_KEY || '');

export const AUTHORIZED_NETWORKS = ['base', 'polygon']

export type networkDetail = {
    name: string,
    rpcUrl: string, chainId: number, payementReceiver: string, USDOAddress: string, OmnixRouterAddress: string, OmnixDVNAddress: string, OmnixExecutorAddress: string,
    ReceiveULN302Address: string
};
export const NETWORKS_DETAILS: { [key: string]: networkDetail } = {
    base: {
        name: 'base',
        rpcUrl: 'https://base-mainnet.core.chainstack.com/88d169a026ebe2b2a5462a7e956435c1',
        chainId: 8453,
        payementReceiver: '0x0187523c9b2583B52c5Ca407b68A369F1a560F1B', // Replace with actual address
        USDOAddress: '0xF92EdE8380F8f2479998848E07c4d9EC28Dc90ed', // Replace with actual USDO contract address
        OmnixRouterAddress: '0xc8C5F4e85024ee85DDc9EaC733056002e405Ed83', // Replace with actual Omnix Router contract address
        OmnixDVNAddress: '0x619EdDc3Aa98Ab645954fe8e448b02Cd6Dc06E7c', // Replace with actual Omnix DVN contract address
        OmnixExecutorAddress: '0x4704C5B58FB25C269Ba5EB964ea52f8314415b88', // Replace with actual Omnix Executor contract address
        ReceiveULN302Address: '0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf' // Replace with actual Receive ULN302 contract address
    },
    polygon: {
        name: 'polygon',
        rpcUrl: 'https://polygon-mainnet.core.chainstack.com/4e65e6f7f6e02d6a645648cd6114c43e',
        chainId: 137,
        payementReceiver: '0x0187523c9b2583B52c5Ca407b68A369F1a560F1B', // Replace with actual address
        USDOAddress: '0x56cD9DD31485112e269C7b4EF26cD17DF3411173', // Replace with actual USDO contract address
        OmnixRouterAddress: '0xb258063A7b6e31A582B8fbef9415FaA6459C8FDF', // Replace with actual Omnix Router contract address
        OmnixDVNAddress: '0xfdaB8E1B364e6De90400fF168ee9E5ecaa084e4C', // Replace with actual Omnix DVN contract address
        OmnixExecutorAddress: '0xA57CF7EB42672f8116a26e0b3e623256a16aC3da', // Replace with actual Omnix Executor contract address
        ReceiveULN302Address: '0x1322871e4ab09Bc7f5717189434f97bBD9546e95' // Replace with actual Receive ULN302 contract address
    }
};

export const EXTRA_USDO = {
    "name": "USDO",
    "version": "1"
}

export const RECEIVE_WITH_AUTHORIZATION_TYPEHASH = "0xd099cc98ef71107a616c4f0f941f04c322d8e254fe26b3c6668db87aae413de8";
export const USDC_DOMAIN_SEPARATOR = "0x02fa7265e7c5d81118673727957699e4d68f74cd74b7db77da710fe8a2c7834f";

export type x402Payload = {
    x402Version: number,
    scheme: string,
    network: string,
    payload: {
        signature: string,
        authorization: {
            from: string,
            to: string,
            value: string,
            validAfter: string,
            validBefore: string,
            nonce: string,
            data?: string,
        }
    }
}

export interface PacketData {
    nonce: bigint
    srcEid: number
    sender: string
    dstEid: number
    receiver: string
    guid: string
    message: string
}