import * as dotenv from 'dotenv'
import { ethers } from 'ethers'

dotenv.config()

/**
 * Script pour rattraper TOUS les messages Polygon → Base en retard
 * Scan les dernières heures et traite les messages dans l'ordre des nonces
 */
const ENDPOINTS = {
    base: '0x1a44076050125825900e736c501f859c50fE728c',
    polygon: '0x1a44076050125825900e736c501f859c50fE728c',
}

const DVNS = {
    base: '0x380E3CfBC4260DAAde007F8DA9B8cFE19Cdd174c',
    polygon: '0x380E3CfBC4260DAAde007F8DA9B8cFE19Cdd174c',
}

const EXECUTORS = {
    base: '0xcB4BB65BF5434c55B2cF137AC36428abc86E5De6',
    polygon: '0xcB4BB65BF5434c55B2cF137AC36428abc86E5De6',
}

const RECEIVE_ULN302 = {
    base: '0xc70AB6f32772f59fBfc23889Caf4Ba3376C84bAf',
    polygon: '0x1322871e4ab09Bc7f5717189434f97bBD9546e95',
}

const OFT_CONTRACTS = {
    base: '0x5F04315f7574EF5B5f91113d6811d199Bd987Df3',
    polygon: '0x5F04315f7574EF5B5f91113d6811d199Bd987Df3',
}

const ENDPOINT_ABI = ['event PacketSent(bytes encodedPayload, bytes options, address sendLibrary)']

const DVN_ABI = [
    'function verify(bytes calldata _message, uint64 _nonce, uint32 _srcEid, bytes32 _remoteOApp, uint32 _dstEid, address _localOApp) external',
    'function commit(bytes calldata _message, uint64 _nonce, uint32 _srcEid, bytes32 _remoteOApp, uint32 _dstEid, address _localOApp) external',
]

const EXECUTOR_ABI = [
    `function commitAndExecute(address _receiveLib, tuple(tuple(uint32 srcEid, bytes32 sender, uint64 nonce) origin, address receiver, bytes32 guid, bytes message, bytes extraData, uint256 gas, uint256 value) _lzReceiveParam, tuple(address _receiver, uint256 _amount)[] _nativeDropParams) external payable`,
]

interface PacketData {
    nonce: bigint
    srcEid: number
    sender: string
    dstEid: number
    receiver: string
    guid: string
    message: string
    txHash: string
}

function decodePacket(encodedPayload: string): Omit<PacketData, 'txHash'> {
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

    return { nonce, srcEid, sender, dstEid, receiver, guid, message }
}

async function scanMessages(
    chain: 'base' | 'polygon',
    provider: ethers.providers.Provider,
    blocksToScan: number
): Promise<PacketData[]> {
    console.log(`\n🔍 Scan de ${chain.toUpperCase()}...`)

    const endpoint = new ethers.Contract(ENDPOINTS[chain], ENDPOINT_ABI, provider)
    const currentBlock = await provider.getBlockNumber()
    const fromBlock = currentBlock - blocksToScan

    console.log(`   Blocs ${fromBlock} à ${currentBlock} (${blocksToScan} blocs)`)

    const messages: PacketData[] = []

    // Alchemy Free tier: max 10 blocs par requête
    const CHUNK_SIZE = 10
    const totalChunks = Math.ceil(blocksToScan / CHUNK_SIZE)

    console.log(`   Scan par morceaux de ${CHUNK_SIZE} blocs (${totalChunks} chunks)...`)

    for (let i = 0; i < totalChunks; i++) {
        const chunkStart = fromBlock + i * CHUNK_SIZE
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, currentBlock)

        try {
            const filter = endpoint.filters.PacketSent()
            const events = await endpoint.queryFilter(filter, chunkStart, chunkEnd)

            for (const event of events) {
                const encodedPayload = event.args![0]
                const packet = decodePacket(encodedPayload)

                const senderAddress = '0x' + packet.sender.slice(-40)

                if (senderAddress.toLowerCase() === OFT_CONTRACTS[chain].toLowerCase()) {
                    messages.push({
                        ...packet,
                        txHash: event.transactionHash,
                    })
                }
            }
        } catch (error: any) {
            console.error(`   ⚠️  Erreur chunk ${chunkStart}-${chunkEnd}: ${error.message}`)
        }

        // Petit délai pour éviter de spammer l'API
        if (i < totalChunks - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
    }

    console.log(`   Trouvé ${messages.length} message(s) OFT`)
    return messages
}

