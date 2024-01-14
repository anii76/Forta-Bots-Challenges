import { Interface } from "@ethersproject/abi";
import { BigNumber, Contract, providers } from "ethers";
import { Alert, AlertQueryOptions, AlertsResponse, Finding, GetAlerts } from "forta-agent";
import { CHAIN_IDS } from "./constants";

export type Addresses = {
  l1Dai: string;
  l2Dai: string;
  escrowArbitrum: string;
  escrowOptimism: string;
};

export type Balances = {
  balanceArbitrum: BigNumber;
  balanceOptimism: BigNumber;
};

export type InvariantData = {
  isViolated: boolean;
  escrowBalance: BigNumber;
  l2DaiSupply: BigNumber;
};

export const getEscrowBalances = async (
  iface: Interface,
  provider: providers.Provider,
  blockNumber: number,
  l1DaiAddress: string,
  escrowArbitrumAddress: string,
  escrowOptimismAddress: string
): Promise<Balances> => {
  const daiContract = new Contract(l1DaiAddress, iface, provider);

  const balanceArbitrum: BigNumber = await daiContract.balanceOf(escrowArbitrumAddress, { blockTag: blockNumber });
  const balanceOptimism: BigNumber = await daiContract.balanceOf(escrowOptimismAddress, { blockTag: blockNumber });

  return { balanceArbitrum: balanceArbitrum, balanceOptimism: balanceOptimism };
};

export const verifyInvariant = async (
  l2DaiAddress: string,
  chainId: number,
  alert: Alert,
  iface: Interface,
  provider: providers.Provider,
  blockNumber: number
): Promise<InvariantData> => {
  const escrowBalance: BigNumber =
    chainId == CHAIN_IDS.Arbitrum ? alert.metadata.balanceArbitrum : alert.metadata.balanceOptimism;
  const daiContract = new Contract(l2DaiAddress, iface, provider);
  const l2DaiSupply: BigNumber = await daiContract.totalSupply({ blockTag: blockNumber });

  //returns if invariant is violated or not
  return {
    isViolated: l2DaiSupply.gt(escrowBalance),
    escrowBalance: escrowBalance,
    l2DaiSupply: l2DaiSupply,
  };
};
