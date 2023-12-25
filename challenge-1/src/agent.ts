import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { NETHERMIND_DEPLOYER, FORTA_AGENTS_REGISTRY, CREATE_AGENT_ABI, UPDATE_AGENT_ABI } from "./constants";
import { createFinding } from "./findings";

function provideHandleTransaction(
  deployerAddress: string,
  fortaAgentsRegistry: string,
  createfunctionABI: string,
  updatefunctionABI: string
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    // check that transaction is from deplyerAddress
    if (txEvent.from != deployerAddress) return findings;

    // filter bot creation and update transactions
    const agentUpdatedEvents = txEvent.filterFunction(updatefunctionABI, fortaAgentsRegistry);
    const agentCreatedEvents = txEvent.filterFunction(createfunctionABI, fortaAgentsRegistry);

    // if no bot deployment events are found
    if (!agentCreatedEvents.length && !agentUpdatedEvents.length) return findings;

    agentCreatedEvents.forEach((event) => {
      findings.push(createFinding("Creation", txEvent.from, event.args));
    });

    agentUpdatedEvents.forEach((event) => {
      findings.push(createFinding("Update", txEvent.from, event.args));
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
