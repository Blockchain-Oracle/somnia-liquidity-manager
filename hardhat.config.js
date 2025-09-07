require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Your private key for deployment
const PRIVATE_KEY = "dfe9a1d1c29b40417ee15201f33240236c1750f4ce60fe32ba809a673ab24f99";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
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
    somniaTestnet: {
      url: "https://dream-rpc.somnia.network",
      chainId: 50312,
      accounts: [PRIVATE_KEY],
      gasPrice: 20000000000, // 20 gwei
    },
    somniaMainnet: {
      url: "https://rpc.somnia.network",
      chainId: 50311,
      accounts: [PRIVATE_KEY],
      gasPrice: 20000000000, // 20 gwei
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};