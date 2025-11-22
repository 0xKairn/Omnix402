export const AUTHORIZED_NETWORKS = ['base', 'polygon']
export const NETWORKS_DETAILS: { [key: string]: { rpcUrl: string, chainId: number, payementReceiver: string, USDOAddress: string, OmnixRouterAddress: string } } = {
    base: {
        rpcUrl: 'https://base-mainnet.public.blastapi.io',
        chainId: 8453,
        payementReceiver: '0xYourBasePaymentReceiverAddress', // Replace with actual address
        USDOAddress: '0xYourUSDOContractAddress', // Replace with actual USDO contract address
        OmnixRouterAddress: '0xYourOmnixRouterAddress' // Replace with actual Omnix Router contract address
    },
    polygon: {
        rpcUrl: 'https://polygon-rpc.com',
        chainId: 137,
        payementReceiver: '0xYourPolygonPaymentReceiverAddress', // Replace with actual address
        USDOAddress: '0xYourUSDOContractAddress', // Replace with actual USDO contract address
        OmnixRouterAddress: '0xYourOmnixRouterAddress' // Replace with actual Omnix Router contract address
    }
};

export const EXTRA_USDO = {
    "name": "USDO",
    "version": "1"
}