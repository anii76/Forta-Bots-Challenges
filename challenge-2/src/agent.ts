import { Finding, HandleTransaction, TransactionEvent, getEthersProvider, ethers } from "forta-agent";
import { UNISWAP_FACTORY, SWAP_EVENT } from "./constants";
const IUniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");
import { getCreate2Address } from "@ethersproject/address";
import { POOL_INIT_CODE_HASH } from "@uniswap/v3-sdk";
import { createFinding } from "./findings";
import { LRUCache } from "lru-cache";

// Cache for PoolContract
const options = { max: 1000 };
const cache: LRUCache<string, boolean> = new LRUCache(options);

const ethersProvider = getEthersProvider();

//fetches the address from lru-cache with the other parameters (we need blocknum for that)
const verifyPoolAddress = async (
  address: string,
  provider: ethers.providers.JsonRpcProvider,
  cache: LRUCache<string, boolean>
): Promise<boolean> => {
  if (cache.has(address)) return cache.get(address) as boolean;

  const poolContract = new ethers.Contract(address, IUniswapV3Pool.abi, provider);
  const parameters = [await poolContract.token0(), await poolContract.token1(), await poolContract.fee()];
  const abiCoder = new ethers.utils.AbiCoder();
  const encodedParams = abiCoder.encode(["address", "address", "uint24"], parameters);
  const salt = ethers.utils.solidityKeccak256(["bytes"], [encodedParams]);
  const from = UNISWAP_FACTORY;
  const initHashCode = POOL_INIT_CODE_HASH;

  const computedAddress = getCreate2Address(from, salt, initHashCode);
  console.log(computedAddress);

  return computedAddress.toLowerCase() === address.toLowerCase();
}

export function provideHandleTransaction(
  swap_event: string,
  provider: ethers.providers.JsonRpcProvider,
  cache: LRUCache<string, boolean>
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    // filter for swap events
    const swaps = txEvent.filterLog(swap_event);

    if (!swaps.length) return findings;

    for (const swap of swaps) {
      //Verify is swap is valid (from UniswapV3)
      let isValid: boolean;

      try {
        isValid = await verifyPoolAddress(swap["address"], provider, cache);
      } catch (error) {
        return findings;
      }

      //update cache
      cache.set(swap["address"], isValid);

      if (!isValid) return findings;

      findings.push(createFinding(swap));
    }

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(SWAP_EVENT, ethersProvider, cache),
};
