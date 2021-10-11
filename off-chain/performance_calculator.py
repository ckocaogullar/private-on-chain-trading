import json
import numpy as np
import matplotlib.pyplot as plt


def main():
    with open('./performance.json', 'r') as f:
        performance = json.load(f)

    keys = ["deltaBalance", "deltaGetIndicators", "deltaProofGenTime",
            "deltaTradingTime", "deltaTotalTime", "gasUsed"]
    deltaGetIndicators = list()
    deltaProofGenTime = list()
    deltaProofVerifTime = list()
    deltaTradingTime = list()
    deltaTotalTime = list()
    for perf in performance["table"]:
        # if not perf["deltaGetIndicators"] or not perf["deltaProofGenTime"] or not perf["deltaProofVerifTime"] or not perf["deltaTradingTime"] or not perf["deltaTotalTime"]:
        #     del performance["table"][performance["table"].index(perf)]
        if not(perf["deltaGetIndicators"] < 0 or perf["deltaProofGenTime"] < 0 or perf["deltaProofVerifTime"] < 0 or perf["deltaTradingTime"] < 0 or perf["deltaTotalTime"] < 0):
            deltaGetIndicators.append(perf["deltaGetIndicators"]/1000)
            deltaProofGenTime.append(perf["deltaProofGenTime"]/1000)
            deltaProofVerifTime.append(perf["deltaProofVerifTime"]/1000)
            deltaTradingTime.append(perf["deltaTradingTime"]/1000)
            deltaTotalTime.append(perf["deltaTotalTime"]/1000)

    deltaGetIndicators = np.array(deltaGetIndicators[371:1371])
    deltaProofGenTime = np.array(deltaProofGenTime[371:1371])
    deltaProofVerifTime = np.array(deltaProofVerifTime[371:1371])
    deltaTradingTime = np.array(deltaTradingTime[371:1371])
    deltaTotalTime = np.array(deltaTotalTime[371:1371])
    # deltaGetIndicators = np.array(
    #     [perf["deltaGetIndicators"] for perf in performance["table"]])
    # deltaProofGenTime = np.array(
    #     [perf["deltaProofGenTime"] for perf in performance["table"]])
    # deltaProofVerifTime = np.array(
    #     [perf["deltaProofVerifTime"] for perf in performance["table"]])
    # deltaTradingTime = np.array([perf["deltaTradingTime"]
    #                              for perf in performance["table"]])
    # deltaTotalTime = np.array([perf["deltaTotalTime"]
    #                            for perf in performance["table"]])
    print('There are ', len(deltaGetIndicators), ' entries')
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
    print('    mean: ', deltaProofVerifTime.mean())
    print('    min: ', deltaProofVerifTime.min())
    print('    max: ', deltaProofVerifTime.max())
    print('    std dev: ', deltaProofVerifTime.std())
    print()
    print('Time trading')
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

    data = [deltaGetIndicators, deltaProofGenTime,
            deltaProofVerifTime, deltaTradingTime, deltaTotalTime]

    fig = plt.figure(figsize=(10, 7))

    # Creating axes instance
    ax = fig.add_subplot(111)

    # Creating plot
    bp = ax.boxplot(data, labels=['Get Public\nParameters', 'Generate\nProof',
                                  'Verify\nProof', 'Trade', 'Total'])
    ax.yaxis.grid()
    ax.set_ylabel("Time (s)")

    # show plot
    plt.savefig('boxes.pgf')
    plt.show()


if __name__ == "__main__":
    main()
