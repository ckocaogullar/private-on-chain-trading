/// @title Pseudocode of an On-Chain Trading Bot Written with zkay Language
/// @author Ceren Kocaoğullar

/// This pseudocode bot aims to do the following:
// * Users can subscribe to the bot
// * The bot has an administrator which collects investments in an investment pool, trades and 
//   distributes the resulting money among the subscribed users proportionate to the amounts they have invested
// * This pseudocode assumes that the trading occurs only once and does not go into the details of a periodic approach
// 
/// Limitations of zkay to consider: 
// 1. zkay v2 does not support imports
// 2. zkay v2 does not support private money transactions. 
// 3. zkay v1 does not support some types such as struct, array, float.
//    No information is provided about these types in zkay v2 report or documentation, so I am not sure yet if they are available
//    I have written this pseudocode assuming these types are not supported
//
// Important implications of these limitations are:
// 1. Since zkay does not support imports or private transactions, if we want to make the amount invested by the users private, 
//    we should handle transactions separately with a privacy-preserving protocol, e.g. ZCash
// 2. Also because zkay does not support imports, we cannot directly access oracle prices or do trading on exchanges through this contract.
//    We should use an additional contract, maybe calling this one, or the admin should handle these off-chain. 
//    We should consider this limitation carefully and look at our options in a way that does not put too much trust into admin 
//    and ensures the correctness of the price information, amount of total traded money, gains, and losses.
// 
// What is private?
// * Parameters of the trading algorithms are private
// * The admin can privately choose which trading algorithm to use
// * The amounts invested by the users and the amounts they receive as a result of the trades are private
//
// What are the benefits other than these privacy benefits?
// * Trades are handled by a single admin. Gas costs paid from the investment pool and the profit is distributed from there
// * Users can check if they have received the amount of money they were meant to receive

