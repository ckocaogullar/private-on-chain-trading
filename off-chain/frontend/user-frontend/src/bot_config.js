// Change the CONTRACT_ADDRESS and ABI appropriately, as described in the README

export const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

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