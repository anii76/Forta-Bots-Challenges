import { BlockEvent, Finding, HandleBlock, getEthersProvider, AlertQueryOptions } from "forta-agent";
import { providers, BigNumber, Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import { LRUCache } from "lru-cache";
import { getAlerts, storeAlerts, getEscrowBalances } from "./utils";
import { BOT_ID, CHAIN_IDS } from "./constants";
import { createEscrowFinding } from "./findings";

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

let lastAlert: any;

export const provideHandleBlock =
  (provider: providers.Provider): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const { chainId } = await provider.getNetwork();
    const blockNumber = blockEvent.blockNumber;

    if (chainId == CHAIN_IDS.Ethereum) {
      findings.push(createEscrowFinding(getEscrowBalances(iface, provider, blockNumber)));

      //Store values for later usage
      storeAlerts(findings, BOT_ID);
    } else if (chainId == CHAIN_IDS.Arbitrum || chainId == CHAIN_IDS.Optimism) {
      // Query for alerts fired by this bot
      const query: AlertQueryOptions = {
        botIds: [BOT_ID],
        alertId: "l1-escrow-balance",
        first: 1,
      };
      const results = await getAlerts(query);

      if (results.alerts.length === 0) return findings;

      findings.push;
    }

    return findings;
  };

export default {
  handleBlock: provideHandleBlock(provider),
};
