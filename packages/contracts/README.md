# Ensemble Framework Smart Contracts

Contracts for the Ensemble onchain economy framework. The contracts are written in Solidity language.

## Instructions

the following command will deploy all the contracts to the specified network.

```bash
npx hardhat ignition deploy ignition/modules/TaskRegistry.ts --network $YOUR_NETWORK
```

## Deployments

Contracts are deployed to the following networks, we support Solana via NeonEVM.

### v3 - Base Sepolia (current)

```txt
AGENT_REGISTRY_ADDRESS=0xe8BdeA37d56430Fbc36511BDa7595D2DEbF0b71c
TASK_REGISTRY_ADDRESS=0xA3009bD5b5A772F4abf0A2FbF151F2ff81213794
SERVICE_REGISTRY_ADDRESS=0x376a79A7D4436e48Eed06c50B644048554642f80
```

### v2 - Base Sepolia (deprecated)

```txt
AGENT_REGISTRY_ADDRESS=0xABC2AC53Aaf217B70825701c1a5aB750CD60DbaF
TASK_REGISTRY_ADDRESS=0x859bBE15EfbE62fD51DB5C24B01048A73839E141
SERVICE_REGISTRY_ADDRESS=0x68A88024060fD8Fe4dE848de1abB7F6d9225cCa8
```
