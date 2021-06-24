"""
This script aims to do the following:
1. Find all 30-day periods within past period of x months where buy & hold was a bad strategy
2. Backtest all selected strategies in their base settings in these found periods
3. Optimise parameters of the selected strategies using grid search within all these
"""

from datetime import date, timedelta, datetime
import re
import json
import multiprocessing as mp
from subprocess import Popen, PIPE
from tempfile import TemporaryFile  # used for standard out
import numpy as np

# Strategies to be tested in this script
strategies = ['bollinger', 'dema', 'macd', 'rsi', 'stddev',
              'trend_bollinger', 'trend_ema', 'trust_distrust']


"""
Finds all 30-day periods between start_date and final_date where buy & hold is a bad strategy
"""


def find_unprofitable_periods():
    objPrcessManager = Proc()

    # Search between these two dates
    start_date = date(2021, 1, 1)
    final_date = date(2021, 6, 21)

    # End date of a single search
    end_date = start_date + timedelta(days=27)
    dates = dict()
    dicProcesses = dict()
    objPrcessManager = Proc()
    while end_date < final_date:
        start_date_str = str(
            start_date.year) + str(start_date.month).zfill(2) + str(start_date.day).zfill(2)
        end_date_str = str(end_date.year) + \
            str(end_date.month).zfill(2) + str(end_date.day).zfill(2)
        arg = "sim poloniex.ETH-USDC --start " + start_date_str + \
            " --end " + end_date_str + "--strategy trust_distrust --period 1h"
        dicProcesses[start_date_str] = ["zenbot", arg]
        start_date += timedelta(days=1)
        end_date = start_date + timedelta(days=27)

    objPrcessManager.run(dicProcesses)

    for key in objPrcessManager.dicCompletedProcesses:
        s = str(objPrcessManager.getProcessData(key)["stdout"], 'utf-8')
        process_date_stdout(dates, key, s)

    with open('./scripts/algo_picker/results/dates.json', 'w') as file:
        json.dump(dates, file)


"""
Backtest the selected strategies in the periods found by find_unprofitable_periods
optimised flag will be used later to test the strategies while their parameters are optimised via grid search
"""


def backtest_strategies(optimisation_test=False):
    with open('./scripts/algo_picker/results/dates.json', 'r') as file:
        days = json.load(file)
    print(len(days.keys()))
    dicProcesses = dict()
    objPrcessManager = Proc()
    strategy_results = dict()
    count = 0
    for strategy in strategies:
        for key in days.keys():
            try:
                end_date = date(int(key[:4]), int(key[4:6]),
                                int(key[6:])) + timedelta(days=30)
                end_date_str = str(end_date.year) + \
                    str(end_date.month).zfill(2) + str(end_date.day).zfill(2)
                arg = "sim poloniex.ETH-USDC --start " + key + \
                    " --end " + end_date_str + "--strategy " + strategy + " --period 1h"
                dicProcesses[key + "." + strategy] = ["zenbot", arg]
            except:
                print('Something went horribly wrong')

        objPrcessManager.run(dicProcesses)

        for key in objPrcessManager.dicCompletedProcesses:
            s = str(objPrcessManager.getProcessData(key)["stdout"], 'utf-8')
            start_time, strat = key.split('.')
            process_backtest_stdout(strategy_results, strat, start_time, s)
        if not optimisation_test:
            with open('./scripts/algo_picker/results/strategy_results/' + strategy + '.json', 'w') as file:
                json.dump(strategy_results, file)


"""
--WORK-IN-PROGRESS--
Optimises parameters through grid search
"""


