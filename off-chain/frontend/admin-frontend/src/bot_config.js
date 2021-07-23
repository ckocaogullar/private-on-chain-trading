// Change the CONTRACT_ADDRESS and ABI appropriately, as described in the README

export const BOT_CONTRACT_ADDRESS = '0x01fc97df27A8FD8706E9482B35CAA9De70D0499a'

export const BOT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_uniswapV3Factory",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_token0",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_token1",
        "type": "address"
      },
      {
        "internalType": "uint24",
        "name": "_defaultFee",
        "type": "uint24"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      }
    ],
    "name": "SubscriptionConfirmed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "testNum",
        "type": "uint256"
      }
    ],
    "name": "TestEvent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "subscriberAddress",
        "type": "address"
      }
    ],
    "name": "UserSubscribed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "numOfPeriods",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "periodLength",
        "type": "uint32"
      }
    ],
    "name": "bollinger",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "pastPrices",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "movingAverage",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "stdDev",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "defaultFee",
    "outputs": [
      {
        "internalType": "uint24",
        "name": "",
        "type": "uint24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "currentPrice",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "quoter",
    "outputs": [
      {
        "internalType": "contract IQuoter",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestSubscription",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "numOfPeriods",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "periodLength",
        "type": "uint32"
      }
    ],
    "name": "sma",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "sma",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "priceAtTick",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "pastPrices",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "mean",
        "type": "uint256"
      }
    ],
    "name": "standardDev",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "stdDev",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "subscribeUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenIn",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "swap",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "test",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "val",
        "type": "uint32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token0",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token1",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "numOfPeriods",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "periodLength",
        "type": "uint32"
      }
    ],
    "name": "trade",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "uniswapRouter",
    "outputs": [
      {
        "internalType": "contract ISwapRouter",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "uniswapV3Factory",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]