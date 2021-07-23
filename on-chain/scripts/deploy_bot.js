// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const config = {
    uniswapV3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
    token0: '0xc778417e063141139fce010982780140aa0cd5ab', // WETH
    token1: '0x0D9C8723B343A8368BebE0B5E89273fF8D712e3C', // USDC
    defaultFee: '3000',
    untilSecondsAgo: '21600',
    numIntervals: '6',
    minTimeLimit: '6'
  }

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const BaseBot = await hre.ethers.getContractFactory("BaseBot");
  const baseBot = await BaseBot.deploy(config.uniswapV3Factory, config.token0, config.token1, config.defaultFee);

  await baseBot.deployed();

  console.log("BaseBot deployed to:", baseBot.address);
}

// Hardhat-recommended pattern
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
