import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";
import 'solidity-coverage';

dotenv.config();

// Explicitly disable telemetry
process.env.HARDHAT_TELEMETRY_DISABLED = "1";

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.20",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            },
            {
                version: "0.8.22",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        ]
    },
    networks: {
        hardhat: {
            chainId: 31337
        },
        local: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337
        },
        base: {
            url: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org",
            chainId: 8453,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        baseSepolia: {
            url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
            chainId: 84532,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        neondevnet: {
            url: "https://devnet.neonevm.org",
            accounts: [ process.env.PRIVATE_KEY! ],
            chainId: 245022926,
            allowUnlimitedContractSize: false,
            gas: "auto",
            gasPrice: "auto",
        },
        somniaTestnet: {
            url: "https://dream-rpc.somnia.network",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 50312,
            gasMultiplier: 1.2
            // allowUnlimitedContractSize: false,
            // gas: "auto",
            // gasPrice: "auto",
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 40000
    },
    etherscan: {
      apiKey: {
        base: process.env.BASESCAN_API_KEY || "",
        baseSepolia: process.env.BASESCAN_API_KEY || "",
      },
      customChains: [
        {
          network: "neonevm",
          chainId: 245022926,
          urls: {
            apiURL: "https://devnet-api.neonscan.org/hardhat/verify",
            browserURL: "https://devnet.neonscan.org"
          }
        },
        {
            network: "baseSepolia",
            chainId: 84532,
            urls: {
              apiURL: "https://api-sepolia.basescan.org/api",
              browserURL: "https://sepolia.basescan.org"
            }
          },
          {
            network: "somniaTestnet",
            chainId: 50312,
            urls: {
              apiURL: "https://dream-rpc.somnia.network",
              browserURL: "https://shannon-explorer.somnia.network/"
            }
          }
      ]
    },
    sourcify: {
      enabled: true
    }
};

export default config; 