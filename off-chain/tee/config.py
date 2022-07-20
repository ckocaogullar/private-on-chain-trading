# Alchemy Ropsten URL
URL = "https://eth-ropsten.alchemyapi.io/v2/fBCbSZh46WyftFgzBU-a8_tIgCCxEL22"

# Hardhat node URL
# URL = 'http://127.0.0.1:8545/'

# Bollinger variables:
UPPER_BOUND_PERCENTAGE = 90
LOWER_BOUND_PERCENTAGE = 90

BOT_CONTRACT_ADDRESS = '0x358B7D1428270063a860647DB201EcDf03E2AB64'

# Account and its private key
ACCOUNT = '0x569ECED9B05495f8D0766bd3A771F16BdC8b18C3'
ACCOUNT_KEY = 'bc6d600f6bf2a5ad83377dd8743e5fe30b14064ea8e082f3a83ee704cca0cfc0'

# Deversifi Signing Key
STARK_PRIVATE_KEY = '743a0ff439f6ed52ed1fef395d6cea58af02088c91528b07048cc5f922d3f65'
STARK_PUBLIC_KEY = '0x00894dc6ae7cb67ba4ee649d3d46afd07c60502fb3477923b1f8185fb02d3580'

# Ropsten address for the previous contract version
# BOT_CONTRACT_ADDRESS = '0x97dEF834E0fd1e6325235850ee2bA3192A5f0d77'

# Hardhat Node address regularly used for this contract
# BOT_CONTRACT_ADDRESS = '0xE05FB6Ef9451D4f459893f35241b77E689b97ccF'

BOT_ABI = [
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
        "anonymous": False,
        "inputs": [
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "upperBollingerBand",
                "type": "uint256"
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "lowerBollingerBand",
                "type": "uint256"
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "currentPrice",
                "type": "uint256"
            }
        ],
        "name": "BollingerIndicators",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": False,
                "internalType": "bool",
                "name": "verified",
                "type": "bool"
            }
        ],
        "name": "ProofVerified",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": False,
                "internalType": "uint24",
                "name": "test",
                "type": "uint24"
            }
        ],
        "name": "TestEvent",
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
        "name": "calculateIndicators",
        "outputs": [],
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
        "inputs": [],
        "name": "test",
        "outputs": [],
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
                "internalType": "uint256[4]",
                "name": "inputs",
                "type": "uint256[4]"
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