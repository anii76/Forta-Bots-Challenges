# Uniswap Swaps Detector

## Description

This agent detects transactions with large Tether transfers

## Supported Chains

- Ethereum
- Mainnet, Polygon, Optimism, Arbitrum

## Alerts

Describe each of the type of alerts fired by this agent

- FORTA-1
  - Fired when a transaction contains a Tether transfer over 10,000 USDT
  - Severity is always set to "low" (mention any conditions where it could be something else)
  - Type is always set to "info" (mention any conditions where it could be something else)
  - Mention any other type of metadata fields included with this alert

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x3a0f757030beec55c22cbc545dd8a844cbbb2e6019461769e1bc3f3a95d10826 (15,000 USDT)

on polygon (contains swap)
- 0x58da2995b04299a4a463be3091c4ab791bd9a1d978805bc0f750c220e9208528