async function processMessage(packet: PacketData, destChain: 'base' | 'polygon', destSigner: ethers.Signer) {
    const receiverAddress = '0x' + packet.receiver.slice(-40)

    console.log(`\n📦 Traitement nonce ${packet.nonce}`)
    console.log(`   GUID: ${packet.guid}`)
    console.log(`   Tx: ${packet.txHash}`)

    try {
        // Gas prices fixes basés sur les prix actuels des réseaux
        const gasPrice =
            destChain === 'polygon'
                ? ethers.utils.parseUnits('300', 'gwei') // Polygon: 150 gwei
                : ethers.BigNumber.from(10000000) // Base: 0.03 Gwei

        // 1. DVN verify
        console.log(`   [1/3] DVN verify()...`)
        const dvn = new ethers.Contract(DVNS[destChain], DVN_ABI, destSigner)

        try {
            const verifyTx = await dvn.verify(
                packet.message,
                packet.nonce,
                packet.srcEid,
                packet.sender,
                packet.dstEid,
                receiverAddress,
                { gasLimit: 200000, gasPrice } // Optimisé
            )
            await verifyTx.wait()
            console.log(`   ✅ Verified`)
        } catch (verifyError: any) {
            // Si verify échoue, le message est probablement déjà traité
            console.log(`   ⏭️  Verify échoué (probablement déjà traité), skip!`)
            return true
        }

        // 2. DVN commit
        console.log(`   [2/3] DVN commit()...`)
        try {
            const commitTx = await dvn.commit(
                packet.message,
                packet.nonce,
                packet.srcEid,
                packet.sender,
                packet.dstEid,
                receiverAddress,
                { gasLimit: 200000, gasPrice } // Optimisé
            )
            await commitTx.wait()
            console.log(`   ✅ Committed`)
        } catch (commitError: any) {
            // Si commit échoue, tenter quand même l'execute (peut-être déjà commit par un autre service)
            console.log(`   ⚠️  Commit échoué, mais on tente l'execute quand même...`)
        }

        // 3. Executor commitAndExecute
        console.log(`   [3/3] Executor commitAndExecute()...`)
        const executor = new ethers.Contract(EXECUTORS[destChain], EXECUTOR_ABI, destSigner)

        const lzReceiveParam = {
            origin: { srcEid: packet.srcEid, sender: packet.sender, nonce: packet.nonce },
            receiver: receiverAddress,
            guid: packet.guid,
            message: packet.message,
            extraData: '0x',
            gas: 200000, // Optimisé
            value: 0,
        }

        const executeTx = await executor.commitAndExecute(RECEIVE_ULN302[destChain], lzReceiveParam, [], {
            gasLimit: 300000, // Optimisé
            value: 0,
            gasPrice,
        })
        await executeTx.wait()
        console.log(`   ✅ Executed!`)

        return true
    } catch (error: any) {
        console.error(`   ❌ Erreur: ${error.message}`)
        if (error.receipt) {
            console.error(`   Status: ${error.receipt.status}, Gas used: ${error.receipt.gasUsed.toString()}`)
        }
        return false
    }
}

async function main() {
    console.log('🚀 Rattrapage des messages Polygon → Base (30 minutes)')
    console.log('======================================================')

    const baseProvider = new ethers.providers.JsonRpcProvider(
        process.env.RPC_URL_BASE || 'https://base-mainnet.g.alchemy.com/v2/oO7Tan9PlYE5inNIhTNvUAFhVt2mB6jb'
    )
    const polygonProvider = new ethers.providers.JsonRpcProvider(
        process.env.RPC_URL_POLYGON || 'https://polygon-mainnet.g.alchemy.com/v2/nVGr4NqhpoczDN8BqH8iZFT_jWYUBD_y'
    )

    const baseSigner = new ethers.Wallet(process.env.PRIVATE_KEY!, baseProvider)

    console.log(`\n👤 Wallet: ${baseSigner.address}`)

    // Scan les 30 dernières minutes sur Polygon
    // Polygon: ~30 blocs/min × 30 min = 900 blocs
    console.log('\n⏳ Scan des 30 dernières minutes sur Polygon...')
    const polygonMessages = await scanMessages('polygon', polygonProvider, 750)

    if (polygonMessages.length === 0) {
        console.log('\n✅ Aucun message Polygon → Base trouvé dans les 30 dernières minutes.')
        return
    }

    // Trier par nonce
    polygonMessages.sort((a, b) => Number(a.nonce) - Number(b.nonce))

    console.log(`\n🔄 Traitement de ${polygonMessages.length} message(s) Polygon → Base`)
    console.log("   (Dans l'ordre des nonces)\n")

    let successCount = 0
    let failCount = 0

    for (const msg of polygonMessages) {
        const success = await processMessage(msg, 'base', baseSigner)
        if (success) {
            successCount++
        } else {
            failCount++
        }
    }

    console.log('\n📊 Résumé:')
    console.log(`   ✅ Réussis: ${successCount}`)
    console.log(`   ❌ Échoués: ${failCount}`)
    console.log('\n🎉 Rattrapage terminé!')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Erreur:', error)
        process.exit(1)
    })
