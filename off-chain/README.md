# Off-Chain Components of the Trading Bot

## Parameter Training
This folder has the code to the open-source algorithmic trading platform [Zenbot](https://github.com/DeviaVir/zenbot) and some extensions to it, i.e. Zenbot has to be installed to run this script

This project uses Zenbot to backtest trading strategies

The [algo_picker](https://github.com/ckocaogullar15/private-on-chain-trading/tree/main/off-chain/algo_picker) folder consists of the addition we have made to the bot, which is a script

This script aims to do the following:

1. Find all 30-day periods within past period of x months where buy & hold was a bad strategy
2. Backtest all selected strategies in their base settings in these found periods
3. Optimise parameters of the selected strategies using grid search within all these

## Performance Measurement
To be able to access your crypto funds and use them for trading, you need a cryptowallet. This project uses Metamask, one of the most acclaimed cryptowallets. However, the original Metamask extension asks for user permission for every transaction. This interferes with our performance measurements. We have modified the Metamask extension to bypass these permission requests.

You need to clone the [modified Metamask repository](https://github.com/ckocaogullar15/metamask-extension) and build it locally following the instructions. You should then add the extension to your browser and login with your credentials. 