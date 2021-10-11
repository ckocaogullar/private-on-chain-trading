require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ganache");

//const ROPSTEN_PRIVATE_KEY1 = "a0869b1386566d0a7b325787216eeee27ac8527a02e84d6e70baea2ceaf2ee57"
const ROPSTEN_PRIVATE_KEY2 = "bc6d600f6bf2a5ad83377dd8743e5fe30b14064ea8e082f3a83ee704cca0cfc0"
//const ROPSTEN_PRIVATE_KEY3 = "9a134daeadcf1c1b45b60fd2194e72cd1f372374a424d43586a1c0ad6db9c7ca"

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("ethToAsset", "Converts ETH to asset value", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.7.6"
      },
      {
        version: "0.6.1"
      },
    ]
  },
  networks: {
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/fBCbSZh46WyftFgzBU-a8_tIgCCxEL22`,
      accounts: [`0x${ROPSTEN_PRIVATE_KEY2}`],
    },
    hardhat: {
      chainId: 1337,
      forking: {
        enabled: true,
        url: "https://eth-mainnet.alchemyapi.io/v2/cBtFGu5T0_EUoamP_xYBrzOfLdNR0_2x",
      },
    },
  }
  
};

