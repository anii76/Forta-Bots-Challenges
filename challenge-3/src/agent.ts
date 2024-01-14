import {
  BlockEvent,
  Finding,
  HandleBlock,
  getEthersProvider,
  AlertQueryOptions,
  GetAlerts,
  getAlerts,
} from "forta-agent";
import { providers, BigNumber, Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import { Addresses, getEscrowBalances, verifyInvariant } from "./utils";
import { BALANCE_ABI, TOTAL_SUPPLY_ABI, BOT_ID, CHAIN_IDS, ADDRESSES } from "./constants";
import { createEscrowFinding, createInvariantFinding } from "./findings";

const provider = getEthersProvider();

const iface = new Interface([BALANCE_ABI, TOTAL_SUPPLY_ABI]);

//query for alerts fired by this bot
const query: AlertQueryOptions = {
  botIds: [BOT_ID],
  alertId: "L1-Escrow-Balance",
  first: 1,
};

//store previous balances
let previousBalances = {
  balanceArbitrum: BigNumber.from(0),
  balanceOptimism: BigNumber.from(0),
};

export const provideHandleBlock =
  (provider: providers.Provider, iface: Interface, addresses: Addresses, getAlerts: GetAlerts): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const { chainId } = await provider.getNetwork();
    const blockNumber = blockEvent.blockNumber;

    try {
      if (chainId == CHAIN_IDS.Ethereum) {
        //check escrow balances
        const { balanceArbitrum, balanceOptimism } = await getEscrowBalances(
          iface,
          provider,
          blockNumber,
          addresses.l1Dai,
          addresses.escrowArbitrum,
          addresses.escrowOptimism
        );

        //check previous balances
        if (
          previousBalances.balanceArbitrum.eq(balanceArbitrum) &&
          previousBalances.balanceOptimism.eq(balanceOptimism)
        )
          return findings;
        else {
          //update balances
          previousBalances.balanceArbitrum = balanceArbitrum;
          previousBalances.balanceOptimism = balanceOptimism;

          //fire alert when balances have changed
          findings.push(createEscrowFinding(balanceArbitrum.toString(), balanceOptimism.toString()));
        }
      } else if (chainId == CHAIN_IDS.Arbitrum || chainId == CHAIN_IDS.Optimism) {
        //get latest alert
        const results = await getAlerts(query);
        if (results.alerts.length == 0) return findings;
        const lastAlert = results.alerts[0];
        

        //verify if invariant is violated
        const { isViolated, escrowBalance, l2DaiSupply } = await verifyInvariant(
          addresses.l2Dai,
          chainId,
          lastAlert,
          iface,
          provider,
          blockNumber
        );

        //update findings when invariant is violated
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
  handleBlock: provideHandleBlock(provider, iface, ADDRESSES, getAlerts),
};
