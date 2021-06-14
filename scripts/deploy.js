// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const config = {
    uniswapV3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
    weth: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    defaultFee: '3000',
  }

async function main() {
  const BaseBot = await hre.ethers.getContractFactory("BaseBot");
  const baseBot = await BaseBot.deploy(config.uniswapV3Factory, config.weth, config.defaultFee);

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
