require("@nomiclabs/hardhat-waffle");

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
    ]
  },
  networks: {
    hardhat: {
      chainId: 1337,
      forking: {
        enabled: true,
        url: "https://eth-mainnet.alchemyapi.io/v2/cBtFGu5T0_EUoamP_xYBrzOfLdNR0_2x",
      },
    },
  }
  
};
