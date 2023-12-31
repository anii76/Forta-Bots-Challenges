import { HandleTransaction } from "forta-agent";
import { getCreate2Address } from "@ethersproject/address";
import { provideHandleTransaction } from "./agent";
import { TestTransactionEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { createFinding } from "./findings";
import { LRUCache } from "lru-cache";
import { utils, BigNumber, providers } from "ethers";
import { POOL_INIT_CODE_HASH, SWAP_EVENT, UNISWAP_FACTORY, UNISWAP_POOL_ABI } from "./constants"; //remove those apres :))

//I like the way they added Cases and Fail_cases !

//UniswapV2 factory 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f
//these are not mock variables :))
const mockFoctoryAddress = UNISWAP_FACTORY; //probably keep original createAddress("0x1");
const mockInitHashCode = POOL_INIT_CODE_HASH;
const mockSwapEventAbi = SWAP_EVENT;

const mockSwapArgs = {
  //tx.address must be pool
  sender: "0xE592427A0AEce92De3Edee1F18E0157C05861564", //createAddress("0x2"),
  recipient: "0x96Fa062Fa34B7fE0Da35efcb4D11093a525b87e5", //createAddress("0x3"),
  amount0: BigNumber.from("-71582139203725241498"), //BigNumber.from('1337'),
  amount1: BigNumber.from("1499995"), //BigNumber.from('1223'),
  sqrtPriceX96: BigNumber.from("11466435288667505250591"), //BigNumber.from('11'),
  liquidity: BigNumber.from("151253654937605407"), //BigNumber.from('22'),
  tick: -314985, //33,
};

const mockCache = new LRUCache<string, boolean>({ max: 1000 });
//---------------------------------------------------------
//create a contract ? or bring real data ? [I can create a new pooladdress locally ??]
//i can create addresses based of factory+initHash :))

//const mockValidUniswapPool = createAddress("0x4"); //modify those
//const mockUnvalidUniswapPool = createAddress("0x5"); //modify those
//real pool on mainnet : https://etherscan.io/address/0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8
//getPool("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", 3000)
//polygon
const mockValidUniswapPool1 = {
  address: "0x71c5ce9df27ea2cef83bef4f4c241eaf6ccfc621", //"0x941061770214613ba0ca3db9a700c39587bb89b6",
  token0: "0x87d6F8eDECcbCcA766D2880D19b2C3777D322C22", //"0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  token1: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", //"0x430EF9263E76DAE63c84292C3409D61c598E9682",
  fee: BigNumber.from(500), //BigNumber.from(10000),
};
//ethereum (if i wanted to change to polygon : https://polygonscan.com/address/0x31083a78e11b18e450fd139f9abea98cd53181b7#readContract)
const mockValidUniswapPool2 = {
  address: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
  token0: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  token1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  fee: 3000, //Bignumber
};
//Unfortunately they don't have the same swap signature x))
//UniswapV2 factoryAddress => 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f (ethereum)
//https://etherscan.io/tx/0x925b099aa38b0e6fbf0f5779dadbda0b0b55d2ab75cf4703dbe1fd66f83657be#eventlog
/*const mockInvalidUniswapPool = {
    address: "0x35a1274fE8E6f4F167718bA32d36FeB00D5b5821", 
    token0: "0x931570B9958EcDa453CE2dF777CE7d1b4A96D06c",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    fee: 0, //not needed x))
} */

//AlgebraPool (QuickSwap DEX Protocol) x)) [polygon]
//https://polygonscan.com/tx/0x168714ac8d4badc2ada95a1467bdb33134957f18f618051cf12ff6ff7dc91a3e#eventlog
const mockInvalidUniswapPool = {
  address: "0x7B925e617aefd7FB3a93Abe3a701135D7a1Ba710",
  token0: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  token1: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  fee: 0, //not needed x))
};

const mockInvalidUniswapPool2 = {
  address: createAddress("0xdeadbeef"),
  token0: createAddress("0x444"),
  token1: createAddress("0x7777"),
  fee: BigNumber.from(50), //not needed x))
};

const mockValidUniswapPool = {
    address: createAddress("0x133355"),
    token0: createAddress("0x4474"),
    token1: createAddress("0x77747"),
    fee: BigNumber.from(1000), //not needed x))
  };

//update like this https://github.com/NethermindEth/Forta-Agents/blob/3c6e6f8aac447d2afb5e17e4bb0851a582c014c0/Apeswap-Bots/New-Pair-Creation/src/agent.spec.ts#L86
const createMockPoolAddress = (factoryAddress: string, initHashCode: string, parameters: any[]) => {
  const abiCoder = new utils.AbiCoder();
  const encodedParams = abiCoder.encode(["address", "address", "uint24"], parameters);
  const salt = utils.solidityKeccak256(["bytes"], [encodedParams]);
  const computedAddress = getCreate2Address(factoryAddress, salt, initHashCode);
  return computedAddress;
};

const mockValidPoolAddress = createMockPoolAddress(mockFoctoryAddress, mockInitHashCode, [
  createAddress("0x444"),
  createAddress("0x7777"),
  3000,
]);
const mockInvalidPoolAddress = createAddress("0x17773"); //createMockPoolAddress(mockFoctoryAddress, mockInitHashCode,[ createAddress("0x444"), createAddress("0x7777"), 3000]);

const iface: utils.Interface = new utils.Interface(UNISWAP_POOL_ABI);

describe("", () => {
  //variables
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;
  let mockProvider: MockEthersProvider;

  //beforeAll
  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    handleTransaction = provideHandleTransaction(
      mockSwapEventAbi,
      mockFoctoryAddress,
      mockInitHashCode,
      mockProvider as unknown as providers.JsonRpcProvider,
      mockCache
    );
    mockProvider.call.mockClear();
  });

  /* beforeEach (() => {
        mockTxEvent = new TestTransactionEvent();
        mockProvider = new MockEthersProvider();
    });*/
  //it
  it("returns empty findings if there are no swap events.", async () => {
    mockTxEvent = new TestTransactionEvent();

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if there is a valid swap event.", async () => {
    //add an invalid swap :))
    mockTxEvent = new TestTransactionEvent()
      .setBlock(10)
      .addEventLog(SWAP_EVENT, mockValidUniswapPool1.address, [
        mockSwapArgs.sender,
        mockSwapArgs.recipient,
        mockSwapArgs.amount0,
        mockSwapArgs.amount1,
        mockSwapArgs.sqrtPriceX96,
        mockSwapArgs.liquidity,
        mockSwapArgs.tick,
      ])
      .addEventLog(SWAP_EVENT, mockInvalidUniswapPool.address, [
        mockSwapArgs.sender,
        mockSwapArgs.recipient,
        mockSwapArgs.amount0,
        mockSwapArgs.amount1,
        mockSwapArgs.sqrtPriceX96,
        mockSwapArgs.liquidity,
        mockSwapArgs.tick,
      ]);

    //move this up cuz constant (function with mockpooldata & blocknum?
    //try both mocking everything and using real data // I can create this in a function here
    mockProvider.addCallTo(mockValidUniswapPool1.address, 10, iface, "token0", {
      inputs: [],
      outputs: [mockValidUniswapPool1.token0],
    });
    mockProvider.addCallTo(mockValidUniswapPool1.address, 10, iface, "token1", {
      inputs: [],
      outputs: [mockValidUniswapPool1.token1],
    });
    mockProvider.addCallTo(mockValidUniswapPool1.address, 10, iface, "fee", {
      inputs: [],
      outputs: [mockValidUniswapPool1.fee],
    });

    //invalid swap call
    mockProvider.addCallTo(mockInvalidUniswapPool.address, 10, iface, "token0", {
      inputs: [],
      outputs: [mockInvalidUniswapPool.token0],
    });
    mockProvider.addCallTo(mockInvalidUniswapPool.address, 10, iface, "token1", {
      inputs: [],
      outputs: [mockInvalidUniswapPool.token1],
    });
    mockProvider.addCallTo(mockInvalidUniswapPool.address, 10, iface, "fee", {
      inputs: [],
      outputs: [mockInvalidUniswapPool.fee],
    });

    const findings = await handleTransaction(mockTxEvent);
    console.log(mockCache.get(mockInvalidUniswapPool.address))
    expect(mockProvider.call).toHaveBeenCalledTimes(6);
    expect(findings).toStrictEqual([createFinding(mockValidUniswapPool1.address, mockSwapArgs)]);
  });

  it("returns empty findings if there are no valid swap events.", async () => {
    //this test fails because this one is in cache already
    //make invalid swap event 2 :))
    mockTxEvent = new TestTransactionEvent()
      .setBlock(20)
      /*.addEventLog(SWAP_EVENT, mockInvalidUniswapPool.address, [
        mockSwapArgs.sender,
        mockSwapArgs.recipient,
        mockSwapArgs.amount0,
        mockSwapArgs.amount1,
        mockSwapArgs.sqrtPriceX96,
        mockSwapArgs.liquidity,
        mockSwapArgs.tick,
      ])*/
      .addEventLog(SWAP_EVENT, mockInvalidUniswapPool2.address, [
        mockSwapArgs.sender,
        mockSwapArgs.recipient,
        mockSwapArgs.amount0,
        mockSwapArgs.amount1,
        mockSwapArgs.sqrtPriceX96,
        mockSwapArgs.liquidity,
        mockSwapArgs.tick,
      ]);

    //invalid swap call1
    /*mockProvider.addCallTo(mockInvalidUniswapPool.address, 20, iface, "token0", {
        inputs: [],
        outputs: [mockInvalidUniswapPool.token0],
      });
      mockProvider.addCallTo(mockInvalidUniswapPool.address, 20, iface, "token1", {
        inputs: [],
        outputs: [mockInvalidUniswapPool.token1],
      });
      mockProvider.addCallTo(mockInvalidUniswapPool.address, 20, iface, "fee", {
        inputs: [],
        outputs: [mockInvalidUniswapPool.fee],
      });*/

    //invalid swap call2
    mockProvider.addCallTo(mockInvalidUniswapPool2.address, 20, iface, "token0", {
      inputs: [],
      outputs: [mockInvalidUniswapPool2.token0],
    });
    mockProvider.addCallTo(mockInvalidUniswapPool2.address, 20, iface, "token1", {
      inputs: [],
      outputs: [mockInvalidUniswapPool2.token1],
    });
    mockProvider.addCallTo(mockInvalidUniswapPool2.address, 20, iface, "fee", {
      inputs: [],
      outputs: [mockInvalidUniswapPool2.fee],
    });

    const findings = await handleTransaction(mockTxEvent);
    //add expect cache to have ~~
    console.log(mockCache.get(mockValidUniswapPool1.address))
    console.log(mockCache.get(mockInvalidUniswapPool.address))
    console.log(mockCache.get(mockInvalidUniswapPool2.address))
    //expect(mockCache.get(mockInvalidUniswapPool.address)).toEqual(true)
    expect(mockProvider.call).toHaveBeenCalledTimes(3); //pool1 is already in cache
    expect(findings).toStrictEqual([]);
  });

  it("returns multiple findings if there are multiple swap events.", async () => {
    //include unvalid events
    mockTxEvent = new TestTransactionEvent()
    ;

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });
});
