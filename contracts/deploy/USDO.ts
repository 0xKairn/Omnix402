import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'USDO'

const deploy: DeployFunction = async ({ getNamedAccounts, deployments, network, ethers }) => {
    console.log('Deploy script started...')
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()
    console.log(`>>> your address: ${deployer}`)

    const endpointV2Address = '0x1a44076050125825900e736c501f859c50fE728c'

    let usdcAddress: string

    if (network.name === 'base') {
        usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    } else if (network.name === 'polygon') {
        usdcAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
    } else {
        throw new Error(`Network not supported: ${network.name}`)
    }

    console.log(`>>> Using EndpointV2: ${endpointV2Address}`)
    console.log(`>>> Using USDC: ${usdcAddress}`)

    const result = await deploy(contractName, {
        from: deployer,
        args: ['USDO', 'USDO', endpointV2Address, deployer, usdcAddress],
        log: true,
        waitConfirmations: 1,
    })

    console.log(`✅ ${contractName} on ${network.name} deployed at: ${result.address}`)

    // Get OmnixRouter deployment
    const omnixRouter = await deployments.get('OmnixRouter')
    console.log(`>>> Found OmnixRouter at: ${omnixRouter.address}`)

    // Get USDO contract instance
    const usdo = await ethers.getContractAt(contractName, result.address)

    // Configure USDO to use OmnixRouter
    console.log('>>> Configuring USDO with OmnixRouter...')
    const setRouterTx = await usdo.setAuthorizedRouter(omnixRouter.address, true)
    await setRouterTx.wait()
    console.log('✅ OmnixRouter authorized on USDO')
}

deploy.tags = [contractName]
deploy.dependencies = ['OmnixRouter']
export default deploy
