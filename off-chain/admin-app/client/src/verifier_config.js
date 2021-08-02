// Change the CONTRACT_ADDRESS and ABI appropriately, as described in the README

export const BUY_VERIFIER_CONTRACT_ADDRESS = '0xb300f7880C5290257CC5B0DD47029d4B48BF3cF7'
export const SELL_VERIFIER_CONTRACT_ADDRESS = '0xf6238aBF309c6651e1658149d13c5EDBE7d42040'

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