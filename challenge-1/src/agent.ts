import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

function provideHandleTransaction(): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    ///

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(),
};
