import { Addresses } from "./utils";

export const BOT_ID = "0xdb5f76edad8195236876f0ddf13c2e6b3ac807e5b2b6a9d8b7795a8c0fa59f22";
export const BALANCE_ABI = "function balanceOf(address account) external view returns (uint256)";
export const TOTAL_SUPPLY_ABI = "function totalSupply() external view returns (uint256)";

export const ADDRESSES: Addresses = {
  l1Dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  l2Dai: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  escrowArbitrum: "0xA10c7CE4b876998858b1a9E12b10092229539400",
  escrowOptimism: "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
};

export const CHAIN_IDS = {
  Ethereum: 1,
  Optimism: 10,
  Arbitrum: 42161,
};
