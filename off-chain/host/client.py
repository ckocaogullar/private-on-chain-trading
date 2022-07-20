# // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# // SPDX-License-Identifier: MIT-0

#!/usr/local/bin/env python3
import argparse
import socket
import sys
import subprocess
import json


def generate_zkproof(enclave_data):
    output = subprocess.run(
        ['zokrates'], capture_output=True, cwd='./zokrates_decision_proof')
    print(output)
    # execute the program
    output = subprocess.run(['zokrates', 'compute-witness', '-a', enclave_data],
                            capture_output=True, cwd='./zokrates_decision_proof')
    print(output)
    # generate a proof of computation
    output = subprocess.run(['zokrates', 'generate-proof'],
                            capture_output=True, cwd='./zokrates_decision_proof')
    print(output)

    # read and return proof
    with open('./zokrates_decision_proof/proof.json', 'r') as file:
        raw_proof_data = json.load(file)
        print(raw_proof_data)
        return ' '.join(raw_proof_data['proof']['a']) + ' : ' + ' '.join(raw_proof_data['proof']['b'][0]) + ' : ' + ' '.join(raw_proof_data['proof']['b'][1]) + ' : ' + ' '.join(raw_proof_data['proof']['c']) + ' : ' + ' '.join(raw_proof_data['inputs'])


class VsockStream:
    # Client
    def __init__(self, conn_timeout=3000):
        self.conn_timeout = conn_timeout

    def connect(self, endpoint):
        # Connect to the remote endpoint with CID and PORT specified.
        try:
            self.sock = socket.socket(socket.AF_VSOCK, socket.SOCK_STREAM)
            self.sock.settimeout(self.conn_timeout)
            self.sock.connect(endpoint)
        except ConnectionResetError as e:
            print("Caught error ", str(e.strerror), " ", str(e.errno))

    def send_data(self, data):
        # Send data to the remote endpoint
        print(str(self.sock))
        # encode data before sending
        self.sock.send(data.encode())
        print("Data Sent ", data)
        # receiving responce back
        data = self.sock.recv(1024).decode()  # receive response
        print('Received from server: ' + data)  # show in terminal
        zkproof = generate_zkproof(data)
        self.sock.send(zkproof.encode())
        self.sock.close()


def client_handler(args):
    # create socket stream to the Nitro Enclave
    client = VsockStream()
    endpoint = (args.cid, args.port)
    print("Endpoint Arguments ", str(args.cid), str(args.port))
    client.connect(endpoint)
    # Trigger the TEE by sending a dummy input
    client.send_data("Start enclave process.")


def main():
    # Handling of input parameters
    parser = argparse.ArgumentParser(prog='vsock-sample')
    parser.add_argument("--version", action="version",
                        help="Prints version information.",
                        version='%(prog)s 0.1.0')
    subparsers = parser.add_subparsers(title="options")

    client_parser = subparsers.add_parser("client", description="Client",
                                          help="Connect to a given cid and port.")
    client_parser.add_argument(
        "cid", type=int, help="The remote endpoint CID.")
    client_parser.add_argument(
        "port", type=int, help="The remote endpoint port.")

    # Assign handler function
    client_parser.set_defaults(func=client_handler)

    # Argument count validation
    if len(sys.argv) < 2:
        parser.print_usage()
        sys.exit(1)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
