# // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# // SPDX-License-Identifier: MIT-0
import argparse
import socket
import sys
import subprocess
import config
from threading import Thread
import time
import pathlib

path = str(pathlib.Path(__file__).parent.resolve()) + '/packages'
print('Path is', path)
output = subprocess.run(
         ['export', path], capture_output=True, shell=True)

from web3 import Web3
from web3.gas_strategies.time_based import fast_gas_price_strategy

upperBoundPercentage = 100
lowerBoundPercentage = 100

performanceRunCounter = 0
performanceRunThreshold = 100

indicatorsCaught = False
tProofGenStarted = None

web3 = None
BotContract = None

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
                print("Connection from " + str(from_client) + str(remote_cid) + str(remote_port))
                
                query = from_client.recv(1024).decode()
                print("Message received: " + query)
                
                # Call the external URL
                # for our scenario we will download list of published ip ranges and return list of S3 ranges for porvided region.
                response = trigger_trade(10,10)
                
                # Send back the response                 
                from_client.send(str(response).encode())
    
                from_client.close()
                print("Client call closed")
            except Exception as ex:
                print(ex)

def server_handler(args):
    global web3
    global BotContract

    server = VsockListener()
    server.bind(args.port)
    print("Started listening to port : ",str(args.port))
    web3 = Web3(Web3.HTTPProvider(config.URL))
    web3.eth.set_gas_price_strategy(fast_gas_price_strategy)
    contract_address = web3.toChecksumAddress(config.BOT_CONTRACT_ADDRESS)
    BotContract = web3.eth.contract(abi=config.BOT_ABI, address=contract_address)
    server.recv_data()

# # Get list of current ip ranges for the S3 service for a region.
# # Learn more here: https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html#aws-ip-download 
# def get_s3_ip_by_region(region):
    
#     full_query = 'https://ip-ranges.amazonaws.com/ip-ranges.json'
#     print("Full URL:",full_query)

#     print("URL Open")
#     data = urllib.request.urlopen(full_query)

#     print("Handle Response")
    
#     response = json.loads(data.read())
#     ip_ranges = response['prefixes']
#     s3_ips = []
#     for item in ip_ranges:
#         if (item["service"] == "S3") and (item["region"] == region):
#             s3_ips.append(item["ip_prefix"])
#     return s3_ips

# Makes the buying or selling decision
def decide_trade(current_price, upper_bollinger_band, lower_bollinger_band):
    print('Deciding on the trade')
    if (current_price > (upper_bollinger_band / 100) * (100 - config.UPPER_BOUND_PERCENTAGE)):
        print("Selling token1")
        a, b, c, inputs = generate_zkproof(
            'sell-proof', current_price, upper_bollinger_band, lower_bollinger_band, 0, config.UPPER_BOUND_PERCENTAGE)
        sign_and_send_tx('trade', {'a': [web3.toInt(hexstr=x) for x in a], 'b': [[web3.toInt(hexstr=x) for x in b[i]] for i in range(
            len(b))], 'c': [web3.toInt(hexstr=x) for x in c], 'inputs': [web3.toInt(hexstr=x) for x in inputs]})
    elif (current_price <= (lower_bollinger_band / 100) * (100 - config.LOWER_BOUND_PERCENTAGE)):
        print("Buying token1")
        a, b, c, inputs = generate_zkproof(
            'buy-proof', current_price, upper_bollinger_band, lower_bollinger_band, 1, config.LOWER_BOUND_PERCENTAGE)
    return a, b, c, inputs


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
    # if event_name == 'BollingerIndicators':
    #     decide_trade(rich_logs[0]['args']['currentPrice'], rich_logs[0]['args']
    #                  ['upperBollingerBand'], rich_logs[0]['args']['lowerBollingerBand'])


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

# def main():
#     parser = argparse.ArgumentParser(prog='vsock-sample')
#     parser.add_argument("--version", action="version",
#                         help="Prints version information.",
#                         version='%(prog)s 0.1.0')
#     subparsers = parser.add_subparsers(title="options")

#     server_parser = subparsers.add_parser("server", description="Server",
#                                           help="Listen on a given port.")
#     server_parser.add_argument("port", type=int, help="The local port to listen on.")
#     server_parser.set_defaults(func=server_handler)
    
#     if len(sys.argv) < 2:
#         parser.print_usage()
#         sys.exit(1)

#     args = parser.parse_args()
#     args.func(args)

def main():
    # global web3
    # global BotContract

    while True:
        print('Yello!')
        time.sleep(5)
        # web3 = Web3(Web3.HTTPProvider(config.URL))
        # web3.eth.set_gas_price_strategy(fast_gas_price_strategy)
        # print(web3)
        # contract_address = web3.toChecksumAddress(config.BOT_CONTRACT_ADDRESS)
        # BotContract = web3.eth.contract(abi=config.BOT_ABI, address=contract_address)
        # print(BotContract)

    # trigger_trade(10,10)

if __name__ == "__main__":
    main()
