#!/bin/sh

# Download Zokrates and set the path.
curl -LSfs get.zokrat.es | sh
export PATH=$PATH:/home/ec2-user/.zokrates/bin

# To call the client, you have to pass: CID of the enclave, Port for remote server,
# and a dummy string that will trigger the Nitro Enclave. For Example:

python3 client.py client 16 5005