pragma solidity =0.7.6;

import "hardhat/console.sol";

import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./libraries/SafeUint128.sol";
import "./libraries/SafeMath32.sol";

contract BaseBot {
    using SafeMath for uint256;
    address public immutable uniswapV3Factory;
    address public immutable token0;
    address public immutable token1;
    uint24 public immutable defaultFee;

    constructor(
        address _uniswapV3Factory,
        address _token0,
        address _token1,
        uint24 _defaultFee
    ) {
        uniswapV3Factory = _uniswapV3Factory;
        token0 = _token0;
        token1 = _token1;
        defaultFee = _defaultFee;
    }

    function calculateSma(uint32 _untilSecondsAgo, uint32 _numIntervals)
        public
        view
        returns (uint256 sma)
    {
        uint32 period = SafeMath32.div(_untilSecondsAgo, _numIntervals);
        uint32[] memory secondAgos = new uint32[](_numIntervals + 1);
        for (uint32 i = 0; i < _numIntervals + 1; i++) {
            secondAgos[i] = SafeMath32.sub(
                _untilSecondsAgo,
                SafeMath32.mul(period, i)
            );
        }
        address pool =
            PoolAddress.computeAddress(
                uniswapV3Factory,
                PoolAddress.getPoolKey(token0, token1, defaultFee)
            );
        (int56[] memory tickCumulatives, ) =
            IUniswapV3Pool(pool).observe(secondAgos);
        sma = 0;
        uint256[] memory priceAtTick =
            new uint256[](tickCumulatives.length - 1);
        for (uint32 i = 0; i < tickCumulatives.length - 1; i++) {
            int56 tickCumulativesDelta =
                tickCumulatives[tickCumulatives.length - 1 - i] -
                    tickCumulatives[tickCumulatives.length - 2 - i];
            int24 timeWeightedAverageTick =
                int24(tickCumulativesDelta / period);
            if (
                tickCumulativesDelta < 0 && (tickCumulativesDelta % period != 0)
            ) timeWeightedAverageTick--;
            priceAtTick[i] = OracleLibrary.getQuoteAtTick(
                timeWeightedAverageTick, // can assume safe being result from observe()
                1,
                token0,
                token1
            );
            sma = sma.add(priceAtTick[i]);
        }
        sma = sma.div(tickCumulatives.length - 1);
    }

}
