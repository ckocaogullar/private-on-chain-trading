# Private On-Chain Trading Bot

On-chain trading has the advantage of full transparency favored by DeFi advocates and users, however, transparency sadly kills the competitive advantage a trading algorithm might have over its competition. Privacy, when it comes to on-chain trading, comes in at least two guises: algorithmic privacy _(hiding the code and ideas behind the code)_ and data privacy _(hiding the algorithm’s inputs)_.

This project aims to partition the computation into public and private parts to find the optimal mix of off-chain and on-chain computation to achieve a decentralised partially private algorithm for on-chain trading.

## Running the Code

### On-chain Part

* Make sure that you have a Node.js `>=12.0` installation.
* Go to the root directory of the project, that is `private-on-chain-trading`. Then, run the below commands to install the dependencies of the on-chain app.
```
cd off-chain/
npm install
```
* Start your personal blockchain using *Ganache* client (or use any network and modify the `hardhat-config.js` file accordingly)
```
ganache-cli 
```
* In a separate Terminal tab, in the same directory, run the command below to deploy the contract to your *Ganache* network:
```
npx hardhat --network localhost run scripts/deploy.js
```
### Off-chain Part

The `off-chain` folder contains the off-chain applications for the user and the trading bot's admin in two sub-folders `user-frontend` and `admin-frontend`.

* As the contract is deployed, the terminal tab used for running the deployment command will display the *Contract Address*. On your text editor, open the `off-chain/frontend/user-frontend/src/config.js` and `off-chain/frontend/admin-frontend/src/config.js` files and replace the `CONTRACT_ADDRESS` with your contract's address.
* Go to the project's root directory `private-on-chain-trading`, run the below commands in separate terminal windows:
```
cd frontend/user-frontend
npm install
npm run start
```
and 
```
cd frontend/admin-frontend
npm install
npm run start
```
to install the dependencies and get the frontend apps running.

_*Note:*_ If you make any modifications to the contract, remember to compile the contract (`npx hardhat compile`) and update the ABI that the frontend apps use. The contract's ABI can be found in `on-chain/artifacts/contracts/BaseBot.sol/BaseBot.json`. Copying the `abi` from here, update the frontend apps' ABIs which are in the `off-chain/frontend/user-frontend/src/config.js` and `off-chain/frontend/admin-frontend/src/config.js`.
