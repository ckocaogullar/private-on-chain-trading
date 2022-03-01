# Admin Off-Chain
This folder includes the off-chain app that will be used by the admin of the trading bot.

The app consists of a React frontend app (which is in the `client/` folder) and a Node server as a proxy (`server.js`). The server is needed for running shell script to generate proofs automatically.

You should give execution permission to the proof generation script as follows:

`chmod u+x createProof.sh`

You can start running both run the React app and Server concurrently.

## Instructions

1. Install dependencies by running `npm install` both in `admin-app/` and `admin-app/client` folders
1. Start the admin client and server with `yarn run start` command in `admin-app/` and `admin-app/client` on separate command line tabs
1. 


