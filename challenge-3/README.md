# MakerDAO's Bridge Invariant Checker

## Description

This bot detects when the following MakerDAO's L1/L2 bridge invariant is violated : 
```
L1Dai.balanceOf(Escrow) >= L2Dai.totalSupply()
```

## Supported Chains

- Ethereum
- Optimism
- Arbitrum

## Alerts

- L1-ESCROW-BALANCES
  - Fired when a new block is mined, to get both Optimism & Arbitrum escrow's balances.
  - Severity is always set to "info".
  - Type is always set to "info".
  - Metadata contains :
    - `balanceArbitrum`: L1 Arbitrum's escrow contract balance.
    - `balanceOptimism`: L1 Optimism's escrow contract balance. 

- MAKERDAO-INVARIANT-VIOLATED
  - Fired when the `totalSupply` of L2Dai contract exceeds escrow's balance on L1.
  - Severity is always set to "high".
  - Type is always set to "suspicious".
  - Metadata contains :
    - `network`: L2 network (Arbitrum or Optimism)  
    - `l2DaiSupply`: totalSupply of L2 Dai token contract.
    - `escrowBalance`: the escrow's balance of the associated network on L1. 

## Test Data

The bot behaviour can be verified when deployed on the following networks:

- Ethereum
- Arbitrum
- Optimism
