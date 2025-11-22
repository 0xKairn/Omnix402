import { ethers } from 'ethers'
import 'dotenv/config'

async function main() {
    const POLYGON_RPC = process.env.RPC_URL_POLYGON || 'https://polygon-rpc.com'
    const PRIVATE_KEY = process.env.PRIVATE_KEY

    if (!PRIVATE_KEY) {
        console.error('PRIVATE_KEY not found in .env')
        process.exit(1)
    }

    const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

    console.log('\nChecking wallet status...')
    console.log(`Wallet address: ${wallet.address}`)

    const currentNonce = await wallet.getTransactionCount('latest')
    const pendingNonce = await wallet.getTransactionCount('pending')
    const balance = await wallet.getBalance()

    console.log(`\nCurrent nonce: ${currentNonce}`)
    console.log(`Pending nonce: ${pendingNonce}`)
    console.log(`Balance: ${ethers.utils.formatEther(balance)} MATIC`)

    if (currentNonce === pendingNonce) {
        console.log('\nNo stuck transactions found')
        return
    }

    console.log(`\nFound ${pendingNonce - currentNonce} stuck transaction(s)`)

    const currentGasPrice = await provider.getGasPrice()
    const higherGasPrice = currentGasPrice.mul(2)

    console.log(`\nCurrent gas price: ${ethers.utils.formatUnits(currentGasPrice, 'gwei')} gwei`)
    console.log(`New gas price: ${ethers.utils.formatUnits(higherGasPrice, 'gwei')} gwei`)

    console.log(`\nSending replacement transaction with nonce ${currentNonce}...`)

    const tx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0,
        nonce: currentNonce,
        gasPrice: higherGasPrice,
        gasLimit: 21000,
    })

    console.log(`Transaction sent: ${tx.hash}`)
    console.log(`\nWaiting for confirmation...`)

    const receipt = await tx.wait()

    console.log(`\nTransaction confirmed in block ${receipt.blockNumber}`)
    console.log(`Gas used: ${receipt.gasUsed.toString()}`)
    console.log(`\nTransaction unstuck successfully`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\nError:', error.message)
        process.exit(1)
    })
