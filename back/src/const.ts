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
        USDOAddress: '0x3f5Dbe3f44228774468d9A90232775270fbb1D31', // Replace with actual USDO contract address
        OmnixRouterAddress: '0xBDAD37BA2B3D62e1F0F083768c2b850072a5aC83', // Replace with actual Omnix Router contract address
        OmnixDVNAddress: '0x068cDC6Dd1d347a07ec07B9E5bE0135D9821bC6B', // Replace with actual Omnix DVN contract address
        OmnixExecutorAddress: '0x72f848A523f29eBAb9fe0039757379f0C1166ab9', // Replace with actual Omnix Executor contract address
        ReceiveULN302Address: '0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf' // Replace with actual Receive ULN302 contract address
    },
    polygon: {
        name: 'polygon',
        rpcUrl: 'https://polygon-mainnet.core.chainstack.com/4e65e6f7f6e02d6a645648cd6114c43e',
        chainId: 137,
        payementReceiver: '0x0187523c9b2583B52c5Ca407b68A369F1a560F1B', // Replace with actual address
        USDOAddress: '0x88870B97f107957456F3CDd33EE1EF39A1FDC714', // Replace with actual USDO contract address
        OmnixRouterAddress: '0xB7AE1928C64C97603ac6cBD0FD962Ac55A0ECb36', // Replace with actual Omnix Router contract address
        OmnixDVNAddress: '0x1903A02A827AFC9d09e686C41a8ceF3D88d84323', // Replace with actual Omnix DVN contract address
        OmnixExecutorAddress: '0x0322845E1f793Cb4617951b2F8125063C1294408', // Replace with actual Omnix Executor contract address
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