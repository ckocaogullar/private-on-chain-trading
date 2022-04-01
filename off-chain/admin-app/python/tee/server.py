# // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# // SPDX-License-Identifier: MIT-0
import argparse
import socket
import config
from threading import Thread
import time
import sys
import hashlib

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

upperBoundPercentage = 100
lowerBoundPercentage = 100

performanceRunCounter = 0
performanceRunThreshold = 100

indicatorsCaught = False
tProofGenStarted = None

web3 = None
BotContract = None

witness_input = None

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
                print("Message received: " + query)

                # Call the external URL
                # for our scenario we will download list of published ip ranges and return list of S3 ranges for porvided region.
                trigger_trade(10, 10)

                # Send back the response
                from_client.send(str(witness_input).encode())

                from_client.close()
                print("Client call closed")
            except Exception as ex:
                print(ex)

    def send_data(self):
        # Receive data from a remote endpoint
        while True:
            try:
                print("Let's send stuff")
                (from_client, (remote_cid, remote_port)) = self.sock.accept()
                print("Connection from " + str(from_client) +
                      str(remote_cid) + str(remote_port))

                query = from_client.recv(1024).decode()
                print("Message received: " + query)

                # Call the external URL
                # for our scenario we will download list of published ip ranges and return list of S3 ranges for porvided region.
                response = trigger_trade(10, 10)

                # Send back the response
                from_client.send(str(response).encode())

                from_client.close()
                print("Client call closed")
            except Exception as ex:
                print(ex)


''' Trade decision-related smart contract methods '''
# Makes the buying or selling decision


def decide_trade(current_price, upper_bollinger_band, lower_bollinger_band):
    global witness_input
    print('Deciding on the trade')
    if (current_price > (upper_bollinger_band / 100) * (100 - config.UPPER_BOUND_PERCENTAGE)):
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

    elif (current_price <= (lower_bollinger_band / 100) * (100 - config.LOWER_BOUND_PERCENTAGE)):
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


def sign_and_send_tx(tx_name, tx_args):
    event_name = ''
    if tx_name == 'test':
        tx = BotContract.functions.test().buildTransaction(
            {'from': config.ACCOUNT, 'nonce': web3.eth.get_transaction_count(config.ACCOUNT)})
        event_name = 'TestEvent'
    elif tx_name == 'calculateIndicators':
        tx = BotContract.functions.calculateIndicators(tx_args['num_of_periods'], tx_args['period_length']).buildTransaction(
            {'from': config.ACCOUNT, 'nonce': web3.eth.get_transaction_count(config.ACCOUNT)})
        event_name = 'BollingerIndicators'
    elif tx_name == 'trade':
        tx = BotContract.functions.trade(tx_args['a'], tx_args['b'], tx_args['c'], tx_args['inputs']).buildTransaction(
            {'from': config.ACCOUNT, 'nonce': web3.eth.get_transaction_count(config.ACCOUNT)})
        event_name = 'ProofVerified'

    signed_txn = web3.eth.account.sign_transaction(
        tx, private_key=config.ACCOUNT_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
    worker = Thread(target=event_log_loop, args=(
        web3.toHex(tx_hash), event_name, 5))
    worker.start()

# Initiate the whole trading process. This is the function that should be called in the main.


def trigger_trade(num_of_periods, period_length):
    price = BotContract.functions.getCurrentPrice().call(
        {'from': config.ACCOUNT})
    print('Current price is', price)

    initial_balance = web3.eth.getBalance(config.ACCOUNT)
    print('Initial balance is', web3.fromWei(
        initial_balance, "ether"), 'ether')

    sign_and_send_tx('calculateIndicators', {
                     'num_of_periods': num_of_periods, 'period_length': period_length})


''' Crypto methods '''
# Generates and saves a EdDSA secret signing key if there does not already exist one. If there is already a saved key, returns it.


def get_private_key():
    key = FQ(1997011358982923168928344992199991480689546837621580239342656433234255379025)
    private_key = PrivateKey(key)
    return private_key


def get_public_key():
    private_key = get_private_key()
    public_key = PublicKey.from_private(private_key)
    return public_key

def load_key(filename):
    with open(filename, 'rb') as pem_in:
        fe = pem_in.read()
    private_key = PrivateKey(fe)
    return private_key

def save_key(pk, filename):
    # pem = pk.private_bytes(
    #     encoding=serialization.Encoding.PEM,
    #     format=serialization.PrivateFormat.PKCS8,
    #     encryption_algorithm=serialization.NoEncryption()
    # )

    with open(filename, 'wb') as file:
        file.write(str.encode(str(int(pk.fe))))

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
    web3 = Web3(Web3.HTTPProvider(config.URL))
    web3.eth.set_gas_price_strategy(fast_gas_price_strategy)
    contract_address = web3.toChecksumAddress(config.BOT_CONTRACT_ADDRESS)
    BotContract = web3.eth.contract(
        abi=config.BOT_ABI, address=contract_address)
    server.recv_data()


def main():
    global web3
    global BotContract
    web3 = Web3(Web3.HTTPProvider(config.URL))
    web3.eth.set_gas_price_strategy(fast_gas_price_strategy)
    print(web3)
    contract_address = web3.toChecksumAddress(config.BOT_CONTRACT_ADDRESS)
    BotContract = web3.eth.contract(
        abi=config.BOT_ABI, address=contract_address)
    print(BotContract)
    trigger_trade(10,10)

    # raw_msg = 'hey'
    # sig = sign(raw_msg)
    # msg = hashlib.sha512(raw_msg.encode("utf-8")).digest()
    # pk = get_public_key()
    # is_verified = pk.verify(sig, msg)
    # print(is_verified)


    # parser = argparse.ArgumentParser(prog='vsock-sample')
    # parser.add_argument("--version", action="version",
    #                     help="Prints version information.",
    #                     version='%(prog)s 0.1.0')
    # subparsers = parser.add_subparsers(title="options")

    # server_parser = subparsers.add_parser("server", description="Server",
    #                                       help="Listen on a given port.")
    # server_parser.add_argument(
    #     "port", type=int, help="The local port to listen on.")
    # server_parser.set_defaults(func=server_handler)

    # if len(sys.argv) < 2:
    #     parser.print_usage()
    #     sys.exit(1)

    # args = parser.parse_args()
    # args.func(args)



if __name__ == "__main__":
    main()
