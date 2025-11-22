import { Router } from "express";
import { logError } from "../utils";
import { ethers } from "ethers";
import { AUTHORIZED_NETWORKS, EXTRA_USDO, NETWORKS_DETAILS } from "../const";

export class EndpointRoute {
    public router: Router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/health', this.getHealth);
        this.router.get('/', this.getEndpointRequirements);
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

            const destNetworkDetails = NETWORKS_DETAILS[body.accepts[0].network];

            body.accepts[0].network = network;
            body.accepts[0].payTo = destNetworkDetails.USDOAddress;
            body.accepts[0].asset = destNetworkDetails.USDOAddress;
            body.accepts[0].extra = EXTRA_USDO;

            const data = ethers.utils.defaultAbiCoder.encode(
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

            body.accepts[0].data = data;

            res.status(402).json({
                ...body
            });
        } catch (error) {
            logError(`Error fetching endpoint requirements: ${error}`);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}