# // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# // SPDX-License-Identifier: MIT-0

#!/usr/local/bin/env python3
import argparse
import socket
import sys
import subprocess


def generate_zkproof(signature, current_price, upper_bollinger_band, lower_bollinger_band, buy_sell_flag, percentage_bound):
    # go to the proof directory
    output = subprocess.run(
        ['export', 'PATH=$PATH:/Users/ceren/.zokrates/bin'], capture_output=True, shell=True)
    print(output)
    # execute the program
    output = subprocess.run(['zokrates', 'compute-witness', '-a', str(current_price), str(upper_bollinger_band), str(
        lower_bollinger_band), str(buy_sell_flag), str(percentage_bound)], capture_output=True, cwd='../../zokrates-proof/decision-proof')
    print(output)
    # generate a proof of computation
    output = subprocess.run(['zokrates', 'generate-proof'], capture_output=True, cwd='../../zokrates-proof/decision-proof')
    print(output)

    # read and return proof
    with open('../../zokrates-proof/decision-proof/proof.json', 'r') as file:
        raw_proof_data = json.load(file)
        print(raw_proof_data)
        return raw_proof_data['proof']['a'], raw_proof_data['proof']['b'], raw_proof_data['proof']['c'], raw_proof_data['inputs']

# To call the client, you have to pass: CID of the enclave, Port for remote server, 
# and Query string that will be processed in the Nitro Enclave. For Example:
# $ python3 client.py client 19 5005 "us-east-1"
class VsockStream:
    # Client
    def __init__(self, conn_timeout=30):
        self.conn_timeout = conn_timeout


    def connect(self, endpoint):
        # Connect to the remote endpoint with CID and PORT specified.
        try:
            self.sock = socket.socket(socket.AF_VSOCK, socket.SOCK_STREAM)
            self.sock.settimeout(self.conn_timeout)
            self.sock.connect(endpoint)
        except ConnectionResetError as e:
            print("Caught error ", str(e.strerror)," ",str(e.errno))


    def send_data(self, data):
        # Send data to the remote endpoint
        print(str(self.sock))
        # encode data before sending
        self.sock.send(data.encode())
        print("Data Sent ", data)
        # receiving responce back
        data =  self.sock.recv(1024).decode()  # receive response
        print('Received from server: ' + data)  # show in terminal
        self.sock.close()


def client_handler(args):
    # creat socket tream to the Nitro Enclave
    client = VsockStream()
    endpoint = (args.cid, args.port)
    print("Endpoint Arguments ", str(args.cid), str(args.port))
    client.connect(endpoint)
    # Send provided query and handle the response
    client.send_data(args.query)
    

def main():
    # Handling of input parameters
    parser = argparse.ArgumentParser(prog='vsock-sample')
    parser.add_argument("--version", action="version",
                        help="Prints version information.",
                        version='%(prog)s 0.1.0')
    subparsers = parser.add_subparsers(title="options")

    client_parser = subparsers.add_parser("client", description="Client",
                                          help="Connect to a given cid and port.")
    client_parser.add_argument("cid", type=int, help="The remote endpoint CID.")
    client_parser.add_argument("port", type=int, help="The remote endpoint port.")
    client_parser.add_argument("query", type=str, help="Query to send.")

    # Assign handler function
    client_parser.set_defaults(func=client_handler)

    # Argument count validation
    if len(sys.argv) < 3:
        parser.print_usage()
        sys.exit(1)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()