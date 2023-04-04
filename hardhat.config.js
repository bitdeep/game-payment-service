require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");
dotenv.config()
require("@nomiclabs/hardhat-etherscan");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    bsc: {
      url: `https://rpc.ankr.com/bsc/${process.env.ANKR}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },
    avax: {
      url: `https://rpc.ankr.com/avalanche/${process.env.ANKR}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },
    polygon: {
      url: `https://rpc.ankr.com/polygon/${process.env.ANKR}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },
    ftm: {
      url: `https://rpc.ankr.com/fantom/${process.env.ANKR}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },
    eth: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },
    arb: {
      url: `https://arb1.arbitrum.io/rpc`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },




    bsc_testnet: {
      url: `https://bsc-testnet.public.blastapi.io`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },
    avax_testnet: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },
    polygon_testnet: {
      url: `https://rpc.ankr.com/polygon_mumbai`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },
    ftm_testnet: {
      url: `https://rpc.ankr.com/fantom_testnet`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },
    eth_testnet: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      live: true,
      saveDeployments: true,
    },
    hardhat: {
      blockGasLimit: 12_450_000,
      hardfork: "london"
    },
    localhost: {
      url: 'http://localhost:8545',
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.18',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        },
      }
    ],
  },
  etherscan: {
    apiKey: { // npx hardhat verify --list-networks
      goerli: `${process.env.ETHERSCAN}`,
      mainnet: `${process.env.ETHERSCAN}`,
      canto_testnet: `test`,
      bsc: `${process.env.BSCSCAN}`,
      bscTestnet: `${process.env.BSCSCAN}`,
      avalanche: `${process.env.SNOWTRACE}`,
      avalancheFujiTestnet: `${process.env.SNOWTRACE}`,
      polygon: `${process.env.POLYGONSCAN}`,
      polygonMumbai: `${process.env.POLYGONSCAN}`,
      ftmTestnet: `${process.env.FTMSCAN}`,
      opera: `${process.env.FTMSCAN}`,
      arbitrumOne: `${process.env.ARBSCAN}`,
    },
    customChains: [
      {
        network: "canto_testnet",
        chainId: 740,
        urls: {
          apiURL: "https://evm.explorer.canto-testnet.com/api",
          browserURL: "https://eth.plexnode.wtf/"
        }
      }
    ]
  }
};
