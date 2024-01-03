import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (poolAddress: string, args: any): Finding => {
  const { sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick } = args;
  return Finding.fromObject({
    name: "UniswapV3 Swaps Detector",
    description: "New swap detected",
    alertId: "UniswapV3-Swap",
    protocol: "UniswapV3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      poolAddress: poolAddress,
      amount0: amount0.toString(),
      amount1: amount1.toString(),
      sender: sender,
      recipient: recipient,
      liquidity: liquidity,
    },
  });
};
