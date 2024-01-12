import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createEscrowFinding = (escrowBalances: any): Finding => {
  const { balanceArbitrum, balanceOptimism } = escrowBalances;
  return Finding.fromObject({
    name: "MakerDAO's Bridge Invariant ",
    description: "New block mined",
    alertId: "l1-escrow-balance",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      balanceArbitrum: balanceArbitrum.toString(),
      balanceOptimism: balanceOptimism.toString(),
    },
  });
};

export const createInvariantFinding = (args: any): Finding => {
  const { network, l2DaiSupply } = args;
  return Finding.fromObject({
    name: "MakerDOA Bridge Invariant violated",
    description: `invariant violated`,
    alertId: "makerDAO-invariant-violated",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      network: network.toString(),
      l2DaiSupply: l2DaiSupply.toString(),
    },
  });
};
