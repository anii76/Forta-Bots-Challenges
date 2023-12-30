//shik shak shoc
//tests
// a pool address : 0xA8e0eD3D29b92433e21348eB8e2290F71E312Cdf, 0x6baD0f9a89Ca403bb91d253D385CeC1A2b6eca97

//pool creation tx ethereum : 0xa9a4a1e6ea00da915738cd0fa4c55ac75cb9ed98bbd153a890b4a964d044b343
//pool creation tx polygon : 0xb4ed0b756a9e271aef72e5ac00d2ea023ba767a2e6f8383ffddd1f967bbedef9
//pool address : 0x85Efec4ee18a06CE1685abF93e434751C3cb9bA9
// it works, but the issue is , i don't have access to the fee from the swap event :3

// we use caching if we know the address pool so no need to verify it again !

//test against a pool created using uniswapv2 & see
//--------------------------[Tests]
//UniswapV2 events
//no swap events
//1 swap event
//multiple swap events (from diffirent pools & fihum li mn other pools)

//------------------
//test on other chains other than polygonscan

import { HandleTransaction, ethers } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { createFinding } from "./findings";

//mock variables
const mockFoctoryAddress = createAddress("0x1");
//const mockProvider =
const mockValidSwap = ""; //DATA berk
const mockUnvalidSwap = ""; //DATA berk

//problems mocking provider & cache :33
