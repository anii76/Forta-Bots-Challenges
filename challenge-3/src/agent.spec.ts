import { createAddress } from "forta-agent-tools";
import { TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { AlertQueryOptions, HandleBlock } from "forta-agent";
import { utils, BigNumber, providers } from "ethers";
import { BALANCE_ABI, BOT_ID, CHAIN_IDS, TOTAL_SUPPLY_ABI } from "./constants";
import { provideHandleBlock } from "./agent";
import { createEscrowFinding, createInvariantFinding } from "./findings";

const iface: utils.Interface = new utils.Interface([BALANCE_ABI, TOTAL_SUPPLY_ABI]);

//mock addresses
const mockDaiL1Address = createAddress("0x1777");
const mockDaiL2Address = createAddress("0x2777");
const mockArbitrumEscrow = createAddress("0x3888");
const mockOptimismEscrow = createAddress("0x4777");

const mockAddresses = [mockDaiL1Address, mockDaiL2Address, mockArbitrumEscrow, mockOptimismEscrow];

//mock escrow balances
const mockBalanceArbitrum = BigNumber.from(7634);
const mockBalanceOptimism = BigNumber.from(3516);

//valid supply
const mockL2Supply1 = BigNumber.from(777);

//invalid supply
const mockL2Supply2 = BigNumber.from(777777777);

//mock block num
const mockBlockNumber = 1337;

//mock alert query
const mockAlertQuery: AlertQueryOptions = {
  botIds: [BOT_ID],
  alertId: "L1-Escrow-Balance",
  first: 1,
};


//mock findings
const mockEscrowFinding = createEscrowFinding(mockBalanceArbitrum.toString(), mockBalanceOptimism.toString());
const mockInvariantFindingArbitrum = createInvariantFinding(
  mockBalanceArbitrum.toString(),
  mockL2Supply2.toString(),
  CHAIN_IDS.Arbitrum
);
const mockInvariantFindingOptimism = createInvariantFinding(
  mockBalanceOptimism.toString(),
  mockL2Supply2.toString(),
  CHAIN_IDS.Optimism
);

describe("MakerDAO's Bridge Invariant Check", () => {
  let handleBlock: HandleBlock;
  let mockBlockEvent: TestBlockEvent;
  let mockProvider: MockEthersProvider;

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    handleBlock = provideHandleBlock(mockProvider as any, iface, mockAddresses, mockAlertQuery);
    mockProvider.call.mockClear();
  });

  //checks escrow balances
  it("returns escrow balances on L1", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider.setNetwork(CHAIN_IDS.Ethereum);

    mockProvider
      .addCallTo(mockDaiL1Address, mockBlockNumber, iface, "balanceOf", {
        inputs: [mockArbitrumEscrow],
        outputs: [mockBalanceArbitrum],
      })
      .addCallTo(mockDaiL1Address, mockBlockNumber, iface, "balanceOf", {
        inputs: [mockOptimismEscrow],
        outputs: [mockBalanceOptimism],
      });

    const findings = await handleBlock(mockBlockEvent);
    expect(findings).toStrictEqual([mockEscrowFinding]);
  });

  //test if there is no violation of the invariant
  it("returns empty findings if the invariant is not violated on Optimism", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider.setNetwork(CHAIN_IDS.Optimism);

    mockProvider.addCallTo(mockDaiL2Address, mockBlockNumber, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply1],
    });

    const findings = await handleBlock(mockBlockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if the invariant is not violated on Arbitrum", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider.setNetwork(CHAIN_IDS.Arbitrum);

    mockProvider.addCallTo(mockDaiL2Address, mockBlockNumber, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply1],
    });

    const findings = await handleBlock(mockBlockEvent);

    expect(findings).toStrictEqual([]);
  });

  //test if the invariant have been violated
  it("returns a finding if the invariant has been violated on Optimism", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider.setNetwork(CHAIN_IDS.Optimism);

    mockProvider.addCallTo(mockDaiL2Address, mockBlockNumber, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply2],
    });

    const findings = await handleBlock(mockBlockEvent);

    expect(findings).toStrictEqual([mockInvariantFindingOptimism]);
  });

  //test if the invariant have been violated
  it("returns a finding if the invariant has been violated on Arbitrum", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider.setNetwork(CHAIN_IDS.Arbitrum);

    mockProvider.addCallTo(mockDaiL2Address, mockBlockNumber, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply2],
    });

    const findings = await handleBlock(mockBlockEvent);

    expect(findings).toStrictEqual([mockInvariantFindingArbitrum]);
  });
});
