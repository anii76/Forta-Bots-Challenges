import { BlockEvent, Finding, HandleBlock, getEthersProvider, AlertQueryOptions } from "forta-agent";
import { providers, BigNumber, Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import { getAlerts, storeAlerts, getEscrowBalances, verifyInvariant } from "./utils";
import {
  BALANCE_ABI,
  BOT_ID,
  CHAIN_IDS,
  DAI_L1_ADDRESS,
  DAI_L2_ADDRESS,
  ESCROW_ARBITRUM_ADDRESS,
  ESCROW_OPTIMISM_ADDRESS,
  TOTAL_SUPPLY_ABI,
} from "./constants";
import { createEscrowFinding, createInvariantFinding } from "./findings";

const provider = getEthersProvider();

const iface = new Interface([BALANCE_ABI, TOTAL_SUPPLY_ABI]);

// Query for alerts fired by this bot
const query: AlertQueryOptions = {
  botIds: [BOT_ID],
  alertId: "L1-Escrow-Balance",
  first: 1,
};

//Addresses
const addresses = [DAI_L1_ADDRESS, DAI_L2_ADDRESS, ESCROW_ARBITRUM_ADDRESS, ESCROW_OPTIMISM_ADDRESS];

//use multicall to request both token balances in one call

export const provideHandleBlock =
  (provider: providers.Provider, iface: Interface, addresses: string[], alertQuery: AlertQueryOptions): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const { chainId } = await provider.getNetwork();
    const blockNumber = blockEvent.blockNumber;

    try {
      if (chainId == CHAIN_IDS.Ethereum) {
        //Check escrow balances
        const { balanceArbitrum, balanceOptimism } = await getEscrowBalances(
          iface,
          provider,
          blockNumber,
          addresses[0],
          addresses[2],
          addresses[3]
        );
        findings.push(createEscrowFinding(balanceArbitrum.toString(), balanceOptimism.toString()));

        //Store findings for later usage
        storeAlerts(findings, BOT_ID);
      } else if (chainId == CHAIN_IDS.Arbitrum || chainId == CHAIN_IDS.Optimism) {
        //Get Alerts
        const results = await getAlerts(alertQuery);
        if (results.alerts.length == 0) return findings;
        const lastAlert = results.alerts[0];
        const { isViolated, escrowBalance, l2DaiSupply } = await verifyInvariant(
          addresses[1],
          chainId,
          lastAlert,
          iface,
          provider,
          blockNumber
        );

        //Update findings when invariant is violated
        if (isViolated)
          findings.push(createInvariantFinding(escrowBalance.toString(), l2DaiSupply.toString(), chainId));
      }
    } catch (error) {
      console.log(error);
      return findings;
    }

    return findings;
  };

export default {
  handleBlock: provideHandleBlock(provider, iface, addresses, query),
};
