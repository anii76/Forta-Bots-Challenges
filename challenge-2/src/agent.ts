import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType, getEthersProvider, ethers, keccak256 } from "forta-agent";
import { UNISWAP_FACTORY, SWAP_EVENT } from "./constants";
const IUniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");
import { getCreate2Address } from "@ethersproject/address"
import { POOL_INIT_CODE_HASH } from "@uniswap/v3-sdk";


const ethersProvider = getEthersProvider();
//function compare addresses 
//-> fetches the contract and computes the create2 address  
//fetches the address from lru-cache with the other parameters (we need blocknum for that)
const verifyPoolAddress = async (address:string, provider: ethers.providers.JsonRpcProvider): Promise<boolean> => {
  const poolContract = new ethers.Contract(address,IUniswapV3Pool.abi,provider)
  const parameters = [ //exception here
    await poolContract.token0(),
    await poolContract.token1(),
    await poolContract.fee()
  ]
  const abiCoder = new ethers.utils.AbiCoder(); 
  //const salt = keccak256(abiCoder.encode(["address","address","uint24"],parameters))
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
      //const result = await verifyPoolAddress(swap["address"],provider);

      //return finding
      const {sender, recipient, amount0, amount1, sqrtPricex96, liquidity, tick} = swap.args
      if (!isValid) return findings;
      findings.push(
        Finding.fromObject({
          name: "Nethermind Swaps Detector",
          description: `New swap :`,
          alertId: "Swap",
          protocol: "uniswapv3",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            poolAddress : swap["address"],
            from : txEvent.from, //who initiated the swap (not intrested ?),
            amount0: amount0,
            amount1: amount1,
            sender: sender,
            recipient: recipient //UniswapV3Router 
          },
        })
      );
    }
    return findings;
  };
}



export default {
  handleTransaction: provideHandleTransaction(SWAP_EVENT, ethersProvider),
};
