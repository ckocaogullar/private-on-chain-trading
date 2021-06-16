// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const config = {
    uniswapV3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
    token0: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    token1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    defaultFee: '3000',
    untilSecondsAgo: '21600',
    numIntervals: '6',
  }

async function main() {
  const BaseBot = await hre.ethers.getContractFactory("BaseBot");
  const baseBot = await BaseBot.deploy(config.uniswapV3Factory, config.token0, config.token1, config.defaultFee, config.untilSecondsAgo, config.numIntervals);

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
