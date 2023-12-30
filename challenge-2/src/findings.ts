import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

export const createFinding = (event: LogDescription): Finding => {
    const { sender, recipient, amount0, amount1, sqrtPricex96, liquidity, tick } = event.args
    return Finding.fromObject({
        name: "Nethermind Swaps Detector",
        description: `New swap :`,
        alertId: "Swap",
        protocol: "uniswapv3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
            poolAddress: event["address"],
            amount0: amount0,
            amount1: amount1,
            sender: sender, //UniswapV3Router 
            recipient: recipient
        },
    })

}