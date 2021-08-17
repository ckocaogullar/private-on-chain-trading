// Change the CONTRACT_ADDRESS and ABI appropriately, as described in the README

export const BUY_VERIFIER_CONTRACT_ADDRESS = '0x9541d33122d7eB58E80d4c950Fe926A2c317DE3f'
export const SELL_VERIFIER_CONTRACT_ADDRESS = '0x22392Ab77687f3F3A231a76afbb2c9e472CbFf1d'

// Hardhat Node address regularly used for this contract
// export const BUY_VERIFIER_CONTRACT_ADDRESS = '0x9D918F441B5c099CEFDf7CA6cfaBb478ce030fB1'
// export const SELL_VERIFIER_CONTRACT_ADDRESS = '0xd612d11d4396aC06efF39600C294A10E6D8305A5'

export const BUY_VERIFIER_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256[2]",
        "name": "a",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "b",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2]",
        "name": "c",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[3]",
        "name": "input",
        "type": "uint256[3]"
      }
    ],
    "name": "verifyTx",
    "outputs": [
      {
        "internalType": "bool",
        "name": "r",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

export const SELL_VERIFIER_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "verified",
        "type": "bool"
      }
    ],
    "name": "Verified",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[2]",
        "name": "a",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "b",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2]",
        "name": "c",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[3]",
        "name": "input",
        "type": "uint256[3]"
      }
    ],
    "name": "verifyTx",
    "outputs": [
      {
        "internalType": "bool",
        "name": "r",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]