import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType, getEthersProvider, ethers, keccak256 } from "forta-agent";
import { UNISWAP_FACTORY, SWAP_EVENT } from "./constants";
const IUniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");
import { getCreate2Address } from "@ethersproject/address"
import { POOL_INIT_CODE_HASH } from "@uniswap/v3-sdk";
import { createFinding } from "./findings";


const ethersProvider = getEthersProvider();

const verifyPoolAddress = async (address:string, provider: ethers.providers.JsonRpcProvider): Promise<boolean> => {
  const poolContract = new ethers.Contract(address,IUniswapV3Pool.abi,provider)
  const parameters = [ 
    await poolContract.token0(),
    await poolContract.token1(),
    await poolContract.fee()
  ]
  const abiCoder = new ethers.utils.AbiCoder(); 
  const salt = ethers.utils.solidityKeccak256(["bytes"],[abiCoder.encode(["address","address","uint24"],parameters)])
  const from = UNISWAP_FACTORY;
  const initHashCode = POOL_INIT_CODE_HASH;

  const computedAddress = getCreate2Address(from,salt,initHashCode)
  console.log(computedAddress)
  
  return computedAddress.toLowerCase() === address.toLowerCase();
}


export function provideHandleTransaction(swap_event: string, provider: ethers.providers.JsonRpcProvider): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    // filter for swap events
    const swaps = txEvent.filterLog(swap_event);
    
    if (!swaps.length) return findings;

    for (const swap of swaps) {
      //Verify is swap is valid (from UniswapV3)
      let isValid : boolean; 
      try {
        isValid = await verifyPoolAddress(swap["address"],provider);
      } catch (error) {
        return findings;
      }

      if (!isValid) return findings;
      findings.push(createFinding(swap));
    }

    return findings;
  };
}



export default {
  handleTransaction: provideHandleTransaction(SWAP_EVENT, ethersProvider),
};
