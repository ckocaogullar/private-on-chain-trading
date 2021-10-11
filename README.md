# Private On-Chain Trading Bot

On-chain trading has the advantage of full transparency favored by DeFi advocates and users, however, transparency sadly kills the competitive advantage a trading algorithm might have over its competition. Privacy, when it comes to on-chain trading, comes in at least two guises: algorithmic privacy _(hiding the code and ideas behind the code)_ and data privacy _(hiding the algorithm’s inputs)_.

This project aims to partition the computation into public and private parts to find the optimal mix of off-chain and on-chain computation to achieve a decentralised partially private algorithm for on-chain trading.

## The General Idea

The trading decisions in algorithms are made based on several parameters fitting certain conditions. In our setting, some of the parameters are public (calculated and stored on-chain), while some are private (calculated and stored off-chain). The goal is to keep the private parameters hidden to all other than the bot's admin while ensuring the correctness of the mentioned condition checks.
 The trading process works as follows: 
1. [Create & Deploy Verifier Contracts] To achieve this, admin writes Zokrates code for generating proofs for the conditions, compiles the code to generate one verifier contract for each different condition, and deploys these contracts to the chain. This step happens only once, since the same verifier contract can be used for the same condition.
1. [Invoke Trading from Off-Chain App] The admin’s frontend app starts the trading process by calling the bot smart contract for providing public parameters. These can be technical indicators, price data, etc.
1. [Calculate and Provide Public Parameters From On-Chain] The smart contract gets the current (and if needed, past) price data from Uniswap oracle and calculates any necessary indicators. Finally, it emits an event which includes these public parameters. 
[Use Both Public and Private Parameters Off-Chain] The admin frontend app catches the event, reads the values and uses them, as well as its private parameters checks buy/sell conditions. The conditions are specified in the contract as comments. 
[Create Proofs & Send Them to the Chain] Let’s say the checked condition yielded `true`. In this case, the off-chain bot operator creates a zk proof of this comparison and calls the bot smart contract, providing the proof to it and telling it to buy.
[Call the Verifier Contracts from On-Chain Bot] Upon receiving the proof, the bot smart contract calls the verifier contract for verifying the operation specified in the if condition. 
[Trade] Once the proof is verified, the bot smart contract can execute the trade based on the buy/sell command that was provided along with the proofs.
As a result, the on-chain bot doesn’t learn the private parameters but is sure that the off-chain comparison of public and private parameters was indeed correct.

Ensuring Integrity of the Verification Contracts
Zokrates takes the responsibility of verifying the proof from a verifying actor and gives it to a smart contract. However, someone has to create and deploy the contract. He writes a Zokrates programme to do that, which generates the verifier smart contract when compiled. In our setting, we give this responsibility to the bot’s admin. 
Although carrying verification to the chain reduces the amount of trust in the process, whoever writes the Zokrates programme has the responsibility and power to specify what he wants to be proven by the contract. The specifications of the verifier (e.g. if (private_param == public_param): trade) are public in the bot’s smart contract, provided as comments. The problem here is the users cannot easily make sure if the bot is verifying what it claims to be verifying, since the verifier smart contract is not very human readable. 
To solve this issue and decrease the level of trust put on the bot admin, we include the Zokrates code from which the contract was created somewhere that all users can reach, specifically, in the verifier contract as comments. Alternatively, a separate smart contract can be deployed. This way, the users can actually understand what is being verified and confirm that the smart contract is legitimate by compiling the Zokrates code themselves and comparing the resulting contract to it if they want.


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
