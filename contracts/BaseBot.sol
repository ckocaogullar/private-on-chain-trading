pragma solidity =0.7.6;

import "hardhat/console.sol";

import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol";
import "./libraries/SafeUint128.sol";

contract BaseBot {
    address public immutable uniswapV3Factory;
    address public immutable weth;
    uint24 public immutable defaultFee;

    constructor(
        address _uniswapV3Factory,
        address _weth,
        uint24 _defaultFee
    ) {
        uniswapV3Factory = _uniswapV3Factory;
        weth = _weth;
        defaultFee = _defaultFee;
    }

    function greet() public view returns (address) {
        return weth;
    }

    function ethToAsset(
        address _tokenOut,
        uint32 _twapPeriod,
        uint256 _amountIn
    ) public view returns (uint256 amountOut) {
        address pool =
            PoolAddress.computeAddress(
                uniswapV3Factory,
                PoolAddress.getPoolKey(weth, _tokenOut, defaultFee)
            );
        // Leave twapTick as a int256 to avoid solidity casting
        int256 twapTick = OracleLibrary.consult(pool, _twapPeriod);
        return
            OracleLibrary.getQuoteAtTick(
                int24(twapTick), // can assume safe being result from consult()
                SafeUint128.toUint128(_amountIn),
                weth,
                _tokenOut
            );
    }
}
