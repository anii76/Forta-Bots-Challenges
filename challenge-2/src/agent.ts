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

// Ethers provider
const ethersProvider = getEthersProvider();

const verifyPoolAddress = async (
  poolAddress: string,
  factoryAddress: string,
  initHashCode: string,
  provider: ethers.providers.JsonRpcProvider,
  cache: LRUCache<string, boolean>
): Promise<boolean> => {
  if (cache.has(poolAddress)) return cache.get(poolAddress) as boolean;

  const poolContract = new ethers.Contract(poolAddress, IUniswapV3Pool.abi, provider);
  const parameters = [await poolContract.token0(), await poolContract.token1(), await poolContract.fee()];
  const abiCoder = new ethers.utils.AbiCoder();
  const encodedParams = abiCoder.encode(["address", "address", "uint24"], parameters);
  const salt = ethers.utils.solidityKeccak256(["bytes"], [encodedParams]);

  // Compute the correspondant address
  const computedAddress = getCreate2Address(factoryAddress, salt, initHashCode);
  
  // Compare the swap event address with the computed one
  const isValid = computedAddress.toLowerCase() === poolAddress.toLowerCase();

  // Update cache
  cache.set(poolAddress, isValid);

  return isValid;
};

export function provideHandleTransaction(
  swapEventAbi: string,
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
        isValid = await verifyPoolAddress(swap.address, factoryAddress, initHashCode, provider, cache);
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
  handleTransaction: provideHandleTransaction(SWAP_EVENT, UNISWAP_FACTORY, POOL_INIT_CODE_HASH, ethersProvider, cache),
};
