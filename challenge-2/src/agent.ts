import { Finding, HandleTransaction, TransactionEvent, getEthersProvider, ethers } from "forta-agent";
import { Interface } from "ethers/lib/utils";
import { UNISWAP_FACTORY, SWAP_EVENT, UNISWAP_POOL_ABI } from "./constants";
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

const IUNISWAPV3POOL = new Interface(UNISWAP_POOL_ABI);

const verifyPoolAddress = async (
  //PoolAbi must be an input as well
  poolAddress: string,
  block: number,
  factoryAddress: string,
  initHashCode: string,
  provider: ethers.providers.JsonRpcProvider,
  cache: LRUCache<string, boolean>
): Promise<boolean> => {
  //make a function to get poolData like : https://github.com/NethermindEth/Forta-Agents/blob/3c6e6f8aac447d2afb5e17e4bb0851a582c014c0/PancakeSwap-Bots/Large-LP-Deposit-Withdrawal/src/pool.fetcher.ts
  if (cache.has(poolAddress)) return cache.get(poolAddress) as boolean;

  const poolContract = new ethers.Contract(poolAddress, IUNISWAPV3POOL, provider);
  const parameters = [
    await poolContract.token0({ blockTag: block }),
    await poolContract.token1({ blockTag: block }),
    await poolContract.fee({ blockTag: block }),
  ]; //this is considered one call
  console.log(parameters);
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

export function provideHandleTransaction( //PoolAbi must be an input as well
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
      console.log(txEvent.block.number);

      try {
        isValid = await verifyPoolAddress(
          swap.address,
          txEvent.block.number,
          factoryAddress,
          initHashCode,
          provider,
          cache
        );
      } catch (error) {
        console.log(error);
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
