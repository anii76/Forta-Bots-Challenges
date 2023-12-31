import { utils, BigNumber, providers } from "ethers";
import { getCreate2Address } from "@ethersproject/address";
import { HandleTransaction } from "forta-agent";
import { TestTransactionEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { LRUCache } from "lru-cache";
import { provideHandleTransaction } from "./agent";
import { createFinding } from "./findings";

const addCallToPool = (mockProvider: MockEthersProvider, block: number, poolAddress: string, poolData: any) => {
  mockProvider
    .addCallTo(poolAddress, block, iface, "token0", {
      inputs: [],
      outputs: [poolData.token0],
    })
    .addCallTo(poolAddress, block, iface, "token1", {
      inputs: [],
      outputs: [poolData.token1],
    })
    .addCallTo(poolAddress, block, iface, "fee", {
      inputs: [],
      outputs: [poolData.fee],
    });
};

const createMockPoolAddress = (factoryAddress: string, initHashCode: string, parameters: any[]) => {
  const abiCoder = new utils.AbiCoder();
  const encodedParams = abiCoder.encode(["address", "address", "uint24"], parameters);
  const salt = utils.solidityKeccak256(["bytes"], [encodedParams]);
  const computedAddress = getCreate2Address(factoryAddress, salt, initHashCode);
  return computedAddress.toLocaleLowerCase();
};

const mockFoctoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const mockInitHashCode = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";
const mockSwapEventAbi =
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)";
const mockUniswapPoolAbi = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
];

const iface = new utils.Interface(mockUniswapPoolAbi);

// Test cases
const mockValidPoolData1 = {
  token0: createAddress("0x87d6F8eDECcbCcA766D2880D19b2C3777D322C22"),
  token1: createAddress("0xc2132D05D31c914a87C6611C10748AEb04B58e8F"),
  fee: BigNumber.from(500),
};

const mockValidPoolData2 = {
  token0: createAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
  token1: createAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  fee: BigNumber.from(3000),
};

const mockValidPoolAddress1 = createMockPoolAddress(mockFoctoryAddress, mockInitHashCode, [
  mockValidPoolData1.token0,
  mockValidPoolData1.token1,
  mockValidPoolData1.fee,
]);

const mockValidPoolAddress2 = createMockPoolAddress(mockFoctoryAddress, mockInitHashCode, [
  mockValidPoolData2.token0,
  mockValidPoolData2.token1,
  mockValidPoolData2.fee,
]);

// Fail cases
const mockInvalidPoolData1 = {
  token0: createAddress("0x106"),
  token1: createAddress("0x5555"),
  fee: BigNumber.from(1337),
};

const mockInvalidPoolData2 = {
  token0: createAddress("0x444"),
  token1: createAddress("0x7777"),
  fee: BigNumber.from(50),
};

const mockInvalidPoolAddress1 = createAddress("0xccccd");
const mockInvalidPoolAddress2 = createAddress("0xdeadbeef");

// Test data
const mockSwapArgs1 = {
  sender: createAddress("0x2"),
  recipient: createAddress("0x3"),
  amount0: BigNumber.from("-71582139203725241498"),
  amount1: BigNumber.from("1499995"),
  sqrtPriceX96: BigNumber.from("11466435288667505250591"),
  liquidity: BigNumber.from("151253654937605407"),
  tick: -314985,
};

const mockSwapArgs2 = {
  sender: createAddress("0x4"),
  recipient: createAddress("0x5"),
  amount0: BigNumber.from("1337"),
  amount1: BigNumber.from("1223"),
  sqrtPriceX96: BigNumber.from("11"),
  liquidity: BigNumber.from("22"),
  tick: 33,
};

const mockFinding1 = createFinding(mockValidPoolAddress1, mockSwapArgs1);
const mockFinding2 = createFinding(mockValidPoolAddress2, mockSwapArgs2);

const testBlock = [2022, 2023, 2024];

describe("UniswapV3 Swaps Detector", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;
  let mockProvider: MockEthersProvider;
  let mockCache = new LRUCache<string, boolean>({ max: 1000 });

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    handleTransaction = provideHandleTransaction(
      mockSwapEventAbi,
      mockUniswapPoolAbi,
      mockFoctoryAddress,
      mockInitHashCode,
      mockProvider as unknown as providers.JsonRpcProvider,
      mockCache
    );
    mockProvider.call.mockClear();
  });

  it("returns empty findings if there are no swap events.", async () => {
    mockTxEvent = new TestTransactionEvent();

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if there is a valid swap event.", async () => {
    mockTxEvent = new TestTransactionEvent()
      .setBlock(testBlock[0])
      .addEventLog(mockSwapEventAbi, mockValidPoolAddress1, Object.values(mockSwapArgs1))
      .addEventLog(mockSwapEventAbi, mockInvalidPoolAddress1, Object.values(mockSwapArgs2));

    //valid swap call
    addCallToPool(mockProvider, testBlock[0], mockValidPoolAddress1, mockValidPoolData1);
    //invalid swap call
    addCallToPool(mockProvider, testBlock[0], mockInvalidPoolAddress1, mockInvalidPoolData1);

    const findings = await handleTransaction(mockTxEvent);

    expect(mockProvider.call).toHaveBeenCalledTimes(6);
    expect(findings).toStrictEqual([mockFinding1]);
  });

  it("returns empty findings if there are no valid swap events.", async () => {
    mockTxEvent = new TestTransactionEvent()
      .setBlock(testBlock[1])
      .addEventLog(mockSwapEventAbi, mockInvalidPoolAddress2, Object.values(mockSwapArgs1))
      .addEventLog(mockSwapEventAbi, mockInvalidPoolAddress1, Object.values(mockSwapArgs2));

    //invalid swap calls
    addCallToPool(mockProvider, testBlock[1], mockInvalidPoolAddress2, mockInvalidPoolData2);
    addCallToPool(mockProvider, testBlock[1], mockInvalidPoolAddress1, mockInvalidPoolData1);

    const findings = await handleTransaction(mockTxEvent);

    expect(mockCache.get(mockInvalidPoolAddress1)).toEqual(false);
    expect(mockProvider.call).toHaveBeenCalledTimes(3); //pool1 is already in cache
    expect(findings).toStrictEqual([]);
  });

  it("returns multiple findings if there are multiple swap events.", async () => {
    mockTxEvent = new TestTransactionEvent()
      .setBlock(testBlock[2])
      .addEventLog(mockSwapEventAbi, mockValidPoolAddress1, Object.values(mockSwapArgs1))
      .addEventLog(mockSwapEventAbi, mockValidPoolAddress2, Object.values(mockSwapArgs2))
      .addEventLog(mockSwapEventAbi, mockInvalidPoolAddress1, Object.values(mockSwapArgs1));

    //valid swap calls
    addCallToPool(mockProvider, testBlock[2], mockValidPoolAddress1, mockValidPoolData1);
    addCallToPool(mockProvider, testBlock[2], mockValidPoolAddress2, mockValidPoolData2);

    //invalid swap call
    addCallToPool(mockProvider, testBlock[2], mockInvalidPoolAddress1, mockInvalidPoolData1);

    const findings = await handleTransaction(mockTxEvent);

    expect(mockCache.get(mockInvalidPoolAddress1)).toEqual(false);
    expect(mockCache.get(mockValidPoolAddress1)).toEqual(true);
    expect(mockProvider.call).toHaveBeenCalledTimes(3); //validPool1 & invalidPool1 already in cache
    expect(findings).toStrictEqual([mockFinding1, mockFinding2]);
  });
});
