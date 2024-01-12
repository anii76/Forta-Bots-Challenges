import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (args: any): Finding => {
  const {} = args;
  return Finding.fromObject({
    name: "MakerDAO's Bridge Invariant ",
    description: "New Block mined",
    alertId: "new-block",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {},
  });
};