def grid_search():
    phenotypes = {
        'bollinger': {
            'bollinger_size': [1, 40],
            'bollinger_time': [1.0, 6.0],
            'bollinger_upper_bound_pct': [-1.0, 30.0],
            'bollinger_lower_bound_pct': [-1, 30]
        },
        'dema': {
            'ema_short_period': [1, 20],
            'ema_long_period': [20, 100],
            'up_trend_threshold': [0, 50],
            'down_trend_threshold': [0, 50],
            'overbought_rsi_periods': [1, 50],
            'overbought_rsi': [20, 100]
        },
        'macd': {
            'ema_short_period': [1, 20],
            'ema_long_period': [20, 100],
            'signal_period': [1, 20],
            'up_trend_threshold': [0, 50],
            'down_trend_threshold': [0, 50],
            'overbought_rsi_periods': [1, 50],
            'overbought_rsi': [20, 100]
        },
        'rsi': {
            'rsi_periods': [1, 200],
            'oversold_rsi': [1, 100],
            'overbought_rsi': [1, 100],
            'rsi_recover': [1, 100],
            'rsi_drop': [0, 100],
            'rsi_divisor': [1, 10]
        },
        'stddev': {
            'trendtrades_1': [2, 20],
            'trendtrades_2': [4, 100]
        },
        'trend_bollinger': {
            'bollinger_size': [1, 40],
            'bollinger_time': [1.0, 6.0],
            'bollinger_upper_bound_pct': [-1.0, 30.0],
            'bollinger_lower_bound_pct': [-1, 30]
        },
        'trend_ema': {
            'trend_ema': [1, 40],
            'oversold_rsi_periods': [5, 50],
            'oversold_rsi': [20, 100]
        },
        'trust_distrust': {
            'sell_threshold': [1, 100],
            'sell_threshold_max': [1, 100],
            'sell_min': [1, 100],
            'buy_threshold': [1, 100],
            'buy_threshold_max': [1, 100],
            'greed': [1, 100]
        }
    }
    """
    For ease of reference, here is the format of strategy_results:

    strategy_results = {
    "start_time": {
        "results": {
            "buy_hold": float,
            "end_balance": float,
            "percent_vs": float,
            "stdout": str
    """
    for strategy in phenotypes.keys():
        with open('./scripts/algo_picker/results/strategy_results/' + strategy + '.json', 'r') as file:
            strategy_results = json.load(file)
        pheno_ranges = dict()
        ranges = list()
        dicProcesses = dict()
        objPrcessManager = Proc()
        for phenotype in phenotypes[strategy]:
            pheno_ranges[phenotype] = list(range(
                phenotypes[strategy][phenotype][0], phenotypes[strategy][phenotype][1] + 1))
            ranges.append(pheno_ranges[phenotype])
            range_combinations = np.array(np.meshgrid(tuple(ranges)))
        for key in strategy_results.keys():
            try:
                end_date = date(int(key[:4]), int(key[4:6]),
                                int(key[6:])) + timedelta(days=27)
                end_date_str = str(end_date.year) + \
                    str(end_date.month).zfill(2) + str(end_date.day).zfill(2)
                arg = "sim poloniex.ETH-USDC --start " + key + \
                    " --end " + end_date_str + "--strategy " + strategy + " --period 1h"
            except:
                print('Something went horribly wrong')
            for comb in range_combinations:
                # arg += list(pheno_ranges.keys())[]
                pass
            dicProcesses[key + "." + strategy] = ["zenbot", arg]
            objPrcessManager.run(dicProcesses)


"""
Formats and saves the results of subprocesses called in find_unprofitable_periods 
"""


def process_date_stdout(dates, key, s):
    print(s)
    s = re.sub(r'\x1b(\[.*?[@-~]|\].*?(\x07|\x1b\\))', '', s)
    buy_hold = float(re.search(r'buy hold: .* \(', s,
                               re.MULTILINE).group(0).replace('buy hold:', '').replace('(', '').strip())
    if buy_hold < 1000:
        dates[key] = {
            'buy_hold': buy_hold,
            'stdout': s
        }


"""
Formats and saves the results of subprocesses called in backtest_strategies 
"""


def process_backtest_stdout(strategy_results, strat, start_time, s):
    print(s)
    s = re.sub(r'\x1b(\[.*?[@-~]|\].*?(\x07|\x1b\\))', '', s)
    end_balance = float(re.search(r'end balance: .* \(', s,
                                  re.MULTILINE).group(0).replace('end balance:', '').replace('(', '').strip())
    percent_vs = float(re.search(r'vs. buy hold: .*', s,
                                 re.MULTILINE).group(0).replace('vs. buy hold:', '').replace('%', '').strip())
    buy_hold = float(re.search(r'buy hold: .* \(', s,
                               re.MULTILINE).group(0).replace('buy hold:', '').replace('(', '').strip())
    if percent_vs > 0:
        strategy_results[start_time] = {
            'buy_hold': buy_hold,
            'end_balance': end_balance,
            'percent_vs': percent_vs,
            'stdout': s
        }


