import { Router } from "express";
import { buildTransferAuthorizationDigest, checkIfDestHasEnoughUSDC, decodePacket, getChainNameById, logError, logInfo, logSuccess } from "../utils";
import { ethers } from "ethers";
import { AUTHORIZED_NETWORKS, EXTRA_USDO, networkDetail, NETWORKS_DETAILS, PacketData, WALLET, x402Payload } from "../const";
import usdoABI from "../abis/usdo.abi.json";
import omnixExecutorABI from "../abis/omnixExecutor.abi.json";
import omnixDVNABI from "../abis/omnixDVN.abi.json";
import { CallRepository } from "../repositories/call.repository";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { CdpClient } from "@coinbase/cdp-sdk";
import { toAccount } from "viem/accounts";

export class EndpointRoute {
    public router: Router = Router();

    constructor(
        private callRepository: CallRepository
    ) {
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
            logInfo(`Fetching endpoint requirements from: ${endpoint}`);

            const response = await fetch(endpoint, {
                method: 'GET'
            });

            const body = await response.json();
            const sourceAccept = body.accepts[0];

            // If source and destination networks are the same, just forward the response
            if (network === sourceAccept.network) {
                logInfo(`Same network detected (${network}), forwarding requirements as-is`);
                return res.status(402).json(body);
            }

            const sourceNetworkDetails = NETWORKS_DETAILS[network];
            const destNetworkDetails = NETWORKS_DETAILS[sourceAccept.network];

            logInfo(`Payment required: ${ethers.BigNumber.from(sourceAccept.maxAmountRequired).div(10 ** 6).toString()} USDC`);
            logInfo(`Source: ${network}, Destination: ${sourceAccept.network}`);

            const hasEnoughUSDC = await checkIfDestHasEnoughUSDC(
                destNetworkDetails,
                sourceAccept.maxAmountRequired
            );

            if (!hasEnoughUSDC) {
                return res.status(400).json({ error: 'Insufficient USDC balance in destination' });
            }

            const newAccept = {
                ...sourceAccept,
                network,                                     // override
                payTo: sourceNetworkDetails.USDOAddress,        // override
                asset: sourceNetworkDetails.USDOAddress,        // override
                extra: EXTRA_USDO                             // override
            };

            body.accepts[0] = newAccept;

            newAccept.data = ethers.utils.defaultAbiCoder.encode(
                ['address', 'bytes'],
                [
                    sourceNetworkDetails.OmnixRouterAddress,
                    ethers.utils.defaultAbiCoder.encode(
                        ['uint256', 'address', 'address'],
                        [
                            destNetworkDetails.chainId,
                            destNetworkDetails.payementReceiver,
                            sourceAccept.payTo
                        ]
                    )
                ]
            );

            logInfo(`Endpoint requirements prepared for ${network}`);

            res.status(402).json({
                ...body
            });
        } catch (error) {
            logError(`Error fetching endpoint requirements: ${error}`);
            res.status(500).json({ error: 'Internal Server Error' });
        }

    }

    private processx402Call = async (req: any, res: any) => {
        const { endpoint } = req.query;
        try {
            logInfo(`Processing X402 payment for endpoint: ${endpoint}`);

            const payload = req.headers['x-payment'];

            // decode payload in base64 and put it as a json
            const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
            const payloadJson = JSON.parse(decodedPayload) as x402Payload;

            // Check if this is a same-network payment (no cross-chain needed)
            if (!payloadJson.payload.authorization.data) {
                // Same network: just forward the payment to the endpoint
                logInfo(`Same network payment detected, forwarding to endpoint`);

                try {
                    const base64Payload = Buffer.from(JSON.stringify(payloadJson)).toString('base64');

                    const response = await fetch(endpoint, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Payment': base64Payload
                        },
                    });

                    const body = await response.json();
                    const xPaymentResponse = response.headers.get('X-Payment-Response');

                    logSuccess(`Same network payment completed successfully`);

                    res.setHeader('X-Payment-Response', xPaymentResponse);
                    res.status(200).json(body);
                } catch (error) {
                    logError(`Error forwarding same network payment: ${error}`);
                    res.status(500).json({ error: 'Error processing payment' });
                }
                return;
            }

            // Cross-chain payment flow
            const [omnixRouterAddress, innerBytes] =
                ethers.utils.defaultAbiCoder.decode(
                    ['address', 'bytes'],
                    payloadJson.payload.authorization.data
                );
            const [destChainId, paymentReceiver, endpointReceiver] =
                ethers.utils.defaultAbiCoder.decode(
                    ['uint256', 'address', 'address'],
                    innerBytes
                );

            const destNetworkDetails = NETWORKS_DETAILS[getChainNameById(destChainId)];
            const sourceNetworkDetails = NETWORKS_DETAILS[payloadJson.network];

            logInfo(`Payment: ${ethers.BigNumber.from(payloadJson.payload.authorization.value).div(10 ** 6).toString()} USDC`);
            logInfo(`Source: ${payloadJson.network}, Destination: ${getChainNameById(destChainId)}`);
            logInfo(`Submitting source payment transaction...`);

            const sourceProvider = new ethers.providers.JsonRpcProvider(sourceNetworkDetails.rpcUrl);
            const sourceUSDOContract = new ethers.Contract(
                sourceNetworkDetails.USDOAddress,
                usdoABI,
                sourceProvider
            );

            const { v, r, s } = ethers.utils.splitSignature(payloadJson.payload.signature);

            const data = await sourceUSDOContract.populateTransaction['transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes,uint8,bytes32,bytes32)'](
                payloadJson.payload.authorization.from,
                payloadJson.payload.authorization.to,
                payloadJson.payload.authorization.value,
                payloadJson.payload.authorization.validAfter,
                payloadJson.payload.authorization.validBefore,
                payloadJson.payload.authorization.nonce,
                payloadJson.payload.authorization.data,
                v, r, s
            );

            const currentGasPrice = await sourceProvider.getGasPrice()
            const gasPrice = currentGasPrice.mul(2);
            const signer = WALLET.connect(sourceProvider);

            const tx = {
                from: WALLET.address,
                to: sourceNetworkDetails.USDOAddress,
                data: data.data,
                gasLimit: ethers.BigNumber.from(1000000),
                chainId: sourceNetworkDetails.chainId,
                gasPrice: gasPrice,
                nonce: await signer.getTransactionCount()
            };

            const gas = await sourceProvider.estimateGas(tx);

            const signedTx = await WALLET.signTransaction({
                ...tx,
                gasLimit: gas,
                chainId: sourceNetworkDetails.chainId
            });

            const txResponse = await sourceProvider.sendTransaction(signedTx);
            logInfo(`Source payment submitted: ${txResponse.hash}`);

            const receipt = await txResponse.wait();
            logInfo(`Source payment confirmed on ${payloadJson.network}`);

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
                logError(`PacketSent event not found in transaction logs`);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            logInfo(`Processing cross-chain message on ${getChainNameById(destChainId)}...`);

            try {
                await this.processPacket(destNetworkDetails, packetSentEventData, receipt.transactionHash);

                logSuccess(`Cross-chain execution completed successfully`);
                logInfo(`Requesting protected resource with X402 payment proof...`);

                // Build response payload and call the API
                try {

                    const cdp = new CdpClient();
                    const cdpAccount = await cdp.evm.getOrCreateAccount({
                        name: "Omnix402Signer"
                    });

                    const account = toAccount(cdpAccount);
                    const fetchWithPayment = wrapFetchWithPayment(fetch, account);

                    const response = await fetchWithPayment(endpoint, {
                        method: "GET",
                    })

                    const body = await response.json();
                    const paymentResponse = decodeXPaymentResponse(response.headers.get("x-payment-response")!);

                    logSuccess(`X402 flow completed successfully!`);
                    logSuccess(`Protected resource accessed with payment proof`);
                    logInfo(`Payment response: ${JSON.stringify(paymentResponse)}`);

                    res.setHeader('X-Payment-Response', response.headers.get('X-Payment-Response'));
                    res.status(200).json(body);
                } catch (error) {
                    logError(`Error calling API for endpoint ${endpoint}: ${error}`);
                    res.status(500).json({ error: 'Error accessing protected resource' });
                }
            } catch (error) {
                logError(`Error during cross-chain bridge execution: ${error}`);
                res.status(500).json({ error: 'Internal Server Error during bridge' });
            }

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
        const gasPrice = currentGasPrice.mul(2);

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

        logInfo(`Destination transactions confirmed: verify, commit, and execute completed`);
    }
}