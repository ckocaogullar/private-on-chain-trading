const { expect } = require("chai");

const config = {
    uniswapV3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
    token0: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    token1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    defaultFee: '3000',
    untilSecondsAgo: '21600',
    numIntervals: '6',
    minTimeLimit: '6'
  }
  
// Test fails due to timeout right now...
describe("BaseBot contract", function() {
  it("Trading based on SMA scenario", async function() {
    const [owner] = await ethers.getSigners();

    const BaseBot = await ethers.getContractFactory("BaseBot");
    const baseBot = await BaseBot.deploy(config.uniswapV3Factory, config.token0, config.token1, config.defaultFee, config.untilSecondsAgo, config.numIntervals, config.minTimeLimit);

    const subs = await baseBot.subscribe(owner.address);
    const trade = await baseBot.trade();
  });

});