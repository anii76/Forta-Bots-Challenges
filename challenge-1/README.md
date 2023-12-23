# Nethermind Bots Deployment Detector

## Description

This bot detects Bots deployed by Nethermind.

## Supported Chains

- Polygon

## Alerts

Describe each of the type of alerts fired by this agent

- Nethermind-Bot-Created
  - Fired when a transaction contains a new bot deployment event (createAgent).
  - Severity is always set to "info" 
  - Type is always set to "info" 
  - metadata : {createdBy, agentId, metadata, chainsId}

- Nethermind-Bot-Updated
  - Fired when a transaction contains a bot update event (updateAgent).
  - Severity is always set to "info" 
  - Type is always set to "info" 
  - metadata : {agentId, metadata, chainsId}

## Test Data

The bot behaviour can be verified with the following transactions:

- [0xdb05c84a97050d75d18bf23d67bd366af38f65e6a439082d4c7f69b0d7f316bc](https://polygonscan.com/tx/0xdb05c84a97050d75d18bf23d67bd366af38f65e6a439082d4c7f69b0d7f316bc) (create Agent)
- [0xfab4288676622983fdb8747486eac06a24d562947b230d7f24882bfea5ae133e](https://polygonscan.com/tx/0xfab4288676622983fdb8747486eac06a24d562947b230d7f24882bfea5ae133e) (update Agent)
