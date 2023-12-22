# Nethermind Bots Deployment Detector

## Description

This agent detects Bots deployed by Nethermind.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- NM-Bot-1
  - Fired when a transaction contains a new bot deployment event (createAgent).
  - Severity is always set to "info" 
  - Type is always set to "info" 

- NM-Bot-2
  - Fired when a transaction contains a bot update event (updateAgent).
  - Severity is always set to "info" 
  - Type is always set to "info" 

## Test Data

The agent behaviour can be verified with the following transactions:

- 0xdb05c84a97050d75d18bf23d67bd366af38f65e6a439082d4c7f69b0d7f316bc (create Agent)
- 0xfab4288676622983fdb8747486eac06a24d562947b230d7f24882bfea5ae133e (update Agent)
- 0xe1cc246a70bb17b725bf2bfaf05512e82d3f232b7c48fa079e07a57f06d078b1 (0 finding)
