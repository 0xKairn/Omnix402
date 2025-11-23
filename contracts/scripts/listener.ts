import * as dotenv from 'dotenv'
import { ethers } from 'ethers'

import OmnixDVNBase from '../deployments/base/OmnixDVN.json'
import OmnixExecutorBase from '../deployments/base/OmnixExecutor.json'
import USDOBase from '../deployments/base/USDO.json'
import OmnixDVNPolygon from '../deployments/polygon/OmnixDVN.json'
import OmnixExecutorPolygon from '../deployments/polygon/OmnixExecutor.json'
import USDOPolygon from '../deployments/polygon/USDO.json'

dotenv.config()

const ENDPOINTS = {
    base: '0x1a44076050125825900e736c501f859c50fE728c',
    polygon: '0x1a44076050125825900e736c501f859c50fE728c',
}

const DVNS = {
    base: OmnixDVNBase.address,
    polygon: OmnixDVNPolygon.address,
}

const EXECUTORS = {
    base: OmnixExecutorBase.address,
    polygon: OmnixExecutorPolygon.address,
}

const RECEIVE_ULN302 = {
    base: '0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf',
    polygon: '0x1322871e4ab09Bc7f5717189434f97bBD9546e95',
}

const GAS_LIMITS = {
    DVN_VERIFY: 200000,
    DVN_COMMIT: 200000,
    EXECUTOR_COMMIT_AND_EXECUTE: 500000,
    LZ_RECEIVE: 200000,
}

const GAS_MULTIPLIER = 1.5

const USDO_CONTRACTS = {
    base: USDOBase.address,
    polygon: USDOPolygon.address,
}

const RPC_URLS = {
    base: process.env.RPC_URL_BASE || 'https://mainnet.base.org',
    polygon: process.env.RPC_URL_POLYGON || 'https://polygon-rpc.com',
}

const ENDPOINT_ABI = ['event PacketSent(bytes encodedPayload, bytes options, address sendLibrary)']

const DVN_ABI = OmnixDVNBase.abi
const EXECUTOR_ABI = OmnixExecutorBase.abi

interface PacketData {
    nonce: bigint
    srcEid: number
    sender: string
    dstEid: number
    receiver: string
    guid: string
    message: string
}

function decodePacket(encodedPayload: string): PacketData {
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
        receiver,
        guid,
        message,
    }
}

const processedPackets = new Set<string>()

async function processPacket(
    sourceChain: 'base' | 'polygon',
    destChain: 'base' | 'polygon',
    packet: PacketData,
    txHash: string,
    destDVNSigner: ethers.Signer,
    destExecutorSigner: ethers.Signer
) {
    const packetId = `${packet.guid}-${sourceChain}-${destChain}`
    if (processedPackets.has(packetId)) {
        return
    }

    const senderAddress = '0x' + packet.sender.slice(-40)
    const receiverAddress = '0x' + packet.receiver.slice(-40)

    console.log(`\nPacketSent detected: ${sourceChain.toUpperCase()} -> ${destChain.toUpperCase()}`)
    console.log(`   Tx: ${txHash}`)
    console.log(`   From: ${senderAddress}`)
    console.log(`   To: ${receiverAddress}`)
    console.log(`   Nonce: ${packet.nonce}`)
    console.log(`   GUID: ${packet.guid}`)

    try {
        const provider = destDVNSigner.provider as ethers.providers.Provider
        const currentGasPrice = await provider.getGasPrice()
        const gasPrice = currentGasPrice.mul(Math.floor(GAS_MULTIPLIER * 10)).div(10)

        const destDVN = new ethers.Contract(DVNS[destChain], DVN_ABI, destDVNSigner)
        const destExecutor = new ethers.Contract(EXECUTORS[destChain], EXECUTOR_ABI, destExecutorSigner)

        console.log(`\nOptimized transaction flow...`)
        console.log(`   Current gas price: ${ethers.utils.formatUnits(currentGasPrice, 'gwei')} gwei`)
        console.log(`   Using gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei (${GAS_MULTIPLIER}x)`)

        console.log(`   [1/3] Broadcasting verify()...`)
        const verifyTx = await destDVN.verify(
            packet.message,
            packet.nonce,
            packet.srcEid,
            packet.sender,
            packet.dstEid,
            receiverAddress,
            {
                gasLimit: GAS_LIMITS.DVN_VERIFY,
                gasPrice,
            }
        )
        console.log(`      -> ${verifyTx.hash}`)

        console.log(`   [2/3] Broadcasting commit()...`)
        const commitTx = await destDVN.commit(
            packet.message,
            packet.nonce,
            packet.srcEid,
            packet.sender,
            packet.dstEid,
            receiverAddress,
            {
                gasLimit: GAS_LIMITS.DVN_COMMIT,
                gasPrice,
            }
        )
        console.log(`      -> ${commitTx.hash}`)

        console.log(`   [3/3] Broadcasting execute()...`)
        const lzReceiveParam = {
            origin: {
                srcEid: packet.srcEid,
                sender: packet.sender,
                nonce: packet.nonce,
            },
            receiver: receiverAddress,
            guid: packet.guid,
            message: packet.message,
            extraData: '0x',
            gas: GAS_LIMITS.LZ_RECEIVE,
            value: 0,
        }

        const executeTx = await destExecutor.commitAndExecute(RECEIVE_ULN302[destChain], lzReceiveParam, [], {
            gasLimit: GAS_LIMITS.EXECUTOR_COMMIT_AND_EXECUTE,
            value: 0,
            gasPrice,
        })
        console.log(`      -> ${executeTx.hash}`)

        console.log(`\n   Waiting for all 3 transactions...`)
        await executeTx.wait()
        console.log(`      Done!`)

        processedPackets.add(packetId)

        console.log(`\nTransaction cross-chain completed with custom DVN + Executor!`)
        console.log(`   LayerZero Scan: https://layerzeroscan.com/tx/${txHash}`)
    } catch (error: any) {
        console.error(`\nError during processing:`, error.message)
        if (error.error) {
            console.error(`   Details:`, error.error.message || error.error)
        }
        if (error.receipt) {
            console.error(`   Receipt status:`, error.receipt.status)
            console.error(`   Gas used:`, error.receipt.gasUsed.toString())
        }
        if (error.reason) {
            console.error(`   Revert reason:`, error.reason)
        }
        if (error.data) {
            console.error(`   Revert data:`, error.data)
        }
        if (error.error?.data) {
            console.error(`   Error data (raw):`, error.error.data)
        }
    }
}

