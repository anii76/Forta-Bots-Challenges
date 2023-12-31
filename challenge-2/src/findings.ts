import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

//change args by event.args and event["address"](poolAddress)
export const createFinding = (poolAddress: string, args: any): Finding => {
  const { sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick } = args;
  return Finding.fromObject({
    name: "Nethermind Swaps Detector",
    description: `New swap :`,
    alertId: "Swap",
    protocol: "uniswapv3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      poolAddress: poolAddress,
      amount0: amount0.toString(),
      amount1: amount1.toString(),
      sender: sender,
      recipient: recipient,
      sqrtPriceX96: sqrtPriceX96.toString(),
      liquidity: liquidity.toString(),
      tick: tick,
    },
  });
};
