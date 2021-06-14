// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;

import "./libraries/OracleLibrary.sol";
import "./libraries/PoolAddress.sol";
import "./libraries/SafeUint128.sol";

contract BaseBot {
    address public immutable baseBotFactory;
    address public immutable weth;
    uint24 public immutable defaultFee;

    constructor(
        address _baseBotFactory,
        address _weth,
        uint24 _defaultFee
    ) {
        baseBotFactory = _baseBotFactory;
        weth = _weth;
        defaultFee = _defaultFee;
    }

    function ethToAsset(
        address _tokenOut,
        uint32 _twapPeriod,
        uint256 _amountIn
    ) public view returns (uint256 amountOut) {
        address pool =
            PoolAddress.computeAddress(
                baseBotFactory,
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
