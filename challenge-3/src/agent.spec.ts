import { createAddress } from "forta-agent-tools";
import { TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { Finding, FindingSeverity, FindingType, HandleBlock } from "forta-agent";
import { utils, BigNumber, providers } from "ethers";
import { BALANCE_ABI, TOTAL_SUPPLY_ABI } from "./constants";
import { provideHandleBlock } from "./agent";

const iface: utils.Interface = new utils.Interface([
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
]);
const mockDaiL1Address = createAddress("0x1777");
const mockDaiL2Address = createAddress("0x2777");
const mockArbitrumEscrow = createAddress("0x3888");
const mockOptimismEscrow = createAddress("0x4777");

//fake supply & fake balances
const mockBalanceArbitrum = BigNumber.from(7634);
const mockBalanceOptimism = BigNumber.from(3516);

//valid supply
const mockL2Supply1 = BigNumber.from(777);

//invalid supply
const mockL2Supply2 = BigNumber.from(777777777);

//mock block num & chainId

//fake call to
const addCallToPool = (
  mockProvider: MockEthersProvider,
  block: number,
  iface: utils.Interface,
  tokenAddress: string,
  func: string
) => {
  mockProvider.addCallTo(tokenAddress, block, iface, "func", {
    inputs: [],
    outputs: [func],
  });
};

describe("MakerDAO Invariant Detector", () => {
  let handleBlock: HandleBlock;
  let mockBlockEvent: TestBlockEvent;
  let mockProvider: MockEthersProvider;

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    handleBlock = provideHandleBlock(mockProvider as any);
    mockProvider.call.mockClear();
  });

  //tests get balance
  it("returns escrow balances on l1", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(10);

    mockProvider.setNetwork(1);

    mockProvider
      .addCallTo(mockDaiL1Address, 10, iface, "balanceOf", {
        inputs: [mockArbitrumEscrow],
        outputs: [mockBalanceArbitrum],
      })
      .addCallTo(mockDaiL1Address, 10, iface, "balanceOf", {
        inputs: [mockOptimismEscrow],
        outputs: [mockBalanceOptimism],
      });

    const findings = await handleBlock(mockBlockEvent);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Escrow Account Balance",
        description: `Escrow Account balances `,
        alertId: "FORTA-6",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          balanceArbitrum: mockBalanceArbitrum.toString(),
          balanceOptimism: mockBalanceOptimism.toString(),
        },
      }),
    ]);
  });

  //test if there is no violation of the invariant
  it("returns empty findings if the invariant is not violated", async () => {
    mockBlockEvent = new TestBlockEvent().setNumber(10);

    mockProvider.setNetwork(10);

    //Add Alert logic

    mockProvider.addCallTo(mockDaiL2Address, 10, iface, "totalSupply", {
      inputs: [],
      outputs: [mockL2Supply1],
    });

    const findings = await handleBlock(mockBlockEvent);

    expect(findings).toStrictEqual([]);
  });

  //test if the invariant have been violated
  it("", async () => {});
});

//(sol 1)
//using Alerts ? => to get my own bot alerts ?
//So I can check for blocks when escrow mines a new block ? => how would I know
//---> do ppl use
//? check eth network balance
