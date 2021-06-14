
const BaseBot = artifacts.require("BaseBot");

const config = {
  uniswapV3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
  weth: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  defaultFee: '3000',
}

module.exports = function(deployer) {
  deployer.deploy(BaseBot, config.uniswapV3Factory, config.weth, config.defaultFee);
};

