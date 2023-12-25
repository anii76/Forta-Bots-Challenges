import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (name: string, from: any, args: any) => {
  const { agentId, metadata, chainIds } = args;
  switch (name) {
    case "Creation":
      return Finding.fromObject({
        name: "Nethermind Bots Deployment Detector",
        description: `New bot created with id: ${agentId}`,
        alertId: "Nethermind-Bot-Creation",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          createdBy: from,
          agentId: agentId.toString(),
          metadata: metadata.toString(),
          chainIds: chainIds.toString(),
        },
      });
    default:
      return Finding.fromObject({
        name: "Nethermind Bots Update Detector",
        description: `New update for bot with id: ${agentId}`,
        alertId: "Nethermind-Bot-Update",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          agentId: agentId.toString(),
          metadata: metadata.toString(),
          chainIds: chainIds.toString(),
        },
      });
  }
};
