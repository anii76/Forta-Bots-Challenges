import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { CHAIN_IDS, L1_ALERT_ID, L2_ALERT_ID } from "./constants";

export const createEscrowFinding = (balanceArbitrum: string, balanceOptimism: string): Finding => {
  return Finding.fromObject({
    name: "MakerDAO's L1 escrow balance of Arbitrum & Optimism",
    description: `Arbitrum's escrow balance ${balanceArbitrum} - Optimism's escrow balance ${balanceOptimism}`,
    alertId: L1_ALERT_ID,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Ethereum",
    metadata: {
      balanceArbitrum: balanceArbitrum,
      balanceOptimism: balanceOptimism,
    },
  });
};

export const createInvariantFinding = (escrowBalance: string, l2DaiSupply: string, network: number): Finding => {
  const networkName = network == CHAIN_IDS.Arbitrum ? "Arbitrum" : "Optimism";
  return Finding.fromObject({
    name: "MakerDAO Bridge Invariant Violated",
    description: `L2Dai.totalSupply() : ${l2DaiSupply} > L1Dai.balanceOf(${networkName}Escrow): ${escrowBalance}`,
    alertId: L2_ALERT_ID,
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    protocol: networkName,
    metadata: {
      network: network.toString(),
      l2DaiSupply: l2DaiSupply,
      escrowBalance: escrowBalance,
    },
  });
};
