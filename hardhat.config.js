require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-contract-sizer');
require("hardhat-gas-reporter");


const { API_URL, PRIVATE_KEY, API_KEY } = process.env;

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }},
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }},
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }},
      {
        version: "0.5.1",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }},
      ]
  },
  etherscan: {
    apiKey: API_KEY,
  },
  customChains: [
    {
      network: "optimistic-goerli",
      chainId: 420,
      urls: {
        apiURL: "https://opt-goerli.g.alchemy.com/v2/KwajuzZGGjgNFbcQYc6I83pSLZf7gz-G",
        browserURL: "https://goerli-optimism.etherscan.io/"
      }
    }
  ],
  networks: {
    rinkeby: {
      url: API_URL,
      accounts: [PRIVATE_KEY],
    },
    "optimism": {
      url: "https://mainnet.optimism.io",
      accounts: [process.env.PRIVATE_KEY],
    },
    "optimistic-goerli": {
      url: "https://opt-goerli.g.alchemy.com/v2/KwajuzZGGjgNFbcQYc6I83pSLZf7gz-G",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: "" // create an account at https://coinmarketcap.com/api/ to get an API key
  },
  contractSizer: {
    runOnCompile: true
  },
  mocha: {
    timeout: 1000000,
  }
};