import { HandleTransaction } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { createFinding } from "./findings";

const mockDeployerAddress = createAddress("0x1");
const mockRegistryAddress = createAddress("0x2");
const mockAnotherAddress = createAddress("0x3");

const mockCreateAgentAbi =
  "function createAgent(uint256 agentId, address, string metadata, uint256[] chainIds) external";
const mockUpdateAgentAbi = "function updateAgent(uint256 agentId, string metadata, uint256[] chainIds) public";
const mockAnotherFunctionAbi = "function mockAnotherFunction(uint256 agentId, string metadata, uint256[] chainIds)";

const mockAgentId = 1337;
const mockChainIds = [137];
const mockMetadata = "MockMetadata";
const mockArgs = {
  agentId: mockAgentId,
  metadata: mockMetadata,
  chainIds: mockChainIds,
};

const mockCreateFinding = createFinding("Creation", mockDeployerAddress, mockArgs);
const mockUpdateFinding = createFinding("Update", mockDeployerAddress, mockArgs);

describe("Nethermind Bots Deployment Detector", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      mockDeployerAddress,
      mockRegistryAddress,
      mockCreateAgentAbi,
      mockUpdateAgentAbi
    );
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
