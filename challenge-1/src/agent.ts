import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { NETHERMIND_DEPLOYER, FORTA_AGENTS_REGISTRY, CREATE_AGENT_ABI, UPDATE_AGENT_ABI } from "./constants";

function provideHandleTransaction(
  deployerAddress: string,
  FORTA_AGENTS_REGISTRY: string,
  createfunctionABI: string,
  updatefunctionABI: string
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    // check that transaction is from deplyerAddress
    if (txEvent.from != deployerAddress) return findings;

    // filter bot creation and update transactions
    const agentUpdatedEvents = txEvent.filterFunction(updatefunctionABI, FORTA_AGENTS_REGISTRY);
    const agentCreatedEvents = txEvent.filterFunction(createfunctionABI, FORTA_AGENTS_REGISTRY);

    // if no bot deployment events are found
    if (!agentCreatedEvents.length && !agentUpdatedEvents.length) return findings;

    agentCreatedEvents.forEach((event) => {
      // extract createAgent function arguments
      const { agentId, metadata, chainIds } = event.args;

      findings.push(
        Finding.fromObject({
          name: "Nethermind Bots Deployment Detector",
          description: `New bot created with id: ${agentId}`,
          alertId: "NM-Bot-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            createdBy: txEvent.from,
            agentId: agentId.toString(),
            metadata: metadata.toString(),
            chainIds: chainIds.toString(),
          },
        })
      );
    });

    agentUpdatedEvents.forEach((event) => {
      // extract updateAgent function arguments
      const { agentId, metadata, chainIds } = event.args;

      findings.push(
        Finding.fromObject({
          name: "Nethermind Bots Update Detector",
          description: `New update for bot with id: ${agentId}`,
          alertId: "NM-Bot-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            agentId: agentId.toString(),
            metadata: metadata.toString(),
            chainIds: chainIds.toString(),
          },
        })
      );
    });

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(
    NETHERMIND_DEPLOYER,
    FORTA_AGENTS_REGISTRY,
    CREATE_AGENT_ABI,
    UPDATE_AGENT_ABI
  ),
};
