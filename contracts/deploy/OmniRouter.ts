import { type DeployFunction } from 'hardhat-deploy/types'

const contractName = 'OmniRouter'

const deploy: DeployFunction = async ({ getNamedAccounts, deployments, network }) => {
    console.log('Deploy script started...')
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()
    console.log(`>>> your address: ${deployer}`)

    const result = await deploy(contractName, {
        from: deployer,
        args: [deployer],
        log: true,
        waitConfirmations: 1,
    })

    console.log(`✅ ${contractName} on ${network.name} deployed at: ${result.address}`)
}

deploy.tags = [contractName]
export default deploy
