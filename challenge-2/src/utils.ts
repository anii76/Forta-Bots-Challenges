import { AbiCoder, solidityKeccak256 } from "ethers/lib/utils";
import { getCreate2Address } from "ethers/lib/utils";
import { providers, Contract } from "ethers";
import { LRUCache } from "lru-cache";

// Cache for PoolContract
const options = { max: 1000 };
export const cache: LRUCache<string, boolean> = new LRUCache(options);

export const computePoolAddress = (factoryAddress: string, initHashCode: string, parameters: any[]) => {
  const abiCoder = new AbiCoder();
  const encodedParams = abiCoder.encode(["address", "address", "uint24"], parameters);
  const salt = solidityKeccak256(["bytes"], [encodedParams]);
  const computedAddress = getCreate2Address(factoryAddress, salt, initHashCode);
  return computedAddress.toLocaleLowerCase();
};

export const verifyPoolAddress = async (
  poolAbi: string | string[],
  poolAddress: string,
  factoryAddress: string,
  initHashCode: string,
  block: number,
  provider: providers.JsonRpcProvider,
  cache: LRUCache<string, boolean>
): Promise<boolean> => {
  if (cache.has(poolAddress)) return cache.get(poolAddress) as boolean;

  // Fetch pool data
  const poolContract = new Contract(poolAddress, poolAbi, provider);
  const parameters = await Promise.all([
    poolContract.token0({ blockTag: block }),
    poolContract.token1({ blockTag: block }),
    poolContract.fee({ blockTag: block }),
  ]);

  // Compute the correspondant address
  const computedAddress = computePoolAddress(factoryAddress, initHashCode, parameters);

  // Compare the swap event address with the computed one
  const isValid = computedAddress.toLowerCase() === poolAddress.toLowerCase();

  // Update cache
  cache.set(poolAddress, isValid);

  return isValid;
};
