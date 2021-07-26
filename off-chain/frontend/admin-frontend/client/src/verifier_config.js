// Change the CONTRACT_ADDRESS and ABI appropriately, as described in t

export const VERIFIER_CONTRACT_ADDRESS = '0x445A7DC5a6fcBae2789450d3254897bDb224E812'

export const VERIFIER_ABI = [
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
      "internalType": "uint256[2]",
      "name": "input",
      "type": "uint256[2]"
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