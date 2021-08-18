// Change the CONTRACT_ADDRESS and ABI appropriately, as described in the README

export const BUY_VERIFIER_CONTRACT_ADDRESS = '0xbc12D817Ed67b3e0C11F87E4b9241DC45dE9ed34'
export const SELL_VERIFIER_CONTRACT_ADDRESS = '0x47c6017175d201fa7cb93574a9F7B23e2355F548'

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
      },
      {
        "internalType": "uint256[2]",
        "name": "alpha",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "beta",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "gamma",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "delta",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2][4]",
        "name": "gamma_abc",
        "type": "uint256[2][4]"
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