contract TradingBot {
    // Administrator of the trading bot
    address admin;
    
    // Maps a user's address to the amount she promises to invest in the algorithm, keeping the investment amount private to the admin
    mapping(address => uint@admin) investmentAmount;
    // Maps a user's address to the amount she receives as the result of trading, keeping the share private to the corresponding user
    mapping(address!x => uint@x) userShare;

    // zkay v1 does not support arrays. As I could not confirm yet that zkay v2 supports them, 
    // I could not stop myself from being safe and representing lists with mapping(uint => address)s and counters.
    mapping(uint => address) pendingSubscribers;
    uint pendingSubscriberCount;
    
    mapping(uint => address@admin) confirmedSubscribers;
    uint confirmedSubscriberCount;

    // Total money invested to the algorithm by the subscribed users, public to everyone
    uint totalInvestment;
    // Total money in the investment pool after the algorithm does trading, public to everyone
    uint amountInPoolAfterTrading;

    // This value is private to the admin and can be used as a flag by the admin to determine if it will use a trading algorithm or not.
    // Admin can set the value of this parameter to a secret value that is out of the boundaries of the values that the parameters can take.
    // When the admin is calling the trade function, it can provide the values of the parameters that belong to the 
    // trading algorithms not to be used
    // as this determined value. The trade function can check if the value of a parameter is equal to this determined value and
    // execute trading algorithms accordingly.
    uint@admin algorithmUseFlag;

    constructor(uint@me _algorithmUseFlag){
        admin = me;
        algorithmUseFlag = _algorithmUseFlag;
        pendingSubscriberCount = 0;
        confirmedSubscriberCount = 0;
    }

    /// Subscribing to the bot:
    // As money cannot be transfered within this contract due to zkay's limitations, the following method protects the amount of money 
    // invested by the user:
    // 1. User requests subscription, promising to send an amount of money
    // 2. The user sends the money she would like to invest to the admin's account, i.e. investment pool, 
    // using a privacy-preserving way like ZCash
    // 3. After receiving money from an account, the admin subscribes the user owning this account if the user has provided 
    // the money it has promised to provide

    // @notice Request subscription to the bot with an amount of investment. This function does not transfer any investment to the admin
    // @param _investmentAmount This is the amount of money the user promises to send the admin
    function requestSubscription(uint _investmentAmount@me){
        // Add yourself to the pending subscribers list
        pendingSubscribers[pendingSubscriberCount] = me
        // Write the amount you promise to invest privately to the chain so that only the admin can read it
        investmentAmount[me] = reveal(_investmentAmount, admin);
        // Increase the counter for pending subscribers 
        pendingSubscriberCount += 1;
    }

    // @notice Called by the admin once a user sends money
    // Checks if the user has sent the amount of money it has promised to send. If she has, subscribes them to the bot. 
    // Otherwise, the admin can pay back the amount using an external method
    function subscribeUser(address user, uint amountInvested) returns (bool subscribed){
        // Make sure that the one calling this function is the admin
        require(me == admin);
        // Check if the user has actually invested the money she hes promised to invest
        if (investmentAmount[user] == amountInvested){
            // If she has, add the user to the confirmedSubscribers list
            confirmedSubscribers[confirmedSubscriberCount] = user;
            // Add the newly invested money to the total investment amount
            totalInvestment += amountInvested;
            // Increase the counter for confirmed subscribers 
            confirmedSubscriberCount += 1;
            subscribed = true
        } else {
            subscribed = false
        }
    }


    /// Trading

    // @notice Called by the admin to make trading decisions. 
    // Cannot exchange money or get oraclised inputs directly, due to the reasons explanied above
    // Represented in an abstract fashion, taking a single parameter and having a single dummy trading algorithm
    // Can be extended to multiple algorithms which can take multiple parameters and can be switched on and off using the parameter values
    // @param parameter Parameter provided by the admin, private to the admin.
    function trade(uint@admin parameter, uint currentPrice){
        // Dummy trading algorithm
        if (parameter1 == algorithmUseFlag) {
            // If the value of a parameter is set to a specific value equal to algorithmUseFlag, do not execute this trading algorithm
            // Signal hold
        } else if (currentPrice > parameter) {
            // Signal sell
        } else if (currentPrice < oracle.currentPrice()) {
            // Signal buy
        } else {
            // The trading algorithm tells that holding the money is the best now
            // Signal hold
        }

        // Update the value of the amount of the money in the pool after trading. Of course, this should happen after 
        // the trades are executed externally
        amountInPoolAfterTrading = me.balance
    }

    // -------------------------- TRADING ALGORITHMS -------------------------- 
    //
    // Important observations: 
    // - Values that are passed to the oracle cannot be private
    // - Values that are used as for loop parameters also cannot be private, because the number of times that the loop executes reveals the value
    //
    // The parameters that are private to the bot operator are annotated zkay-style. The operator carries out the operations regarding these
    // parameters off-chain and presents a proof to the chain instead of recording the actual computation and the private values
    //
    // Some variables:
    // Price at the moment of invoking the bot
    uint currentPrice = oracle.getPrice(block.timestamp)

    // EMA strategy values that are used in future calculations and therefore need to be stored
    uint shortEma = 0
    uint longEma = 0

    // --------------------------- THE MAIN TRADING FUNCTION --------------------------- 
    /// Trading

    // @notice Called by the admin to make trading decisions. 
    // Calls the functions for separate trading algorithms
    function trade(uint shortEmaPeriods, uint longEmaPeriods, uint periodLength, uint@me upTrendThreshold, uint@me downTrendThreshold, uint@me noiseLevel,
                    uint numOfPeriods, uint periodLength, uint@me bollingerUpperBoundPct, uint@me bollingerLowerBoundPct)){
        // Make sure that the one who is calling the algorithm is the admin of the bot
        require(admin == me);
        // The bot admin selects the trading algorithms secretly in the following way:
        // It calls the algorithms in all cases
        // If the first parameter passed to these functions are negative, this is an indicator that this algorithm is going to be used or not
        // This is checked in the algorithm function and the algorithm proceeds or does not proceed accordingly
        emaCrossover(shortEmaPeriods, longEmaPeriods, periodLength, upTrendThreshold, downTrendThreshold, noiseLevel);
        bollinger(numOfPeriods, periodLength, bollingerUpperBoundPct, bollingerLowerBoundPct);

        // Update the value of the amount of the money in the pool after trading. Of course, this should happen after 
        // the trades are executed externally
        amountInPoolAfterTrading = me.balance
    }

    // --------------------------- TRADING ALGORITHM 1 --------------------------- 
    // @notif This is a crossover trading strategy. Buy when (short ema > long ema) and sell when (short ema < long ema).
    //
    // Public parameters
    // @param shortEmaPeriods number of periods for the shorter EMA (cannot be private because it is used in as a for loop parameter, which reveals its value anyway) 
    // @param longEmaPeriods number of periods for the longer EMA (cannot be private because of the same reason) 
    // @param periodLength length of the periods for both EMAs (cannot be private, because it is fed into the oracle)
    // Explanation: In traditional finance, you would have, for example, a 20-day EMA. What we refer to as period length is the 'day' and EMA periods is the '20' in this example.
    //
    // Private parameters
    // @private_param upTrendThreshold threshold to trigger a buy signal
    // @private_param downTrendThreshold threshold to trigger a sell signal
    // @private_param noiseLevel do not trade when short EMA is with this % of last short EMA


    function emaCrossover(uint shortEmaPeriods, uint longEmaPeriods, uint periodLength, uint@me upTrendThreshold, uint@me downTrendThreshold, uint@me noiseLevel){
        require(admin == me);
        // If the first parameter is negative, this is an indicator that this algorithm is going to be used or not
        require(shortEmaPeriods > 0);
        uint previousShortEma = shortEma
        uint previousLongEma = longEma
        shortEma = ema(shortEmaPeriods, periodLength, shortEma)
        longEma = ema(longEmaPeriods, periodLength, longEma)
        if (shortEma / previousShortEma * 100 < noiseLevel) {
            // Hold
        } else if (shortEma - longEma > upTrendThreshold && previousShortEma - previousLongEma <= upTrendThreshold){
            // Buy
        } else if ((longEma - shortEma < downTrendThreshold && (previousLongEma - previousShortEma <= downTrendThreshold) {
            // Sell
        } else {
            // Hold
        }
    }
    

    // --------------------------- TRADING ALGORITHM 2 --------------------------- 
    // @notif Buy if (price < lower Bolliger band), sell if (price > upper Bolliger band) within certain thresholds
    //
    // Public parameters:
    // @param numOfPeriods number of periods, same as explained above
    // @param periodLength length of the periods for both EMAs, same as explained above
    //
    // Private parameters:
    // @private_param bollingerUpperBoundPct percentage the current price should be near the upper Bollinger band to trigger a sell signal
    // @private_param bollingerLowerBoundPct percentage the current price should be near the lower Bollinger band to trigger a buy signal
    function bollinger(uint numOfPeriods, uint periodLength, uint@me bollingerUpperBoundPct, uint@me bollingerLowerBoundPct){
        require(admin == me);
        // If the first parameter is negative, this is an indicator that this algorithm is going to be used or not
        require(numOfPeriods > 0);
        // Upper Bollinger Band=MA(TP,n) + m * σ[TP,n]
        // Lower Bollinger Band=MA(TP,n) − m * σ[TP,n]
        //      where:
        //      MA=Moving average
        //      TP (typical price)=(High+Low+Close)÷3
        //      n=Number of days in smoothing period (typically 20)
        //      m=Number of standard deviations (typically 2)
        //      σ[TP,n]=Standard Deviation over last n periods of TP
        movingAverage = sma(numOfPeriods, periodLength);
        stdDev = standardDev(numOfPeriods, periodLength);
        upperBollingerBand = movingAverage + 2 * stdDev;
        lowerBollingerBand = movingAverage - 2 * stdDev;
        if (currentPrice > (upperBollingerBand / 100) * (100 - bollingerUpperBoundPct)) {
          // Sell
        } else if (currentPrice < (lowerBollingerBand / 100) * (100 + bollingerLowerBoundPct)) {
          // Buy
        } else {
          // Hold
        }
    }

    // Helper functions of the trading strategies
    //
    // There are three steps to calculating an exponential moving average (EMA). 
    //        1. Calculate the simple moving average (SMA) to use it as the initial EMA value. 
    //        2. Calculate the weighting multiplier, using the formula (2 / (n + 1)) 
    //        3. Calculate the EMA using the formula {Close price today - EMA(previous day)} x multiplier + EMA(previous day)
    function ema(uint numOfPeriods, uint periodLength, uint prev_ema) returns (uint ema){
        require(admin == me);
        // If EMA hasn't been calculated before, calculate the SMA and use it as the first EMA
        if (prev_ema == 0 && multiplier == 0){
            prev_ema = sma(numOfPeriods, periodLength);
        }
        multiplier = 2 / (numOfPeriods + 1);
        ema = (currentPrice - prev_ema) * multiplier + prev_ema;
    }

    // SMA is simply the average of prices in a period of n days
    function sma(uint numOfPeriods, uint periodLength) returns (uint sma) {
        require(admin == me);
        sma = 0;
        for(uint i=0; i<numOfPeriods; i++){
            sma += oracle.getPrice(block.timestamp - i * periodLength);
        }
        return sma / numOfPeriods;
    }

    // Standard deviation of the prices in numOfPeriods periods of periodLength length. Also takes mean as this value is precomputed in the
    // bollinger function and used in several other places
    function standardDev(uint numOfPeriods, uint periodLength, uint mean) returns (uint stdDev) {
        require(admin == me);
        sumOfSquaredDev = 0;
        for (uint i=0; i<numOfPeriods; i++){
            uint price = oracle.getPrice(block.timestamp - i * periodLength);
            stdDev = sumOfSquaredDev += (price - mean) * (price - mean);
        }
        sqrt(sumOfSquaredDev / numOfPeriods);
    }

    // @notice Called by the admin, calculates the shares per user privately, proportionate to the amounts they have invested.
    // Does not distribute the funds because of zkay's inability to provide private transactions or imports.
    // The admin should send the users their shares after 
    function distributeFunds(){
        require(me == admin);
        for(uint i = 0; i < confirmedSubscriberCount; i++){
            userShare[confirmedSubscribers[i]] = (totalInvestment / investmentAmount[confirmedSubscribers[i]]) * currentAmountInPool;
        }
    }

    // Checking the fairness of the trade

    // @notice Allows the user to check if the share value computed by the bot is the amount that they have received
    // Reveals the result of this check to everyone, without revealing the received or on-chain recorded share values
    // Similar to the example in the CCS '19 zkay article, seeing this function returning many true values by multiple users,
    // users can be confident that things are going according to the plan
    // @param share The value that user has received from the trading bot
    function checkShare(uint@me share){
        require(reveal(share == userShare[me], all));
    }
    
}