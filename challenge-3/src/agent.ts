import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  getEthersProvider,
  getAlerts,
  AlertQueryOptions,
  AlertEvent,
  HandleAlert,
  Alert,
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { providers, BigNumber, Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import { LRUCache } from "lru-cache";
import { getEscrowBalance } from "./utils";

const iface = new Interface([
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
]);

//LRU Cache <address(dai)[blocknum?],{balances?} [2 caches , one for L1 second for L2]
const cacheL1: LRUCache<string, any> = new LRUCache<string, any>({ max: 500 });
const cacheL2: LRUCache<string, any> = new LRUCache<string, any>({ max: 500 });

//-------------------------------------------------------------
//use multicall to request both token balances in one call

//using network calls ? can I call both networks or not.(let's try by manually changing the network)
//or use calls with same infura key

const ESCROW_ARBITRUM_ADDRESS = "0xA10c7CE4b876998858b1a9E12b10092229539400";
const ESCROW_OPTIMISM_ADDRESS = "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65";
const DAI_L1_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const DAI_L2_ADDRESS = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";

const provider = getEthersProvider();

export const provideHandleBlock =
  (provider: providers.Provider): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const { chainId } = await provider.getNetwork();

    if (chainId == 1) {
      console.log(blockEvent.blockNumber);
      const daiContract = new Contract(DAI_L1_ADDRESS, iface, provider);

      const escrowBalance1: BigNumber = await daiContract.balanceOf(ESCROW_ARBITRUM_ADDRESS, {
        blockTag: blockEvent.blockNumber,
      });
      const escrowBalance2: BigNumber = await daiContract.balanceOf(ESCROW_OPTIMISM_ADDRESS, {
        blockTag: blockEvent.blockNumber,
      });

      //store values for next usage ? [last alert]

      //const { escrowBalance1, escrowBalance2 } = await getEscrowBalance(iface, provider, blockEvent.blockNumber)
      findings.push(
        Finding.fromObject({
          name: "Escrow Account Balance",
          description: `Escrow Account balances `,
          alertId: "FORTA-6",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            balanceArbitrum: escrowBalance1.toString(),
            balanceOptimism: escrowBalance2.toString(),
          },
        })
      );
    } else {
      const daiContract = new Contract(DAI_L2_ADDRESS, iface, provider);
      const l2DaiSupply = await daiContract.totalSupply({ blockTag: blockEvent.blockNumber });

      /*const query: AlertQueryOptions = {
        botIds: ["0xdb5f76edad8195236876f0ddf13c2e6b3ac807e5b2b6a9d8b7795a8c0fa59f22"],
        alertId: "FORTA-6",
        first: 1,
      };
      const results = await getAlerts(query);

      results.alerts.forEach((alert) => {
        const escrowBalance = chainId == 10 ? alert.metadata.balanceArbitrum : alert.metadata.balanceOptimism;
      });*/

      const escrowBalance = 75447518676562565558777777; //mock value to test

      if (l2DaiSupply > escrowBalance)
        findings.push(
          Finding.fromObject({
            name: "MakerDOA Invariant violated",
            description: `invariant violated`,
            alertId: "FORTA-7",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            metadata: {
              network: blockEvent.network.toString(),
              l2DaiSupply: l2DaiSupply.toString(),
            },
          })
        );
    }

    //get alert now ? I guess then compare balances ? [get previous balance & compare them :)) & if this is the first call (without cache then pass)]

    return findings;
  };

export const provideHandleAlert =
  (provider: providers.Provider): HandleAlert =>
  async (alertEvent: AlertEvent) => {
    const findings: Finding[] = [];

    return findings;
  };

export default {
  handleBlock: provideHandleBlock(provider),
  //handleAlert: provideHandleAlert(provider),
};

/**
 * 
interface NetworkData {
  address: string;
  num: number;
}

const data: Record<number, NetworkData> = {
  // Arbitrum DAI Escrow
  10: {
    address: "0xA10c7CE4b876998858b1a9E12b10092229539400",
    num: 1,
  },
  // Optimism DAI Escrow
  42161: {
    address: "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
    num: 2,
  },
};
const networkManager = new NetworkManager<NetworkData>(data);

const provideInitilize = (networkManager: NetworkManager<NetworkData>, provider: providers.Provider): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

//networkManager.get("address"); // "address1" if the ChainID is 1, "address42" if the ChainID is 42

 */
