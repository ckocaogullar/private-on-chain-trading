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
    address admin;

    // Maps a user's address to the amount she promises to invest in the algorithm, keeping the investment amount private to the admin
    mapping(address => uint32) investmentAmount;
    // Maps a user's address to the amount she receives as the result of trading, keeping the share private to the corresponding user
    mapping(address => uint32) userShare;

    // zkay v1 does not support arrays. As I could not confirm yet that zkay v2 supports them,
    // I could not stop myself from being safe and representing lists with mapping(uint => address)s and counters.
    address[] pendingSubscribers;

    address[] confirmedSubscribers;

    enum SubscriptionStatus {
        PENDING,
        APPROVED
    }

    event UserSubscribed(address subscriberAddress);
    event SubscriptionConfirmed(address userAddress);

    struct Subscriber {
        uint256 amount;
        SubscriptionStatus subscriptionStatus;
    }

    mapping(address => Subscriber) subscribers;

    constructor() {
        admin = msg.sender;
    }

    // @notice Request subscription to the bot with an amount of investment. This function does not transfer any investment to the admin
    // @param _investmentAmount This is the amount of money the user promises to send the admin
    function requestSubscription() external {
        // Make sure that the one calling this function is a user, not the admin
        require(msg.sender != admin);
        // Add the caller to the subscribers list, with status pending confirmation
        subscribers[msg.sender].subscriptionStatus = SubscriptionStatus.PENDING;
        emit UserSubscribed(msg.sender);
    }

    // @notice Called by the admin once a user sends money
    // Checks if the user has sent the amount of money it has promised to send. If she has, subscribes them to the bot.
    // Otherwise, the admin can pay back the amount using an external method
    function subscribeUser(address user) external {
        // Make sure that the one calling this function is the admin
        require(msg.sender == admin);
        // Check if the user has actually invested the money she hes promised to invest
        subscribers[user].subscriptionStatus = SubscriptionStatus.APPROVED;
        emit SubscriptionConfirmed(user);
    }
}
