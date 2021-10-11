// Change the CONTRACT_ADDRESS and ABI appropriately, as described in the README

export const CONTRACT_ADDRESS = '0x74e5F8781269D8204FC47e42f3e5c531C64c6Cc4'

export const ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
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
    "name": "SubscriptionConfirmed",
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
    "inputs": [],
    "name": "requestSubscription",
    "outputs": [],
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
  }
]