"""
Prints out the number of times where buy & hold failed AND strategies have succeeded
"""


def count_strategies():
    for strategy in strategies:
        with open('./scripts/algo_picker/results/strategy_results/' + strategy + '.json', 'r') as file:
            results = json.load(file)
        print(strategy + ' ', len(results))


"""
Prints out the number of times where buy & hold failed
"""


def count_unprofitable_periods():
    with open('./scripts/algo_picker/results/dates.json', 'r') as file:
        periods = json.load(file)
    print(len(periods))


"""
Code of the Proc class below is taken from: https://github.com/Brainspire/ProcessManager/blob/master/classes/proc.py
This class allows parallelising the processes
"""


class Proc:
    dicProcessList = {}  # initial process list
    dicActiveProcesses = {}  # current active processes
    dicCompletedProcesses = {}  # completed processes
    dicProcessOutPuts = {}  # standard out from processes
    intLimit = 4  # limit number of processes to run at any given time

    def __init__(self, intLimit: int = 4):
        """constructor method
        args:
            intLimit: max number of processes
        """
        self.intLimit = intLimit

    def run(self, dicProcessList: dict):
        """loop until all processes are complete
        args:
            dicProcessList: dictionary of processes to run, example: {
                    "index0":
                        [
                            "program", 
                            "param1", 
                            "param2", 
                            etc...
                        ],
                    "index1":
                        [
                            "program", 
                            "param1", 
                            "param2", 
                            etc...
                        ]
                }
        """
        self.dicProcessList = dicProcessList

        while True:
            self.spawnProcesses()

            self.pollProcesses()

            if(len(self.dicProcessList) == 0 and len(self.dicActiveProcesses) == 0):
                break

    def limitMaxed(self):
        """check the current running processes against max concurrent limit
        return: True|False
        """
        return len(self.dicActiveProcesses) >= self.intLimit

    def spawnProcesses(self):
        """spawn processes and migrate current running process from original command dic"""
        if(not self.limitMaxed()):
            for strKey in list(self.dicProcessList):
                lstCmd = self.dicProcessList[strKey]

                self.dicActiveProcesses[strKey] = self.runProcess(
                    lstCmd, strKey)
                self.dicProcessList.pop(strKey)

                if(self.limitMaxed()):
                    break

    def pollProcesses(self):
        """poll processes and migrate completed processes out of current running processes"""
        for strKey in list(self.dicActiveProcesses):
            proc = self.dicActiveProcesses[strKey]

            if proc.poll() is not None:
                (strStdOut, strStdErr) = proc.communicate()

                self.dicProcessOutPuts[strKey].seek(0)
                strStdOut = self.dicProcessOutPuts[strKey].read()
                self.dicProcessOutPuts[strKey].close()

                self.dicCompletedProcesses[strKey] = {
                    "stdout": strStdOut, "stderr": strStdErr, "retcode": proc.returncode}
                self.dicActiveProcesses.pop(strKey)

    def getProcessData(self, strKey: str = False):
        """retrieve proc status, output and errors for each process
        args:
            strKey: index associated with the original running dictionary

        return:
            dictionary|False
        """
        if(not strKey):
            return self.dicCompletedProcesses
        elif strKey in self.dicCompletedProcesses:
            return self.dicCompletedProcesses[strKey]
        else:
            return False

    def runProcess(self, lstCmd, strKey):
        """run a process
        args:
            lstCmd: command to run in list format
            strKey: the index of the command to maintain association
        return: process object pointer
        """
        self.dicProcessOutPuts[strKey] = TemporaryFile()
        return Popen(lstCmd, stdout=self.dicProcessOutPuts[strKey], stderr=PIPE)


def main():
    # backtest_strategies()
    # find_unprofitable_periods()
    # count_strategies()
    # count_strategies()
    print('Programme finished at ', datetime.now())


if __name__ == "__main__":
    main()
