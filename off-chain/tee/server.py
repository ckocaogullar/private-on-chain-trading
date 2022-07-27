# // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# // SPDX-License-Identifier: MIT-0
import argparse
import socket
# import config
from threading import Thread
import time
import sys
import hashlib
import subprocess

try:
    from zokrates_pycrypto.eddsa import PrivateKey, PublicKey
    from zokrates_pycrypto.field import FQ
except Exception as e:
    print(e)

try:
    from web3 import Web3
    from web3.gas_strategies.time_based import fast_gas_price_strategy
except Exception as e:
    print(e)

# Alchemy Goerli URL
URL = "https://eth-goerli.g.alchemy.com/v2/wBUefIW8WnzgYKNZFTchNYgZcuE7pfC2"

# Alchemy Ropsten URL
# URL = "https://eth-ropsten.alchemyapi.io/v2/fBCbSZh46WyftFgzBU-a8_tIgCCxEL22"

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

upperBoundPercentage = 100
lowerBoundPercentage = 100

performanceRunCounter = 0
performanceRunThreshold = 100

indicatorsCaught = False
tProofGenStarted = None

web3 = None
BotContract = None

witness_input = None
witness_input_complete = False

tradePrice = 100000
tradeAmount = -0.05

proof_args = {'currentPrice': None, 'upperBollingerBand': None, 'lowerBollingerBand': None, 'buySellFlag': None, 'boundPercentage': None,
              'currentPrice': None, 'upperBollingerBand': None, 'lowerBollingerBand': None, 'buySellFlag': None, 'boundPercentage': None, 'signatureArgs': None}

'''VSock methods'''
# Running server you have pass port the server  will listen to. For Example:
# $ python3 /app/server.py server 5005


class VsockListener:
    # Server
    def __init__(self, conn_backlog=128):
        self.conn_backlog = conn_backlog

    def bind(self, port):
        # Bind and listen for connections on the specified port
        self.sock = socket.socket(socket.AF_VSOCK, socket.SOCK_STREAM)
        self.sock.bind((socket.VMADDR_CID_ANY, port))
        self.sock.listen(self.conn_backlog)

    def recv_data(self):
        # Receive data from a remote endpoint
        while True:
            try:
                print("Let's accept stuff")
                (from_client, (remote_cid, remote_port)) = self.sock.accept()
                print("Connection from " + str(from_client) +
                      str(remote_cid) + str(remote_port))

                query = from_client.recv(1024).decode()
                print("Starting a single trading iteration")

                trigger_trade(10, 10)

                while True:
                    if witness_input_complete:
                        print('Sending witness input:', witness_input)
                        # Send back the response
                        from_client.send(str(witness_input).encode())
                        break

                # Get back the proof
                zkproof = from_client.recv(1024).decode()
                print("Proof received: " + zkproof)

                # Parse and store the proof
                proof_params = parse_proof(zkproof)
                print('Proof params received from the host:', proof_params)

                # Sign and send the proof to the smart contract to get it verified
                sign_and_send_tx('trade', proof_params)

                from_client.close()
                print("Client call closed")

            except Exception as ex:
                print(ex)


''' Trade decision-related smart contract methods '''
# Makes the buying or selling decision


def decide_trade(current_price, upper_bollinger_band, lower_bollinger_band):
    global witness_input
    global witness_input_complete

    print('Deciding on the trade')
    if (current_price > (upper_bollinger_band / 100) * (100 - UPPER_BOUND_PERCENTAGE)):
        print("Selling token1")
        proof_args['boundPercentage'] = upperBoundPercentage
        proof_args['buySellFlag'] = 0
        print(proof_args.keys())
        sign(proof_args['buySellFlag'])
        witness_input = ''
        for key in proof_args:
            witness_input += str(proof_args[key]) + ' '
        print('witness_input')
        print(witness_input)
        witness_input_complete = True

    elif (current_price <= (lower_bollinger_band / 100) * (100 - LOWER_BOUND_PERCENTAGE)):
        print("Buying token1")
        proof_args['boundPercentage'] = lowerBoundPercentage
        proof_args['buySellFlag'] = 1
        sign(proof_args['buySellFlag'])
        print(proof_args)
        witness_input = ''
        for key in proof_args:
            witness_input += str(proof_args[key]) + ' '
        print('witness_input')
        print(witness_input)
        witness_input_complete = True


# Keeps track of the emitted events, running a loop on a separete thread in the background and takes action based on the event
def event_log_loop(tx_hash, event_name, poll_period):
    while True:
        try:
            print('Trying to get the transaction receipt for', event_name)
            tx_receipt = web3.eth.get_transaction_receipt(tx_hash)
            print('Transaction receipt:', tx_receipt)
            if event_name == 'BollingerIndicators':
                rich_logs = BotContract.events.BollingerIndicators().processReceipt(tx_receipt)
                print('Rich logs for BollingerIndicators: ', rich_logs)
                break
            elif event_name == 'ProofVerified':
                rich_logs = BotContract.events.ProofVerified().processReceipt(tx_receipt)
                print('Rich logs for ProofVerified: ', rich_logs)
                break
        except:
            time.sleep(poll_period)
    if event_name == 'BollingerIndicators':

        proof_args['currentPrice'] = rich_logs[0]['args']['currentPrice']
        proof_args['upperBollingerBand'] = rich_logs[0]['args']['upperBollingerBand']
        proof_args['lowerBollingerBand'] = rich_logs[0]['args']['lowerBollingerBand']

        decide_trade(rich_logs[0]['args']['currentPrice'], rich_logs[0]['args']
                     ['upperBollingerBand'], rich_logs[0]['args']['lowerBollingerBand'])
    elif event_name == 'ProofVerified':
        print('Running the JS programme')
        output = subprocess.run(
            ['node', 'index.js', str(tradePrice), str(tradeAmount)], capture_output=True, cwd='app/')
        print(output)


