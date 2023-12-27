import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (event: string, from: any, args: any) => {
  const { agentId, metadata, chainIds } = args;

  const commonProps = {
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      deployer: from,
      agentId: agentId.toString(),
      metadata: metadata.toString(),
      chainIds: chainIds.toString(),
    },
  };

  const findingProps: Record<string, any> = {
    Creation: {
      description: `New bot created with id: ${agentId}`,
      alertId: "Nethermind-Bot-Creation",
    },
    Update: {
      description: `New update for bot with id: ${agentId}`,
      alertId: "Nethermind-Bot-Update",
    },
  };

  return Finding.fromObject({
    name: `Nethermind Bots ${event} Detector`,
    ...findingProps[event],
    ...commonProps,
  });
};
