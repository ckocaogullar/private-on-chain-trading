pragma solidity =0.7.6;
pragma abicoder v2;

import "hardhat/console.sol";

import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./libraries/SafeUint128.sol";
import "./libraries/SafeMath32.sol";

contract BaseBot {
    using SafeMath for uint256;

    ISwapRouter public constant uniswapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    IQuoter public constant quoter =
        IQuoter(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6);

    address public immutable uniswapV3Factory;
    address public immutable token0;
    address public immutable token1;
    uint24 public immutable defaultFee;
    uint32 public immutable untilSecondsAgo;
    uint32 public immutable numIntervals;

    struct Subscriber {
        uint256 amount;
        uint256 balanceToken0;
        uint256 balanceToken1;
    }

    mapping(address => Subscriber) subscribers;

    constructor(
        address _uniswapV3Factory,
        address _token0,
        address _token1,
        uint24 _defaultFee,
        uint32 _untilSecondsAgo,
        uint32 _numIntervals
    ) {
        uniswapV3Factory = _uniswapV3Factory;
        token0 = _token0;
        token1 = _token1;
        defaultFee = _defaultFee;
        untilSecondsAgo = _untilSecondsAgo;
        numIntervals = _numIntervals;
    }

    function subscribe(uint256 amount) external payable {
        subscribers[msg.sender].amount = amount;
        subscribers[msg.sender].balanceToken0 = 1000;
        subscribers[msg.sender].balanceToken1 = 1000;
    }

    function trade() public {
        uint256 sma = calculateSma();

        address poolAddress =
            PoolAddress.computeAddress(
                uniswapV3Factory,
                PoolAddress.getPoolKey(token0, token1, defaultFee)
            );

        int256 twapTick =
            OracleLibrary.consult(poolAddress, untilSecondsAgo / numIntervals);
        uint256 currentPrice =
            OracleLibrary.getQuoteAtTick(
                int24(twapTick), // can assume safe being result from consult()
                1,
                token0,
                token1
            );
        console.log("Current price is %", currentPrice);
        console.log("SMA is %", sma);
        if (sma > currentPrice) {
            swap(token0, token1, subscribers[msg.sender].amount);
        } else if (sma < currentPrice) {
            swap(token1, token0, subscribers[msg.sender].amount);
        }
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amount
    ) public {
        require(
            ((tokenIn == token0 && tokenOut == token1) ||
                (tokenIn == token1 && tokenOut == token0)),
            "Input tokens are wrong."
        );
        if (tokenIn == token0 && tokenOut == token1) {
            subscribers[msg.sender].balanceToken0 -= amount;
            subscribers[msg.sender].balanceToken1 += amount;
        } else {
            subscribers[msg.sender].balanceToken1 -= amount;
            subscribers[msg.sender].balanceToken0 += amount;
        }
    }

    /// @notice Given a time period to look back into and the number of data points, calculates the
    /// Simple Moving Average (SMA) for token1 in terms of token0
    /// @return sma SMA, i.e. average of a number of past prices
    function calculateSma() public returns (uint256 sma) {
        // Calculate the time intervals to look behind untilSecondsAgo with numIntervals
        // Put this information into secondAgos for feeding into pool observation later
        uint32 period = SafeMath32.div(untilSecondsAgo, numIntervals);
        uint32[] memory secondAgos = new uint32[](numIntervals + 1);
        for (uint32 i = 0; i < numIntervals + 1; i++) {
            secondAgos[i] = SafeMath32.sub(
                untilSecondsAgo,
                SafeMath32.mul(period, i)
            );
        }

        // Get the Uniswap Pool for token0, token1, and defaultFee values
        IUniswapV3Pool pool =
            IUniswapV3Pool(
                PoolAddress.computeAddress(
                    uniswapV3Factory,
                    PoolAddress.getPoolKey(token0, token1, defaultFee)
                )
            );
        (int56[] memory tickCumulatives, ) = pool.observe(secondAgos);

        // Calculate the Simple Moving Average by adding prices (TWAPs) for the time intervals and dividing
        // that by the number of intervals
        sma = 0;

        // Get prices at each tick
        uint256[] memory priceAtTick =
            new uint256[](tickCumulatives.length - 1);
        for (uint32 i = 0; i < tickCumulatives.length - 1; i++) {
            int56 tickCumulativesDelta =
                tickCumulatives[tickCumulatives.length - 1 - i] -
                    tickCumulatives[tickCumulatives.length - 2 - i];
            int24 timeWeightedAverageTick =
                int24(tickCumulativesDelta / period);
            // Always round to negative infinity (taken from Uniswap OracleLibrary's consult())
            if (
                tickCumulativesDelta < 0 && (tickCumulativesDelta % period != 0)
            ) timeWeightedAverageTick--;

            // Calculate the amount of token1 received in exchange for token0
            priceAtTick[i] = OracleLibrary.getQuoteAtTick(
                timeWeightedAverageTick, // can assume safe being result from observe()
                1,
                token0,
                token1
            );

            // Add the learned price to SMA
            sma = sma.add(priceAtTick[i]);
        }
        // Divide SMA with the number of intervals
        sma = sma.div(tickCumulatives.length - 1);
    }
}
