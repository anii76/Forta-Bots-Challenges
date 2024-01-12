import { Interface } from "@ethersproject/abi";
import { BigNumber, Contract, providers } from "ethers";
import { Alert, AlertQueryOptions, AlertsResponse, Finding, GetAlerts } from "forta-agent";
import { CHAIN_IDS } from "./constants";
import * as fs from "fs";

export const getEscrowBalances = async (
  iface: Interface,
  provider: providers.Provider,
  blockNumber: number,
  l1DaiAddress: string,
  escrowArbitrumAddress: string,
  escrowOptimismAddress: string
): Promise<any> => {
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
): Promise<any> => {
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

//store alerts locally
export const storeAlerts = async (findings: Finding[], botId: string) => {
  let alerts: any[] = [];
  findings.forEach((finding) => {
    let alert: any = Object.assign({}, finding);
    alert["botId"] = botId;
    alerts.push(alert);
  });

  //write to json file (can be improved)
  //currently writing only last alert.
  fs.writeFileSync("alerts.json", JSON.stringify(alerts), "utf-8");
  //fs.appendFile("alerts.json", JSON.stringify(alerts), () => {});
};

//custom getAlerts
export const getAlerts: GetAlerts = async (query: AlertQueryOptions): Promise<AlertsResponse> => {
  let results: any[] = [];

  //get alerts from json file
  try {
    const jsonContent = fs.readFileSync("alerts.json", "utf-8");

    const alerts: any[] = JSON.parse(jsonContent);
    results = alerts.filter((alert) => {
      return query.botIds?.includes(alert.botId) && alert.alertId == query.alertId;
    });

    //last alert by timestamp
    results =
      query.first == 1
        ? [results.reduce((max, current) => (current.timestamp > max.timestamp ? current : max), results[0])]
        : results;
  } catch (error) {}

  return {
    alerts: results as Alert[],
    pageInfo: {
      hasNextPage: false,
    },
  };
};
