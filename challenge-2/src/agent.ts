import { Finding, HandleTransaction, TransactionEvent, getEthersProvider, ethers } from "forta-agent";
import { UNISWAP_FACTORY, SWAP_EVENT, UNISWAP_POOL_ABI, POOL_INIT_CODE_HASH } from "./constants";
import { createFinding } from "./findings";
import { verifyPoolAddress, cache } from "./utils";
import { LRUCache } from "lru-cache";

// Ethers provider
const ethersProvider = getEthersProvider();

export function provideHandleTransaction(
  swapEventAbi: string,
  uniswapPoolAbi: string | string[],
  factoryAddress: string,
  initHashCode: string,
  provider: ethers.providers.JsonRpcProvider,
  cache: LRUCache<string, boolean>
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    // filter for swap events
    const swaps = txEvent.filterLog(swapEventAbi);

    if (!swaps.length) return findings;

    for (const swap of swaps) {
      //Verify is swap is valid (from UniswapV3)
      let isValid: boolean;

      try {
        isValid = await verifyPoolAddress(
          uniswapPoolAbi,
          swap.address,
          factoryAddress,
          initHashCode,
          txEvent.block.number,
          provider,
          cache
        );
      } catch (error) {
        return findings;
      }

      if (!isValid) return findings;

      findings.push(createFinding(swap.address, swap.args));
    }

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(
    SWAP_EVENT,
    UNISWAP_POOL_ABI,
    UNISWAP_FACTORY,
    POOL_INIT_CODE_HASH,
    ethersProvider,
    cache
  ),
};