def sign_and_send_tx(tx_name, tx_args):
    event_name = ''
    if tx_name == 'test':
        tx = BotContract.functions.test().buildTransaction(
            {'from': ACCOUNT, 'nonce': web3.eth.get_transaction_count(ACCOUNT)})
        event_name = 'TestEvent'
    elif tx_name == 'calculateIndicators':
        tx = BotContract.functions.calculateIndicators(tx_args['num_of_periods'], tx_args['period_length']).buildTransaction(
            {'from': ACCOUNT, 'nonce': web3.eth.get_transaction_count(ACCOUNT)})
        event_name = 'BollingerIndicators'
    elif tx_name == 'trade':
        print('Sending the proof to the smart contract to get it verified')
        tx = BotContract.functions.trade(tx_args['a'], tx_args['b'], tx_args['c'], tx_args['inputs']).buildTransaction(
            {'from': ACCOUNT, 'nonce': web3.eth.get_transaction_count(ACCOUNT)})
        event_name = 'ProofVerified'

    signed_txn = web3.eth.account.sign_transaction(
        tx, private_key=ACCOUNT_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
    worker = Thread(target=event_log_loop, args=(
        web3.toHex(tx_hash), event_name, 5))
    worker.start()

# Initiate the whole trading process. This is the function that should be called in the main.


def trigger_trade(num_of_periods, period_length):
    price = BotContract.functions.getCurrentPrice().call(
        {'from': ACCOUNT})
    print('Current price is', price)

    initial_balance = web3.eth.getBalance(ACCOUNT)
    print('Initial balance is', web3.fromWei(
        initial_balance, "ether"), 'ether')

    sign_and_send_tx('calculateIndicators', {
                     'num_of_periods': num_of_periods, 'period_length': period_length})
    return witness_input


def parse_proof(zkproof):
    proof_params = dict()
    zkproof = zkproof.split(':')
    proof_params['a'] = [int(s.strip(), 0)
                         for s in zkproof[0].split()]
    proof_params['b'] = [[int(s.strip(), 0) for s in zkproof[1].split()], [
        int(s.strip(), 0) for s in zkproof[2].split()]]
    proof_params['c'] = [int(s.strip(), 0)
                         for s in zkproof[3].split()]
    proof_params['inputs'] = [int(s.strip(), 0)
                              for s in zkproof[4].split()]
    return proof_params


''' Crypto methods '''
# Generates and saves a EdDSA secret signing key. Not so secret, VERY INSECURE as it is right now.
# This is a proof-of-concept implementation only.


def get_private_key():
    key = FQ(
        1997011358982923168928344992199991480689546837621580239342656433234255379025)
    private_key = PrivateKey(key)
    return private_key


def get_public_key():
    private_key = get_private_key()
    public_key = PublicKey.from_private(private_key)
    return public_key


def sign(raw_msg):
    raw_msg = str(raw_msg)
    private_key = get_private_key()
    public_key = get_public_key()
    msg = hashlib.sha512(raw_msg.encode("utf-8")).digest()
    signature = private_key.sign(msg)
    "Writes the input arguments for verifyEddsa in the ZoKrates stdlib to file."
    sig_R, sig_S = signature
    args = [sig_R.x, sig_R.y, sig_S, public_key.p.x.n, public_key.p.y.n]
    args = " ".join(map(str, args))

    M0 = msg.hex()[:64]
    M1 = msg.hex()[64:]
    b0 = [str(int(M0[i:i+8], 16)) for i in range(0, len(M0), 8)]
    b1 = [str(int(M1[i:i+8], 16)) for i in range(0, len(M1), 8)]
    args = args + " " + " ".join(b0 + b1)
    proof_args['signatureArgs'] = args
    return signature


def server_handler(args):
    global web3
    global BotContract

    server = VsockListener()
    server.bind(args.port)
    print("Started listening to port : ", str(args.port))
    web3 = Web3(Web3.HTTPProvider(URL))
    web3.eth.set_gas_price_strategy(fast_gas_price_strategy)
    contract_address = web3.toChecksumAddress(BOT_CONTRACT_ADDRESS)
    BotContract = web3.eth.contract(
        abi=BOT_ABI, address=contract_address)
    server.recv_data()


def main():
    global web3
    global BotContract
    web3 = Web3(Web3.HTTPProvider(URL))
    web3.eth.set_gas_price_strategy(fast_gas_price_strategy)
    print(web3)
    contract_address = web3.toChecksumAddress(BOT_CONTRACT_ADDRESS)
    BotContract = web3.eth.contract(
        abi=BOT_ABI, address=contract_address)
    print(BotContract)

    parser = argparse.ArgumentParser(prog='vsock-sample')
    parser.add_argument("--version", action="version",
                        help="Prints version information.",
                        version='%(prog)s 0.1.0')
    subparsers = parser.add_subparsers(title="options")

    server_parser = subparsers.add_parser("server", description="Server",
                                          help="Listen on a given port.")
    server_parser.add_argument(
        "port", type=int, help="The local port to listen on.")
    server_parser.set_defaults(func=server_handler)

    if len(sys.argv) < 2:
        parser.print_usage()
        sys.exit(1)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
