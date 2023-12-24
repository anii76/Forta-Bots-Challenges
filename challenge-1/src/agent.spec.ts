import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import agent from "./agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";

const mockDeployerAddress = "0x88dc3a2284fa62e0027d6d6b1fcfdd2141a143b8";
const mockRegistryAddress = "0x61447385B019187daa48e91c55c02AF1F1f3F863";
const mockAnotherAddress = createAddress("0x1");
const mockCreateAgentAbi =
  "function createAgent(uint256 agentId, address, string metadata, uint256[] chainIds) external";
const mockUpdateAgentAbi = "function updateAgent(uint256 agentId, string metadata, uint256[] chainIds) public";
const mockAnotherFunctionAbi = "function mockAnotherFunction(uint256 agentId, string metadata, uint256[] chainIds)";
const mockAgentId = "1337";
const mockChainIds = [137];
const mockMetadata = "MockMetadata";

const mockCreateFinding = Finding.fromObject({
  name: "Nethermind Bots Deployment Detector",
  description: `New bot created with id: ${mockAgentId}`,
  alertId: "Nethermind-Bot-Creation",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  metadata: {
    createdBy: mockDeployerAddress,
    agentId: mockAgentId,
    metadata: mockMetadata,
    chainIds: mockChainIds.toString(),
  },
});

const mockUpdateFinding = Finding.fromObject({
  name: "Nethermind Bots Update Detector",
  description: `New update for bot with id: ${mockAgentId}`,
  alertId: "Nethermind-Bot-Update",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  metadata: {
    agentId: mockAgentId,
    metadata: mockMetadata,
    chainIds: mockChainIds.toString(),
  },
});

describe("Nethermind Bots Deployment Detector", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent().setTo(mockRegistryAddress).setFrom(mockDeployerAddress);
  });

  it("returns empty findings if bot was not deployed by Nethermind", async () => {
    const mockTxEvent = new TestTransactionEvent()
      .setFrom(mockAnotherAddress)
      .setTo(mockRegistryAddress)
      .addTraces({
        to: mockAnotherAddress,
        from: mockDeployerAddress,
        function: mockCreateAgentAbi,
        arguments: [mockAgentId, mockAnotherAddress, mockMetadata, mockChainIds],
      });

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if bot was deployed to wrong registry", async () => {
    const mockTxEvent = new TestTransactionEvent()
      .setFrom(mockDeployerAddress)
      .setTo(mockAnotherAddress)
      .addTraces({
        to: mockAnotherAddress,
        from: mockDeployerAddress,
        function: mockCreateAgentAbi,
        arguments: [mockAgentId, mockAnotherAddress, mockMetadata, mockChainIds],
      });

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if bot was updated to wrong registry", async () => {
    const mockTxEvent = new TestTransactionEvent()
      .setFrom(mockDeployerAddress)
      .setTo(mockAnotherAddress)
      .addTraces({
        to: mockAnotherAddress,
        from: mockDeployerAddress,
        function: mockUpdateAgentAbi,
        arguments: [mockAgentId, mockMetadata, mockChainIds],
      });

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if tx is not a bot deployment or update", async () => {
    mockTxEvent.addTraces({
      to: mockRegistryAddress,
      from: mockDeployerAddress,
      function: mockAnotherFunctionAbi,
      arguments: [mockAgentId, mockMetadata, mockChainIds],
    });

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if no bot was deployed", async () => {
    mockTxEvent = new TestTransactionEvent().setTo(mockRegistryAddress).setFrom(mockDeployerAddress);

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if a new bot was deployed", async () => {
    mockTxEvent = new TestTransactionEvent()
      .setTo(mockRegistryAddress)
      .setFrom(mockDeployerAddress)
      .addTraces({
        to: mockRegistryAddress,
        from: mockDeployerAddress,
        function: mockCreateAgentAbi,
        arguments: [mockAgentId, mockDeployerAddress, mockMetadata, mockChainIds],
      });

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([mockCreateFinding]);
  });

  it("returns a finding if a bot was updated", async () => {
    mockTxEvent = new TestTransactionEvent()
      .setTo(mockRegistryAddress)
      .setFrom(mockDeployerAddress)
      .addTraces({
        to: mockRegistryAddress,
        from: mockDeployerAddress,
        function: mockUpdateAgentAbi,
        arguments: [mockAgentId, mockMetadata, mockChainIds],
      });

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([mockUpdateFinding]);
  });

  it("returns multiple findings if there are multiple create/update events", async () => {
    mockTxEvent = new TestTransactionEvent()
      .setTo(mockRegistryAddress)
      .setFrom(mockDeployerAddress)
      //CreateAgent function
      .addTraces({
        to: mockRegistryAddress,
        from: mockDeployerAddress,
        function: mockCreateAgentAbi,
        arguments: [mockAgentId, mockDeployerAddress, mockMetadata, mockChainIds],
      })
      //UpdateAgent function
      .addTraces({
        to: mockRegistryAddress,
        from: mockDeployerAddress,
        function: mockUpdateAgentAbi,
        arguments: [mockAgentId, mockMetadata, mockChainIds],
      })
      //Another function
      .addTraces({
        to: mockRegistryAddress,
        from: mockDeployerAddress,
        function: mockAnotherFunctionAbi,
        arguments: [mockAgentId, mockMetadata, mockChainIds],
      });

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([mockCreateFinding, mockUpdateFinding]);
  });
});
