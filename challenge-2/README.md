# UniswapV3 Swaps Detector

## Description

This bot detects UniswapV3 Swap events.

## Supported Chains

- Ethereum
- Polygon
- Optimism
- Arbitrum

## Alerts

- UniswapV3-Swap
  - Fired when a transaction contains a UniswapV3 swap event.
  - Severity is always set to "info".
  - Type is always set to "info".
  - Metadata contains :
    - `poolAddress`: the address of the deployed UniswapV3 pool smart contract.
    - `sender` : swap sender.
    - `recipient` : swap reciver.
    - `amount0` : the amount of token0 swapped.
    - `amount1` : the amount of token1 recieved.
    - `liquidity`: pool's liquidity after the swap.

## Test Data

The bot behaviour can be verified with the following transactions:

- [0xc1d9d14dfc866ec0c8d40cb8249b0886bdf3ccec57c500d2b67b839f974884a8](https://etherscan.io/tx/0xc1d9d14dfc866ec0c8d40cb8249b0886bdf3ccec57c500d2b67b839f974884a8) (Ethereum)
- [0x58da2995b04299a4a463be3091c4ab791bd9a1d978805bc0f750c220e9208528](https://polygonscan.com/tx/0x58da2995b04299a4a463be3091c4ab791bd9a1d978805bc0f750c220e9208528) (Polygon)
- [0xd69dfa0fd4bdc01e6d6708bb7bf5f9d46f69a9699a1bb2f3cc62c6b7d39fa701](https://optimistic.etherscan.io/tx/0xd69dfa0fd4bdc01e6d6708bb7bf5f9d46f69a9699a1bb2f3cc62c6b7d39fa701) (Optimism)
- [0x99caee24bf15628705332eaec4b6037b1aa2c55f28271a54355b00bb9b12c7af](https://arbiscan.io/tx/0x99caee24bf15628705332eaec4b6037b1aa2c55f28271a54355b00bb9b12c7af) (Arbitrum)
