import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export const WALLET = new ethers.Wallet(process.env.PRIVATE_KEY || '');

export const AUTHORIZED_NETWORKS = ['base', 'polygon']

export type networkDetail = {
    rpcUrl: string, chainId: number, payementReceiver: string, USDOAddress: string, OmnixRouterAddress: string, OmnixDVNAddress: string, OmnixExecutorAddress: string,
    ReceiveULN302Address: string
};
export const NETWORKS_DETAILS: { [key: string]: networkDetail } = {
    base: {
        rpcUrl: 'https://base-mainnet.public.blastapi.io',
        chainId: 8453,
        payementReceiver: '0x0187523c9b2583B52c5Ca407b68A369F1a560F1B', // Replace with actual address
        USDOAddress: '0x5FAC7F2c99d9e06deff2f579FDE67a2eCDf0E0aC', // Replace with actual USDO contract address
        OmnixRouterAddress: '0xC1333a31EE5f3F302CB0428921f2908e6CAddEb1', // Replace with actual Omnix Router contract address
        OmnixDVNAddress: '0x5b0399fc7ee8d6f2DC21e57EFa54D9D3703702f2', // Replace with actual Omnix DVN contract address
        OmnixExecutorAddress: '0x4894cFD59ac3757e7de5FD302Ea8032F8aB71f65', // Replace with actual Omnix Executor contract address
        ReceiveULN302Address: '0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf' // Replace with actual Receive ULN302 contract address
    },
    polygon: {
        rpcUrl: 'https://polygon-rpc.com',
        chainId: 137,
        payementReceiver: '0x0187523c9b2583B52c5Ca407b68A369F1a560F1B', // Replace with actual address
        USDOAddress: '0x5FAC7F2c99d9e06deff2f579FDE67a2eCDf0E0aC', // Replace with actual USDO contract address
        OmnixRouterAddress: '0xC1333a31EE5f3F302CB0428921f2908e6CAddEb1', // Replace with actual Omnix Router contract address
        OmnixDVNAddress: '0x5b0399fc7ee8d6f2DC21e57EFa54D9D3703702f2', // Replace with actual Omnix DVN contract address
        OmnixExecutorAddress: '0x4894cFD59ac3757e7de5FD302Ea8032F8aB71f65', // Replace with actual Omnix Executor contract address
        ReceiveULN302Address: '0x1322871e4ab09Bc7f5717189434f97bBD9546e95' // Replace with actual Receive ULN302 contract address
    }
};

export const EXTRA_USDO = {
    "name": "USDO",
    "version": "1"
}


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
            data: string,
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