// -------------------------- TRADING ALGORITHMS -------------------------- 
    //
    // Important observations: 
    // - Values that are passed to the oracle cannot be private
    // - Values that are used as for loop parameters also cannot be private, because the number of times that the loop executes reveals the value
    //
    // The parameters that are private to the bot operator are annotated zkay-style. The operator carries out the operations regarding these
    // parameters off-chain and presents a proof to the chain instead of recording the actual computation and the private values
    //
    //
    // Below are some variables:
    // Price at the moment of invoking the bot
    uint currentPrice = oracle.getPrice(block.timestamp);
    // EMA strategy values that are used in future calculations and therefore need to be stored
    uint shortEma = 0;
    uint longEma = 0;

    // --------------------------- THE MAIN TRADING FUNCTION --------------------------- 
    /// Trading

    // Called by the admin to make trading decisions. 
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
        amountInPoolAfterTrading = me.balance;
    }

    // --------------------------- TRADING ALGORITHM 1 --------------------------- 
    // This is a crossover trading strategy. Buy when (short ema > long ema) and sell when (short ema < long ema).
    //
    // Public parameters
    // @param shortEmaPeriods number of periods for the shorter EMA (cannot be private because it is used as a for loop parameter, which reveals its value anyway) 
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
        uint previousShortEma = shortEma;
        uint previousLongEma = longEma;
        shortEma = ema(shortEmaPeriods, periodLength, shortEma);
        longEma = ema(longEmaPeriods, periodLength, longEma);
        if (shortEma / previousShortEma * 100 < noiseLevel) {
            // Hold
        } else if (shortEma - longEma > upTrendThreshold && previousShortEma - previousLongEma <= upTrendThreshold){
            // Buy
        } else if (longEma - shortEma < downTrendThreshold && previousLongEma - previousShortEma >= downTrendThreshold) {
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