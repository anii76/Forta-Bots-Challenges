import { Finding, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import { CREATE_AGENT_ABI, UPDATE_AGENT_ABI, NETHERMIND_DEPLOYER, FORTA_AGENTS_REGISTRY } from "./constants";
import agent from "./agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";

describe("Nethermind Bots Deployment Detector", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;

  const mockDeployerAddress = NETHERMIND_DEPLOYER;
  const mockRegistryAddress = FORTA_AGENTS_REGISTRY;
  const mockAnotherAddress = createAddress("0x1");
  const mockCREATE_AGENT_ABI = CREATE_AGENT_ABI;
  const mockUPDATE_AGENT_ABI = UPDATE_AGENT_ABI;
  const mockAnotherFunctionAbi = "function mockAnotherFunction(uint256 agentId, string metadata, uint256[] chainIds)";
  const mockAgentId = "1337";
  const mockChainIds = [137];
  const mockMetadata = "MockMetadata";

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("returns empty findings if bot was not deployed by Nethermind", async () => {
      const mockTxEvent = new TestTransactionEvent().setFrom(mockAnotherAddress);

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
          function: mockCREATE_AGENT_ABI,
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
          function: mockUPDATE_AGENT_ABI,
          arguments: [mockAgentId, mockMetadata, mockChainIds],
        });

      const findings = await handleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
    });

    beforeEach(() => {
      mockTxEvent = new TestTransactionEvent().setTo(mockRegistryAddress).setFrom(mockDeployerAddress);
    });

    const mockCreateFinding = Finding.fromObject({
      name: "Nethermind Bots Deployment Detector",
      description: `New bot created with id: ${mockAgentId}`,
      alertId: "NM-Bot-1",
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
      alertId: "NM-Bot-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        agentId: mockAgentId,
        metadata: mockMetadata,
        chainIds: mockChainIds.toString(),
      },
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
          function: mockCREATE_AGENT_ABI,
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
          function: mockUPDATE_AGENT_ABI,
          arguments: [mockAgentId, mockMetadata, mockChainIds],
        });

      const findings = await handleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([mockUpdateFinding]);
    });

    it("returns multiple findings if there are multiple create/update events", async () => {
      mockTxEvent = new TestTransactionEvent()
        .setTo(mockRegistryAddress)
        .setFrom(mockDeployerAddress)
        .addTraces({
          to: mockRegistryAddress,
          from: mockDeployerAddress,
          function: mockCREATE_AGENT_ABI,
          arguments: [mockAgentId, mockDeployerAddress, mockMetadata, mockChainIds],
        })
        .addTraces({
          to: mockRegistryAddress,
          from: mockDeployerAddress,
          function: mockUPDATE_AGENT_ABI,
          arguments: [mockAgentId, mockMetadata, mockChainIds],
        });

      const findings = await handleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([mockCreateFinding, mockUpdateFinding]);
    });
  });
});
