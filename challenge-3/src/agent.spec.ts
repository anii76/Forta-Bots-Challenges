import { createAddress } from "forta-agent-tools";
import { TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { Alert, AlertQueryOptions, AlertsResponse, Finding, GetAlerts, HandleBlock } from "forta-agent";
import { utils, BigNumber, providers } from "ethers";
import { BALANCE_ABI, BOT_ID, CHAIN_IDS, TOTAL_SUPPLY_ABI } from "./constants";
import { provideHandleBlock } from "./agent";
import { createEscrowFinding, createInvariantFinding } from "./findings";
import { AlertInput } from "forta-agent-tools/lib/utils";
import { Addresses } from "./utils";

const iface: utils.Interface = new utils.Interface([BALANCE_ABI, TOTAL_SUPPLY_ABI]);

//mock addresses
const mockAddresses: Addresses = {
  l1Dai: createAddress("0x1777"),
  l2Dai: createAddress("0x2777"),
  escrowArbitrum: createAddress("0x3888"),
  escrowOptimism: createAddress("0x4777"),
};

//mock escrow balances
const mockBalanceArbitrum = BigNumber.from(7634);
const mockBalanceOptimism = BigNumber.from(3516);

//valid supply
const mockL2Supply1 = BigNumber.from(777);

//invalid supply
const mockL2Supply2 = BigNumber.from(777777777);

//mock block num
const mockBlockNumber = 1337;

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

//create alert from finding
const mockAlert = (finding: Finding): Alert => {
  let alertInput: AlertInput = {
    addresses: finding.addresses,
    alertId: finding.alertId,
    name: finding.name,
    description: finding.description,
    metadata: finding.metadata,
    protocol: finding.protocol,
    source: {
      bot: {
        id: BOT_ID,
      },
    },
  };
  return Alert.fromObject(alertInput);
};

//store alerts from L1 findings
let mockAlerts: Alert[] = [];

//mock getAlert
const mockGetAlerts: GetAlerts = async (query: AlertQueryOptions): Promise<AlertsResponse> => {
  const alerts: Alert[] = mockAlerts;
  const results: Alert[] = alerts.filter((alert) => {
    return alert.source?.bot?.id && query.botIds?.includes(alert.source.bot.id) && alert.alertId == query.alertId;
  });
  return {
    alerts: results,
    pageInfo: {
      hasNextPage: false,
    },
  };
};

describe("MakerDAO's Bridge Invariant Check", () => {
  let handleBlock: HandleBlock;
  let mockBlockEvent: TestBlockEvent;
  let mockProvider: MockEthersProvider;

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
  });

  //checks escrow balances
  it("returns escrow balances on L1", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(CHAIN_IDS.Ethereum);

    mockProvider
      .addCallTo(mockAddresses.l1Dai, mockBlockNumber, iface, "balanceOf", {
        inputs: [mockAddresses.escrowArbitrum],
        outputs: [mockBalanceArbitrum],
      })
      .addCallTo(mockAddresses.l1Dai, mockBlockNumber, iface, "balanceOf", {
        inputs: [mockAddresses.escrowOptimism],
        outputs: [mockBalanceOptimism],
      });

    handleBlock = provideHandleBlock(mockProvider as any, iface, mockAddresses, mockGetAlerts);

    const findings = await handleBlock(mockBlockEvent);
    expect(findings).toStrictEqual([mockEscrowFinding]);

    findings.forEach((finding) => {
      mockAlerts.push(mockAlert(finding));
    });
  });

  //test if there is no violation of the invariant
  it("returns empty findings if the invariant is not violated on Optimism", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(CHAIN_IDS.Optimism);

    mockProvider.addCallTo(mockAddresses.l2Dai, mockBlockNumber, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply1],
    });

    handleBlock = provideHandleBlock(mockProvider as any, iface, mockAddresses, mockGetAlerts);

    const findings = await handleBlock(mockBlockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if the invariant is not violated on Arbitrum", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(CHAIN_IDS.Arbitrum);

    mockProvider.addCallTo(mockAddresses.l2Dai, mockBlockNumber, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply1],
    });

    handleBlock = provideHandleBlock(mockProvider as any, iface, mockAddresses, mockGetAlerts);

    const findings = await handleBlock(mockBlockEvent);

    expect(findings).toStrictEqual([]);
  });

  //test if the invariant have been violated
  it("returns a finding if the invariant has been violated on Optimism", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(CHAIN_IDS.Optimism);

    mockProvider.addCallTo(mockAddresses.l2Dai, mockBlockNumber, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply2],
    });

    handleBlock = provideHandleBlock(mockProvider as any, iface, mockAddresses, mockGetAlerts);

    const findings = await handleBlock(mockBlockEvent);

    expect(findings).toStrictEqual([mockInvariantFindingOptimism]);
  });

  //test if the invariant have been violated
  it("returns a finding if the invariant has been violated on Arbitrum", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(CHAIN_IDS.Arbitrum);

    mockProvider.addCallTo(mockAddresses.l2Dai, mockBlockNumber, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply2],
    });

    handleBlock = provideHandleBlock(mockProvider as any, iface, mockAddresses, mockGetAlerts);

    const findings = await handleBlock(mockBlockEvent);

    expect(findings).toStrictEqual([mockInvariantFindingArbitrum]);
  });

  //test if the invariant have been violated on both L2 chains
  it("returns findings if the invariant has been violated on both Arbitrum & Optimism", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(mockBlockNumber);

    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(CHAIN_IDS.Optimism);

    mockProvider.addCallTo(mockAddresses.l2Dai, mockBlockNumber, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply2],
    });

    handleBlock = provideHandleBlock(mockProvider as any, iface, mockAddresses, mockGetAlerts);

    const findingsOptimism = await handleBlock(mockBlockEvent);

    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(CHAIN_IDS.Arbitrum);

    mockProvider.addCallTo(mockAddresses.l2Dai, mockBlockNumber, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply2],
    });

    handleBlock = provideHandleBlock(mockProvider as any, iface, mockAddresses, mockGetAlerts);

    const findingsArbitrum = await handleBlock(mockBlockEvent);

    expect(findingsOptimism).toStrictEqual([mockInvariantFindingOptimism]);
    expect(findingsArbitrum).toStrictEqual([mockInvariantFindingArbitrum]);
  });
});
