import { type DeployFunction } from 'hardhat-deploy/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

const contractName = 'OmnixRouter'

const deploy: DeployFunction = async ({ deployments, network, ethers }) => {
    console.log(`\n>>> Configuring OmnixRouter on ${network.name}...`)

    const omnixRouterDeployment = await deployments.get(contractName)
    const omnixRouter = await ethers.getContractAt(contractName, omnixRouterDeployment.address)
    console.log(`>>> OmnixRouter at: ${omnixRouter.address}`)

    let remoteNetwork: string
    let remoteChainId: number
    let remoteEid: number
    let remoteUSDO: string

    if (network.name === 'base') {
        remoteNetwork = 'polygon'
        remoteChainId = 137
        remoteEid = EndpointId.POLYGON_V2_MAINNET
        try {
            const polygonUSDO = await deployments.get('USDO')
            remoteUSDO = polygonUSDO.address
        } catch {
            console.log('⚠️  USDO not yet deployed on Polygon, skipping configuration')
            return
        }
    } else if (network.name === 'polygon') {
        remoteNetwork = 'base'
        remoteChainId = 8453
        remoteEid = EndpointId.BASE_V2_MAINNET
        try {
            const baseUSDO = await deployments.get('USDO')
            remoteUSDO = baseUSDO.address
        } catch {
            console.log('⚠️  USDO not yet deployed on Base, skipping configuration')
            return
        }
    } else {
        console.log('⚠️  Network not supported')
        return
    }

    console.log(`>>> Configuring route to ${remoteNetwork}:`)
    console.log(`    ChainId: ${remoteChainId}`)
    console.log(`    EID: ${remoteEid}`)
    console.log(`    USDO: ${remoteUSDO}`)

    const tx = await omnixRouter.setChainIdEidOFT(remoteChainId, remoteEid, remoteUSDO)
    await tx.wait()

    console.log('✅ OmnixRouter configured!')
}

deploy.tags = ['ConfigureOmnixRouter']
deploy.dependencies = ['OmnixRouter', 'USDO']
deploy.runAtTheEnd = true

export default deploy
