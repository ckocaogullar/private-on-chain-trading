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
    // Administrator of the trading bot
    using SafeMath for uint256;

    address admin;

    // Uncomment these values for the Mainnet forking
    // ------------------------------------------------------------------------
    // address buyVerifierAddress = 0x9D918F441B5c099CEFDf7CA6cfaBb478ce030fB1;
    // address sellVerifierAddress = 0xd612d11d4396aC06efF39600C294A10E6D8305A5;

    // ISwapRouter public constant uniswapRouter =
    //     ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    // IQuoter public constant quoter =
    //     IQuoter(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6);
    // ------------------------------------------------------------------------


    // Uncomment these values for Ropsten network
    // ------------------------------------------------------------------------
    address buyVerifierAddress = 0xb300f7880C5290257CC5B0DD47029d4B48BF3cF7;
    address sellVerifierAddress = 0xf6238aBF309c6651e1658149d13c5EDBE7d42040;
    
    ISwapRouter public constant uniswapRouter =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    IQuoter public constant quoter =
        IQuoter(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6);
    // ------------------------------------------------------------------------

    address public immutable uniswapV3Factory;
    address public immutable token0;
    address public immutable token1;
    uint24 public immutable defaultFee;

    // Public parameters: To be stored on-chain every time they are calculated in the bollinger() function
    uint256 currentPrice;
    uint256 upperBollingerBand;
    uint256 lowerBollingerBand;

    address[] pendingSubscribers;

    address[] confirmedSubscribers;

    address poolAddress;

    enum SubscriptionStatus {
        PENDING,
        APPROVED
    }

    event UserSubscribed(address subscriberAddress);
    event SubscriptionConfirmed(address userAddress);
    event TestEvent(uint256 input1, uint256 input2, uint256 input3);
    event ProofVerified(bool verified);
    event BollingerIndicators(
        uint256 upperBollingerBand,
        uint256 lowerBollingerBand,
        uint256 currentPrice
    );

    struct Subscriber {
        uint256 amount;
        SubscriptionStatus subscriptionStatus;
    }

    mapping(address => Subscriber) subscribers;

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
        admin = msg.sender;
    }

    // ------------------------------- SUBSCRIPTION -------------------------------

    // @notice Request subscription to the bot with an amount of investment. This function does not transfer any investment to the admin
    // @param _investmentAmount This is the amount of money the user promises to send the admin
    function requestSubscription() external {
        // Make sure that the one calling this function is a user, not the admin
        require(msg.sender != admin, "Admin cannot subscribe to the bot");
        // Add the caller to the subscribers list, with status pending confirmation
        subscribers[msg.sender].subscriptionStatus = SubscriptionStatus.PENDING;
        emit UserSubscribed(msg.sender);
    }

    // @notice Called by the admin once a user sends money
    // Checks if the user has sent the amount of money it has promised to send. If she has, subscribes them to the bot.
    // Otherwise, the admin can pay back the amount using an external method
    function subscribeUser(address user) external {
        // Make sure that the one calling this function is the admin
        require(msg.sender == admin, "Only the admin can confirm subscription");
        // Check if the user has actually invested the money she hes promised to invest
        subscribers[user].subscriptionStatus = SubscriptionStatus.APPROVED;
        emit SubscriptionConfirmed(user);
    }

    // ------------------------------- TRADING -------------------------------

    // --------------------------- THE MAIN TRADING FUNCTION ---------------------------
    /// Trading

    // Called by the admin to make trading decisions.
    // Calls the functions for separate trading algorithms
    // Public parameters:
    // @param a the first parameter of the proof
    // @param b the second parameter of the proof
    // @param c the third parameter of the proof
    // @param inputs of the proof
    // @param buySellFlag indicates buy or sell signal. 0 indicates BUY, 1 indicates SELL, 2 indicates HOLD
    function trade(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory inputs,
        uint16 buySellFlag
    ) public {
        // Make sure that the one who is calling the algorithm is the admin of the bot
        require(msg.sender == admin, "Only the admin can invoke trading");

        // Check if the prover used the correct public parameter - 1
        require(inputs[0] == currentPrice);

        // Make sure that the public inputs that the contract has "inputs"

        if (buySellFlag == 0) { // BUY
            // Check if the prover used the correct public parameter - 2
            require(inputs[1] == lowerBollingerBand);

            if (IVerifier(buyVerifierAddress).verifyTx(a, b, c, inputs)) {
                emit ProofVerified(true);

            } else {
                emit ProofVerified(false);

            }
        } else if (buySellFlag == 1) { // SELL
            // Check if the prover used the correct public parameter - 2
            require(inputs[1] == upperBollingerBand);

            if (IVerifier(sellVerifierAddress).verifyTx(a, b, c, inputs)) {
                emit ProofVerified(true);

            } else {
                emit ProofVerified(false);
                
            }
        } // else HOLD
    }

    function calculateIndicators(uint32 numOfPeriods, uint32 periodLength)
        public
    {
        bollinger(numOfPeriods, periodLength);   
    }

    // --------------------------- TRADING ALGORITHM: BOLLINGER ---------------------------
    // @notif Buy if (price < lower Bolliger band), sell if (price > upper Bolliger band) within certain thresholds
    //
    // Private parameters:
    // @private_param bollingerUpperBoundPct percentage the current price should be near the upper Bollinger band to trigger a sell signal
    // @private_param bollingerLowerBoundPct percentage the current price should be near the lower Bollinger band to trigger a buy signal

    // Related Formulas:
    // -----------------
    // Upper Bollinger Band=MA(TP,n) + m * σ[TP,n]
    // Lower Bollinger Band=MA(TP,n) − m * σ[TP,n]
    //      where:
    //      MA=Moving average
    //      TP (typical price)=(High+Low+Close)÷3
    //      n=Number of days in smoothing period (typically 20)
    //      m=Number of standard deviations (typically 2)
    //      σ[TP,n]=Standard Deviation over last n periods of TP
    function bollinger(uint32 numOfPeriods, uint32 periodLength)
        public
    {
        require(
            admin == msg.sender,
            "Only the admin can invoke the trading algorithm"
        );
        
        if (poolAddress == address(0x0)) {
            poolAddress = PoolAddress.computeAddress(
                uniswapV3Factory,
                PoolAddress.getPoolKey(token0, token1, defaultFee)
            );
        }
        
        
        (uint256 movingAverage, uint256[] memory pastPrices) = sma(
            numOfPeriods,
            periodLength
        );
        
        uint256 stdDev = standardDev(pastPrices, movingAverage);
        
        upperBollingerBand = movingAverage + 2 * stdDev;
        lowerBollingerBand = movingAverage - 2 * stdDev;
        currentPrice = pastPrices[0];

        // For debugging in Hardhat Network
        // --------------------------------
        // console.log('movingAverage ', movingAverage);
        // console.log('stdDev ', stdDev);
        // console.log('upperBollingerBand', upperBollingerBand);
        // console.log('lowerBollingerBand', lowerBollingerBand);
        
        // Emit the two indicators used for the Bollinger trading algorithm as well as
        // the current price (at the moment of observing prices within the sma function)
        emit BollingerIndicators(
            upperBollingerBand,
            lowerBollingerBand,
            pastPrices[0]
        );

        // The conditions that will be checked off-chain to make buy/sell decision
        // -----------------------------------------------------------------------
        // if (currentPrice > (upperBollingerBand / 100) * (100 - bollingerUpperBoundPct)) {
        //     // Sell
        // } else if (currentPrice < (lowerBollingerBand / 100) * (100 + bollingerLowerBoundPct)) {
        //     // Buy
        // }
        // else: Hold
        
    }

    function getCurrentPrice() public returns (uint256 currentPrice) {
        if (poolAddress == address(0x0)) {
            poolAddress = PoolAddress.computeAddress(
                uniswapV3Factory,
                PoolAddress.getPoolKey(token0, token1, defaultFee)
            );
        }
        int256 twapTick = OracleLibrary.consult(poolAddress, 800);
        
        currentPrice = OracleLibrary.getQuoteAtTick(
            int24(twapTick), // can assume safe being result from consult()
            1,
            token0,
            token1
        );
    }

    // ------------------------------------- Helper functions ------------------------------------- 

    /// @notice Given a time period to look back into and the number of data points, calculates the
    /// Simple Moving Average (SMA) for token1 in terms of token0
    /// @return sma SMA, i.e. average of a number of past prices
    function sma(uint32 numOfPeriods, uint32 periodLength)
        public
        returns (uint256 sma, uint256[] memory priceAtTick)
    {
        // Calculate the time intervals to look behind untilSecondsAgo with numIntervals
        // Put this information into secondAgos for feeding into pool observation later
        uint32[] memory secondAgos = new uint32[](numOfPeriods + 1);
        for (uint32 i = 0; i < numOfPeriods; i++) {
            secondAgos[i] = SafeMath32.mul(periodLength, numOfPeriods - i);
        }

        // Get the Uniswap Pool for token0, token1, and defaultFee values
        IUniswapV3Pool pool = IUniswapV3Pool(poolAddress);
        (int56[] memory tickCumulatives, ) = pool.observe(secondAgos);

        // Calculate the Simple Moving Average by adding prices (TWAPs) for the time intervals and dividing
        // that by the number of intervals
        sma = 0;

        // Get prices at each tick
        priceAtTick = new uint256[](tickCumulatives.length - 1);
        for (uint32 i = 0; i < tickCumulatives.length - 1; i++) {
            int56 tickCumulativesDelta = tickCumulatives[
                tickCumulatives.length - 1 - i
            ] - tickCumulatives[tickCumulatives.length - 2 - i];
            int24 timeWeightedAverageTick = int24(
                tickCumulativesDelta / periodLength
            );
            // Always round to negative infinity (taken from Uniswap OracleLibrary's consult())
            if (
                tickCumulativesDelta < 0 &&
                (tickCumulativesDelta % periodLength != 0)
            ) timeWeightedAverageTick--;

            // Calculate the amount of token1 received in exchange for token0
            priceAtTick[i] = OracleLibrary.getQuoteAtTick(
                timeWeightedAverageTick,
                1,
                token1,
                token0
            );

            // Add the learned price to SMA
            sma = SafeMath.add(sma, priceAtTick[i]);

            console.log('priceAtTick[',i,'] = ', priceAtTick[i]);
        }
        // Divide SMA with the number of intervals
        sma = sma.div(tickCumulatives.length - 1);
    }

    // Standard deviation of the prices in numOfPeriods periods of periodLength length. Also takes mean as this value is precomputed in the
    // bollinger function and used in several other places
    function standardDev(uint256[] memory pastPrices, uint256 mean)
        public
        returns (uint256 stdDev)
    {
        uint256 sumOfSquaredDev = 0;
        for (uint256 i = 0; i < pastPrices.length; i++) {
            sumOfSquaredDev += (pastPrices[i] - mean) * (pastPrices[i] - mean);
        }
        console.log('sqrt(sumOfSquaredDev / pastPrices.length) ', sqrt(sumOfSquaredDev / pastPrices.length));
        stdDev = sqrt(sumOfSquaredDev / pastPrices.length);
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

}

interface IVerifier {
    function verifyTx(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) external view returns (bool r);
}
