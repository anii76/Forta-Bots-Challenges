import { Interface } from "@ethersproject/abi";
import { BigNumber, Contract, providers } from "ethers";
import { Alert } from "forta-agent";
import { DAI_L1_ADDRESS, ESCROW_ARBITRUM_ADDRESS, ESCROW_OPTIMISM_ADDRESS } from "./constants";

export const verifyInvariant = async (chainId: number, alert: Alert) => {
  /*const query: AlertQueryOptions = {
        botIds: ["0xdb5f76edad8195236876f0ddf13c2e6b3ac807e5b2b6a9d8b7795a8c0fa59f22"],
        alertId: "FORTA-6",
        first: 1,
      };
      const results = await getAlerts(query);

      results.alerts.forEach((alert) => {
        const escrowBalance = chainId == 10 ? alert.metadata.balanceArbitrum : alert.metadata.balanceOptimism;
      });*/
  const escrowBalance = chainId == 10 ? alert.metadata.balanceArbitrum : alert.metadata.balanceOptimism;
};

export const getEscrowBalance = async (
  iface: Interface,
  provider: providers.Provider,
  blockNumber: number
): Promise<any> => {
  const daiContract = new Contract(DAI_L1_ADDRESS, iface, provider);

  const escrowBalance1: BigNumber = await daiContract.balanceOf(ESCROW_ARBITRUM_ADDRESS, { blockTag: blockNumber });
  const escrowBalance2: BigNumber = await daiContract.balanceOf(ESCROW_OPTIMISM_ADDRESS, { blockTag: blockNumber });

  return { escrowBalance1, escrowBalance2 };
};
