import { Interface } from "@ethersproject/abi";
import { BigNumber, Contract, providers } from "ethers";
import { Alert, AlertQueryOptions, AlertsResponse, Finding, GetAlerts } from "forta-agent";
import { DAI_L1_ADDRESS, DAI_L2_ADDRESS, ESCROW_ARBITRUM_ADDRESS, ESCROW_OPTIMISM_ADDRESS } from "./constants";
import * as fs from "fs";
import { createInvariantFinding } from "./findings";

export const verifyInvariant = async (
  chainId: number,
  alert: Alert,
  iface: Interface,
  provider: providers.Provider,
  blockNumber: number
) => {
  //chainId is diffirent?
  const escrowBalance = chainId == 42161 ? alert.metadata.balanceArbitrum : alert.metadata.balanceOptimism;

  const daiContract = new Contract(DAI_L2_ADDRESS, iface, provider);
  const l2DaiSupply = await daiContract.totalSupply({ blockTag: blockNumber });

  //verify if invariant is violated
  if (l2DaiSupply > escrowBalance) createInvariantFinding({l2DaiSupply: l2DaiSupply, network: chainId});
};

export const getEscrowBalances = async (
  iface: Interface,
  provider: providers.Provider,
  blockNumber: number
): Promise<any> => {
  const daiContract = new Contract(DAI_L1_ADDRESS, iface, provider);

  const escrowBalance1: BigNumber = await daiContract.balanceOf(ESCROW_ARBITRUM_ADDRESS, { blockTag: blockNumber });
  const escrowBalance2: BigNumber = await daiContract.balanceOf(ESCROW_OPTIMISM_ADDRESS, { blockTag: blockNumber });

  return { balanceArbitrum: escrowBalance1, balanceOptimism: escrowBalance2 };
};

//store alerts locally
export const storeAlerts = async (findings: Finding[], botId: string) => {
  let alerts: any[] = [];
  findings.forEach((finding) => {
    let alert: any = finding;
    alert["botId"] = botId;
    alerts.push(alert);
  });

  //write to json file
  fs.writeFileSync("alerts.json", JSON.stringify(alerts), "utf-8");
};

//custom getAlerts
export const getAlerts: GetAlerts = async (query: AlertQueryOptions): Promise<AlertsResponse> => {
  let results: any[] = [];

  //get alerts from json file
  try {
    const jsonContent = fs.readFileSync("alerts.json", "utf-8");

    const alerts: any[] = JSON.parse(jsonContent);
    results = alerts.filter((alert) => {
      alert.botId == query.botIds && alert.alertId == query.alertId;
    });

    //last alert ?
    results =
      query.first == 1
        ? results.reduce((max, current) => (current.timestamp > max.timestamp ? current : max), results[0])
        : results;
  } catch (error) {}

  return {
    alerts: results as Alert[],
    pageInfo: {
      hasNextPage: false,
    },
  };
};
