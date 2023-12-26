import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

//for a specific pool
const swap_event : string =
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)";
const created_pool_event =
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)";
const uniswap_router = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD"; //ethereum (Universal router ?)
const swapv3_router : string = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; //ethereum / Polygone
const pools = "";

function provideHandleTransaction(
  swap_event: string,
  swapv3_router : string
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    //if (txEvent.to != swapv3_router) return findings;
    console.log("here 1");
    const swaps =  txEvent.filterLog(swap_event ,swapv3_router.toLocaleLowerCase());
    console.log("here 2");
    if (!swaps.length) return findings;
    console.log("here 3");
    swaps.forEach((swap) => {
      //console.log(swap.args.toString());
      findings.push(
        Finding.fromObject({
          name: "Nethermind Swaps Detector",
          description: `New swap :`,
          alertId: "Swap",
          protocol: "uniswapv3",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {},
        })
      );
    });
      

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(swap_event, swapv3_router),
};
