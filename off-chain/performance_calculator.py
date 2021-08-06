import json
import numpy as np

def main():
    with open('./performance_1.json', 'r') as f:
        performance = json.load(f)    
    
    keys = ["deltaBalance", "deltaGetIndicators", "deltaProofGenTime", "deltaTradingTime", "deltaTotalTime", "gasUsed"]

    deltaGetIndicators = np.array([perf["deltaGetIndicators"] for perf in performance["table"]])
    deltaProofGenTime = np.array([perf["deltaProofGenTime"] for perf in performance["table"]])
    deltaTradingTime = np.array([perf["deltaTradingTime"] for perf in performance["table"]])
    deltaTotalTime = np.array([perf["deltaTotalTime"] for perf in performance["table"]])
    print()
    print('-----------------------------------------------------------------------')
    print('Times of actions in milliseconds')
    print('-----------------------------------------------------------------------')
    print('Time getting the price and indicators calculated on-chain and emitted')
    print('    mean: ', deltaGetIndicators.mean())
    print('    min: ', deltaGetIndicators.min())
    print('    max: ', deltaGetIndicators.max())
    print('    std dev: ', deltaGetIndicators.std())
    print()
    print('Time generating the proof (happens off-chain)')
    print('    mean: ', deltaProofGenTime.mean())
    print('    min: ', deltaProofGenTime.min())
    print('    max: ', deltaProofGenTime.max())
    print('    std dev: ', deltaProofGenTime.std())
    print()
    print('Time verifying the proof (happens on-chain)')
    print('    mean: ', deltaTradingTime.mean())
    print('    min: ', deltaTradingTime.min())
    print('    max: ', deltaTradingTime.max())
    print('    std dev: ', deltaTradingTime.std())
    print()
    print('Total time')
    print('    mean: ', deltaTotalTime.mean())
    print('    min: ', deltaTotalTime.min())
    print('    max: ', deltaTotalTime.max())
    print('    std dev: ', deltaTotalTime.std())
    print()

if __name__ == "__main__":
    main()