async function listenAndProcess(
    sourceChain: 'base' | 'polygon',
    destChain: 'base' | 'polygon',
    sourceProvider: ethers.providers.Provider,
    destDVNSigner: ethers.Signer,
    destExecutorSigner: ethers.Signer
) {
    console.log(`\nListening: ${sourceChain.toUpperCase()} -> ${destChain.toUpperCase()}`)
    const sourceEndpoint = new ethers.Contract(ENDPOINTS[sourceChain], ENDPOINT_ABI, sourceProvider)

    sourceEndpoint.on('PacketSent', async (encodedPayload, options, sendLibrary, event) => {
        try {
            const packet = decodePacket(encodedPayload)
            const senderAddress = '0x' + packet.sender.slice(-40)
            const receiverAddress = '0x' + packet.receiver.slice(-40)

            if (
                senderAddress.toLowerCase() !== USDO_CONTRACTS[sourceChain].toLowerCase() ||
                receiverAddress.toLowerCase() !== USDO_CONTRACTS[destChain].toLowerCase()
            ) {
                return
            }

            processPacket(sourceChain, destChain, packet, event.transactionHash, destDVNSigner, destExecutorSigner)
        } catch (error: any) {
            console.error(`\nError:`, error.message)
        }
    })

    sourceProvider.on('error', (error) => {
        console.error(`\nProvider error on ${sourceChain}:`, error.message)
    })
}

async function main() {
    console.log('Listener for USDO cross-chain')
    console.log('=====================================\n')

    const baseProvider = new ethers.providers.JsonRpcProvider(RPC_URLS.base, {
        name: 'base',
        chainId: 8453,
    })
    baseProvider.pollingInterval = 4000

    const polygonProvider = new ethers.providers.JsonRpcProvider(RPC_URLS.polygon, {
        name: 'polygon',
        chainId: 137,
    })
    polygonProvider.pollingInterval = 4000

    const baseSigner = new ethers.Wallet(process.env.PRIVATE_KEY!, baseProvider)
    const polygonSigner = new ethers.Wallet(process.env.PRIVATE_KEY!, polygonProvider)

    console.log(`Wallet: ${baseSigner.address}\n`)

    console.log('Configuration:')
    console.log(`   DVN Base: ${DVNS.base}`)
    console.log(`   DVN Polygon: ${DVNS.polygon}`)
    console.log(`   Executor Base: ${EXECUTORS.base}`)
    console.log(`   Executor Polygon: ${EXECUTORS.polygon}`)
    console.log(`   USDO Base: ${USDO_CONTRACTS.base}`)
    console.log(`   USDO Polygon: ${USDO_CONTRACTS.polygon}`)

    await listenAndProcess('base', 'polygon', baseProvider, polygonSigner, polygonSigner)
    await listenAndProcess('polygon', 'base', polygonProvider, baseSigner, baseSigner)

    console.log('\nListener started! Press Ctrl+C to stop.\n')

    await new Promise(() => {})
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
