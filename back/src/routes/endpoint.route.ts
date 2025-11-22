import { Router } from "express";
import { checkIfDestHasEnoughUSDC, decodePacket, getChainNameById, logError, logInfo } from "../utils";
import { ethers } from "ethers";
import { AUTHORIZED_NETWORKS, EXTRA_USDO, networkDetail, NETWORKS_DETAILS, PacketData, WALLET, x402Payload } from "../const";
import usdoABI from "../abis/usdo.abi.json";
import omnixExecutorABI from "../abis/omnixExecutor.abi.json";
import omnixDVNABI from "../abis/omnixDVN.abi.json";

export class EndpointRoute {
    public router: Router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/health', this.getHealth);
        this.router.get('/', this.getEndpointRequirements);
        this.router.post('/', this.processx402Call);
    }

    private getHealth = async (req: any, res: any) => {
        try {
            res.status(200).json({ status: 'OK' });
        } catch (error) {
            logError(`Error in health check: ${error}`);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    private getEndpointRequirements = async (req: any, res: any) => {
        const { endpoint, network } = req.query;

        if (!endpoint || !network) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        if (!AUTHORIZED_NETWORKS.includes(network)) {
            return res.status(400).json({ error: 'Unauthorized network' });
        }

        try {
            // Fetch endpoint by calling it
            const response = await fetch(endpoint, {
                method: 'POST'
            });

            const body = await response.json();

            const sourceAccept = body.accepts[0];

            const destNetworkDetails = NETWORKS_DETAILS[body.accepts[0].network];

            const hasEnoughUSDC = await checkIfDestHasEnoughUSDC(
                destNetworkDetails,
                body.accepts[0].amount
            );

            if (!hasEnoughUSDC) {
                return res.status(400).json({ error: 'Insufficient USDC balance in destination' });
            }

            const newAccept = {
                ...sourceAccept,
                network,                                     // override
                payTo: destNetworkDetails.USDOAddress,        // override
                asset: destNetworkDetails.USDOAddress,        // override
                extra: EXTRA_USDO,                             // override
                destNetwork: body.accepts[0].network
            };

            body.accepts.push(newAccept);

            newAccept.data = ethers.utils.defaultAbiCoder.encode(
                ['address', 'bytes'],
                [
                    destNetworkDetails.OmnixRouterAddress,
                    ethers.utils.defaultAbiCoder.encode(
                        ['uint256', 'address'],
                        [
                            destNetworkDetails.chainId,
                            destNetworkDetails.payementReceiver
                        ]
                    )
                ]
            );

            res.status(402).json({
                ...body
            });
        } catch (error) {
            logError(`Error fetching endpoint requirements: ${error}`);
            res.status(500).json({ error: 'Internal Server Error' });
        }

    }

    private processx402Call = async (req: any, res: any) => {
        const body = req.body;
        try {
            const payload = req.headers['x-payment'];

            // decode payload in base64 and put it as a json
            const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
            const payloadJson = JSON.parse(decodedPayload) as x402Payload;

            const [omnixRouterAddress, innerBytes] =
                ethers.utils.defaultAbiCoder.decode(
                    ['address', 'bytes'],
                    payloadJson.payload.authorization.data
                );
            const [destChainId, paymentReceiver] =
                ethers.utils.defaultAbiCoder.decode(
                    ['uint256', 'address'],
                    innerBytes
                );

            const destNetworkDetails = NETWORKS_DETAILS[getChainNameById(destChainId)];
            const sourceNetworkDetails = NETWORKS_DETAILS[payloadJson.network];

            const sourceProvider = new ethers.providers.JsonRpcProvider(sourceNetworkDetails.rpcUrl);
            const sourceUSDOContract = new ethers.Contract(
                sourceNetworkDetails.USDOAddress,
                usdoABI,
                sourceProvider
            );

            const data = await sourceUSDOContract.populateTransaction.transferWithAuthorization(
                payloadJson.payload.authorization.from,
                payloadJson.payload.authorization.to,
                payloadJson.payload.authorization.value,
                payloadJson.payload.authorization.validAfter,
                payloadJson.payload.authorization.validBefore,
                payloadJson.payload.authorization.nonce,
                payloadJson.payload.authorization.data
            );

            const tx = {
                from: WALLET.address,
                to: sourceNetworkDetails.USDOAddress,
                data: data.data,
                gasLimit: ethers.BigNumber.from(1000000)
            };

            const gas = await sourceProvider.estimateGas(tx);


            const signedTx = await WALLET.signTransaction({
                ...tx,
                gasLimit: gas
            });

            const txResponse = await sourceProvider.sendTransaction(signedTx);
            const receipt = await txResponse.wait();

            // decrypt receipt to get the data log and get any PacketSent event

            //

            const ENDPOINT_ABI = ['event PacketSent(bytes encodedPayload, bytes options, address sendLibrary)']

            const ISourceEndpoint = new ethers.utils.Interface(ENDPOINT_ABI);

            let packetSentEventData: PacketData | null = null;

            for (const log of receipt.logs) {
                try {
                    const parsedLog = ISourceEndpoint.parseLog(log);
                    if (parsedLog.name === 'PacketSent') {
                        packetSentEventData = decodePacket(parsedLog.args.encodedPayload);
                        break;
                    }
                } catch (e) {
                    continue; // Not the PacketSent event
                }
            }

            if (!packetSentEventData) {
                logError(`PacketSent event not found in transaction logs.`);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            await this.processPacket(destNetworkDetails, packetSentEventData, receipt.transactionHash);

        } catch (error) {
            logError(`Error processing x402 call: ${error}`);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async processPacket(
        networkDetails: networkDetail,
        packet: PacketData,
        sourceTxHash: string
    ) {
        const provider = new ethers.providers.JsonRpcProvider(networkDetails.rpcUrl);

        const signer = WALLET.connect(provider);

        const currentGasPrice = await provider.getGasPrice()
        const gasPrice = currentGasPrice.mul(3).div(2);

        const destDVN = new ethers.Contract(
            networkDetails.OmnixDVNAddress,
            omnixDVNABI,
            provider
        );

        const destExecutor = new ethers.Contract(
            networkDetails.OmnixExecutorAddress,
            omnixExecutorABI,
            provider
        );

        const nonce = await signer.getTransactionCount();

        // VERIFY
        const verifyData = await destDVN.populateTransaction.verify(
            packet.message,
            packet.nonce,
            packet.srcEid,
            packet.sender,
            packet.dstEid,
            packet.receiver
        )
        const verifyTx = {
            from: signer.address,
            to: networkDetails.OmnixDVNAddress,
            data: verifyData.data,
            gasLimit: ethers.BigNumber.from(500000),
            gasPrice: gasPrice,
            nonce: nonce
        }
        const verifySignedTx = await signer.signTransaction(verifyTx);

        // COMMIT
        const commitData = await destDVN.populateTransaction.commit(
            packet.message,
            packet.nonce,
            packet.srcEid,
            packet.sender,
            packet.dstEid,
            packet.receiver
        )
        const commitTx = {
            from: signer.address,
            to: networkDetails.OmnixDVNAddress,
            data: commitData.data,
            gasLimit: ethers.BigNumber.from(500000),
            gasPrice: gasPrice.sub(1),
            nonce: nonce + 1
        }
        const commitSignedTx = await signer.signTransaction(commitTx);

        // EXECUTE
        const lzReceiveParam = {
            origin: {
                srcEid: packet.srcEid,
                sender: packet.sender,
                nonce: packet.nonce,
            },
            receiver: packet.receiver,
            guid: packet.guid,
            message: packet.message,
            extraData: '0x',
            gas: 200000,
            value: 0,
        }
        const executeData = await destExecutor.populateTransaction.commitAndExecute(
            networkDetails.ReceiveULN302Address,
            lzReceiveParam, []);

        const executeTx = {
            from: signer.address,
            to: networkDetails.OmnixExecutorAddress,
            data: executeData.data,
            gasLimit: ethers.BigNumber.from(800000),
            gasPrice: gasPrice.sub(2),
            nonce: nonce + 2
        }
        const executeSignedTx = await signer.signTransaction(executeTx);

        // Send transactions at the same time:
        const [verifyTxResponse, commitTxResponse, executeTxResponse] = await Promise.all([
            provider.sendTransaction(verifySignedTx),
            provider.sendTransaction(commitSignedTx),
            provider.sendTransaction(executeSignedTx),
        ]);

        await Promise.all([
            verifyTxResponse.wait(),
            commitTxResponse.wait(),
            executeTxResponse.wait(),
        ]);

        logInfo(`Processed packet on chainId ${networkDetails.chainId} for receiver ${packet.receiver} from source tx ${sourceTxHash}`);
    }
}