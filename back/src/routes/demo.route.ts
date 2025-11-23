import { ethers } from "ethers";
import { Router } from "express";
import { NETWORKS_DETAILS, WALLET, PacketData, x402Payload, networkDetail } from "../const";
import { CallRepository } from "../repositories/call.repository";
import { checkIfDestHasEnoughUSDC, logError, decodePacket, logInfo, buildTransferAuthorizationDigest } from "../utils";
import usdoABI from "../abis/usdo.abi.json";
import omnixExecutorABI from "../abis/omnixExecutor.abi.json";
import omnixDVNABI from "../abis/omnixDVN.abi.json";
import { CdpClient } from "@coinbase/cdp-sdk";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { toAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

export class DemoRoute {
    public router: Router = Router();

    constructor(
        private callRepository: CallRepository
    ) {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/', this.demo);
        this.router.get('/call', this.getCall);
    }

    private getCall = async (req: any, res: any) => {
        try {
            const { callId } = req.query;
            const call = await this.callRepository.getCallById(callId);
            if (!call) {
                return res.status(404).json({ error: 'Call not found' });
            }
            res.status(200).json(call);
        } catch (error: any) {
            logError(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    private demo = async (req: any, res: any) => {
        try {
            const cdp = new CdpClient();
            const cdpAccount = await cdp.evm.getOrCreateAccount({
                name: "Omnix402Signer"
            });

            const account = toAccount(cdpAccount);

            const demoURL = "https://proxy.x402scan.com/api/proxy?url=https%3A%2F%2Fpay.lnpay.ai%2Fresource&share_data=true";
            const sourceNetwork = "polygon"

            logInfo(`Starting X402 demo flow`);
            logInfo(`Fetching payment requirements from ${demoURL}`);

            const response = await fetch(demoURL, {
                method: 'GET'
            });

            const body = await response.json();

            const sourceNetworkDetails = NETWORKS_DETAILS[sourceNetwork];
            const destNetworkDetails = NETWORKS_DETAILS[body.accepts[0].network];

            logInfo(`Payment required: ${body.accepts[0].maxAmountRequired} USDC`);
            logInfo(`Source chain: ${sourceNetwork}, Destination chain: ${body.accepts[0].network}`);
            logInfo(`Preparing cross-chain payment authorization...`);

            const hasEnoughUSDC = await checkIfDestHasEnoughUSDC(
                destNetworkDetails,
                body.accepts[0].maxAmountRequired
            );

            if (!hasEnoughUSDC) {
                return res.status(400).json({ error: 'Insufficient USDC balance in destination' });
            }

            const transferData = ethers.utils.defaultAbiCoder.encode(
                ['address', 'bytes'],
                [
                    sourceNetworkDetails.OmnixRouterAddress,
                    ethers.utils.defaultAbiCoder.encode(
                        ['uint256', 'address', 'address'],
                        [
                            destNetworkDetails.chainId,
                            destNetworkDetails.payementReceiver,
                            body.accepts[0].payTo
                        ]
                    )
                ]
            );

            const sourceProvider = new ethers.providers.JsonRpcProvider(sourceNetworkDetails.rpcUrl);
            const sourceUSDOContract = new ethers.Contract(
                sourceNetworkDetails.USDOAddress,
                usdoABI,
                sourceProvider
            );

            const TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH = await sourceUSDOContract.TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH();
            const DOMAIN_SEPARATOR = await sourceUSDOContract.DOMAIN_SEPARATOR();
            const now = new Date();
            const validAfter = Math.floor(now.getTime() / 1000) - 60;
            const validBefore = validAfter + 3600;
            const nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));

            const structHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256', 'bytes32', 'bytes'],
                    [
                        TRANSFER_WITH_AUTHORIZATION_EXTENDED_TYPEHASH,
                        WALLET.address,
                        sourceNetworkDetails.OmnixRouterAddress,
                        body.accepts[0].maxAmountRequired,
                        validAfter,
                        validBefore,
                        nonce,
                        transferData
                    ]
                )
            );

            // Build the digest with EIP-712 standard
            const digest = ethers.utils.keccak256(
                ethers.utils.solidityPack(
                    ['string', 'bytes32', 'bytes32'],
                    ['\x19\x01', DOMAIN_SEPARATOR, structHash]
                )
            );

            const signingKey = new ethers.utils.SigningKey(WALLET.privateKey);
            const signature = signingKey.signDigest(digest);

            const { v, r, s } = signature;

            const data = await sourceUSDOContract.populateTransaction['transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes,uint8,bytes32,bytes32)'](
                WALLET.address,
                sourceNetworkDetails.OmnixRouterAddress,
                body.accepts[0].maxAmountRequired,
                validAfter,
                validBefore,
                nonce,
                transferData,
                v, r, s
            );

            const currentGasPrice = await sourceProvider.getGasPrice()
            const gasPrice = currentGasPrice.mul(3).div(2);
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

            // before sending transaction, we can save it to the database only for demo purposes
            const call = await this.callRepository.createNewCall({
                sourceChainName: sourceNetwork,
                destinationChainName: body.accepts[0].network,
                sourcePaymentStatus: 'PENDING'
            });

            const txResponse = await sourceProvider.sendTransaction(signedTx);
            logInfo(`Source payment submitted: ${txResponse.hash}`);

            // send response to the client
            res.status(200).json({
                callId: call._id
            });

            await this.callRepository.updateCall(call._id, {
                sourcePaymentTxHash: txResponse.hash
            });

            try {
                const receipt = await txResponse.wait();
                logInfo(`Source payment confirmed on ${sourceNetwork}`);

                await this.callRepository.updateCall(call._id, {
                    sourcePaymentStatus: 'CONFIRMED'
                });

                // Extract PacketSent event
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
                        continue;
                    }
                }

                if (!packetSentEventData) {
                    logError(`PacketSent event not found in transaction logs`);
                    await this.callRepository.updateCall(call._id, {
                        sourcePaymentStatus: 'FAILED'
                    });
                    return;
                }

                logInfo(`Processing cross-chain message on ${body.accepts[0].network}...`);

                // Process packet on destination chain
                try {
                    const txHashes = await this.processPacket(destNetworkDetails, packetSentEventData, receipt.transactionHash);

                    await this.callRepository.updateCall(call._id, {
                        verifyStatus: 'CONFIRMED',
                        verifyHash: txHashes.verifyTxHash,
                        relayStatus: 'CONFIRMED',
                        relayHash: txHashes.commitTxHash,
                        executionStatus: 'CONFIRMED',
                        executionHash: txHashes.executeTxHash
                    });

                    logInfo(`Cross-chain execution completed successfully`);
                    logInfo(`Requesting protected resource with X402 payment proof...`);

                    // Build response payload and call the API
                    try {
                        const fetchWithPayment = wrapFetchWithPayment(fetch, account);

                        const response = await fetchWithPayment(demoURL, {
                            method: "GET",
                        })

                        const body = await response.json();

                        const paymentResponse = decodeXPaymentResponse(response.headers.get("x-payment-response")!);

                        await this.callRepository.updateCall(call._id, {
                            xPaymentResponse: paymentResponse,
                            bodyResponse: body
                        });

                        logInfo(`✓ X402 flow completed successfully! Call ID: ${call._id}`);
                        logInfo(`Protected resource accessed with payment proof`);
                        logInfo(`Payment response: ${JSON.stringify(paymentResponse)}`);;
                    } catch (error) {
                        logError(`Error calling API for call ${call._id}: ${error}`);
                    }
                } catch (error) {
                    logError(`Error processing packet for call ${call._id}: ${error}`);
                    await this.callRepository.updateCall(call._id, {
                        verifyStatus: 'FAILED',
                        relayStatus: 'FAILED',
                        executionStatus: 'FAILED'
                    });
                }

            } catch (error) {
                await this.callRepository.updateCall(call._id, {
                    sourcePaymentStatus: 'FAILED'
                });
            }
        } catch (error) {
            logError(`Error in demo endpoint: ${error}`);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async processPacket(
        networkDetails: any,
        packet: PacketData,
        sourceTxHash: string
    ): Promise<{ verifyTxHash: string, commitTxHash: string, executeTxHash: string }> {
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
            nonce: nonce,
            chainId: networkDetails.chainId
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
            nonce: nonce + 1,
            chainId: networkDetails.chainId
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
        const executeData = await destExecutor.populateTransaction.commitAndExecute(networkDetails.ReceiveULN302Address, lzReceiveParam, []);

        const executeTx = {
            from: signer.address,
            to: networkDetails.OmnixExecutorAddress,
            data: executeData.data,
            gasLimit: ethers.BigNumber.from(800000),
            gasPrice: gasPrice.sub(2),
            nonce: nonce + 2,
            chainId: networkDetails.chainId
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

        logInfo(`Destination transactions confirmed: verify, commit, and execute completed`);;

        return {
            verifyTxHash: verifyTxResponse.hash,
            commitTxHash: commitTxResponse.hash,
            executeTxHash: executeTxResponse.hash
        };
    }
}