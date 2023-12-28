import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { NETHERMIND_DEPLOYER, FORTA_AGENTS_REGISTRY, CREATE_AGENT_ABI, UPDATE_AGENT_ABI } from "./constants";
import { createFinding } from "./findings";

export function provideHandleTransaction(
  deployerAddress: string,
  fortaAgentsRegistry: string,
  createFunctionAbi: string,
  updateFunctionAbi: string
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    // check that transaction is from deplyerAddress
    if (txEvent.from !== deployerAddress) return findings;

    // filter bot creation and update transactions
    const agentDeploymentEvents = txEvent.filterFunction([updateFunctionAbi, createFunctionAbi], fortaAgentsRegistry);

    // if no bot deployment events are found
    if (!agentDeploymentEvents.length) return findings;

    agentDeploymentEvents.forEach((event) => {
      if (event.signature.includes("create")) {
        findings.push(createFinding("Creation", txEvent.from, event.args));
      } else if (event.signature.includes("update")) {
        findings.push(createFinding("Update", txEvent.from, event.args));
      }
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
