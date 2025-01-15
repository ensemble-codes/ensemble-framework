import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

// Explicitly disable telemetry
process.env.HARDHAT_TELEMETRY_DISABLED = "1";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
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
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    gasReporter: {
        enabled: false
    },
    mocha: {
        timeout: 40000
    },
    etherscan: {
      apiKey: process.env.BASE_ETHERSCAN_API_KEY,
      customChains: [
        {
          network: "neonevm",
          chainId: 245022926,
          urls: {
            apiURL: "https://devnet-api.neonscan.org/hardhat/verify",
            browserURL: "https://devnet.neonscan.org"
          }
        }
      ]
    },
    sourcify: {
      enabled: true
    }
};

export default config; 