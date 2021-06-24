# Off-Chain Components of the Trading Bot

This folder has the code to the open-source algorithmic trading platform [Zenbot](https://github.com/DeviaVir/zenbot) and some extensions to it

This project uses Zenbot to backtest trading strategies

The [algo_picker](https://www.example.com) folder consists of the addition we have made to the bot, which is a script

This script aims to do the following:

1. Find all 30-day periods within past period of x months where buy & hold was a bad strategy
2. Backtest all selected strategies in their base settings in these found periods
3. Optimise parameters of the selected strategies using grid search within all these