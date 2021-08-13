import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import './App.css'
import { BOT_ABI, BOT_CONTRACT_ADDRESS } from './bot_config'
import DVF from 'dvf-client-js'
const starkPrivateKey = '743a0ff439f6ed52ed1fef395d6cea58af02088c91528b07048cc5f922d3f65'


const upperBoundPercentage = 100
const lowerBoundPercentage = 100

var performanceRunCounter = 0
const performanceRunThreshold = 100

var indicatorsCaught = false
var tProofGenStarted = null

function App(props) {
  const [account, setAccount] = useState(null);
  //const [subscribedUser, setSubscribedUser] = useState();
  const [botContract, setBotContract] = useState(null);
  const [botSocket, setBotSocket] = useState(null);
  const [web3, setWeb3] = useState();
  // load blockchain data in initial render
  useEffect(async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        // Create two connections: one using HTTPS (for calling methods), the other using WebSocket (for subscribing to events)

        // ------------------------------------------------------------
        // For local testnet (Hardhat network or ganache-cli):
        // ------------------------------------------------------------
        // const web3 = new Web3('http://127.0.0.1:8545/');
        // setWeb3(web3)
        // const web3Socket = new Web3(new Web3.providers.WebsocketProvider("ws://127.0.0.1:8545/"));

        // ------------------------------------------------------------
        // For Ropsten:
        // ------------------------------------------------------------
        const web3 = new Web3(window.web3.currentProvider);
        setWeb3(web3)
        const web3Socket = new Web3("wss://eth-ropsten.alchemyapi.io/v2/fBCbSZh46WyftFgzBU-a8_tIgCCxEL22");
        // ------------------------------------------------------------

        // Load the contract using both HTTPS and WebSocket connections
        const botContract = new web3.eth.Contract(BOT_ABI, BOT_CONTRACT_ADDRESS);
        setBotContract(botContract);
        const botSocket = new web3Socket.eth.Contract(BOT_ABI, BOT_CONTRACT_ADDRESS);
        setBotSocket(botSocket)

        // Request account access if needed and get the accounts
        await window.ethereum.enable();
        const accounts = await web3.eth.getAccounts()
        setAccount(accounts[0])
        
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      window.web3 = new Web3(web3.currentProvider);
      // console.log("You are using a legacy dapp browser. Please switch to a modern dapp browser, e.g. Brave")
    }
    // Non-dapp browsers...
    else {
      // console.log("Non-Ethereum browser detected. You should consider trying MetaMask!");
    }

  }, []);

  // ---------------------------------------------------
  // Simple Subscription Logic
  // ---------------------------------------------------
  // useEffect(() => {
  //   if (account === null) {
  //     return;
  //   }
  //   const subscribeUser = async (user) => {
  //     const subUser = await botContract.methods.subscribeUser(user).send({ from: account })
  //       .on('receipt', function (receipt) {
  //         // console.log(receipt)
  //       })
  //     setSubscribedUser(subUser);
  //   }

  //   botSocket.events.UserSubscribed({}, (error, event) => {
  //     // console.log(event)
  //     if (error) {
  //       // console.log('Could not get event ' + error)
  //     } else {
  //       subscribeUser(event.returnValues.subscriberAddress)
  //       // console.log('Event caught: ' + event.event)
  //     }
  //   })
  // }, [account])
  // ---------------------------------------------------

  const callProofApi = async (proofType, currentPrice, bollingerBand, percentageBound) => {
    tProofGenStarted = performance.now()
    const response = await fetch('/api/proof', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: [proofType, currentPrice, bollingerBand, percentageBound] }),
    });
    const body = await response.text();
    return body
  };

  const callPerformanceApi = async (deltaBalance, deltaGetIndicators, deltaProofGenTime, deltaProofVerifTime ,deltaTradingTime, deltaTotalTime, gasUsed) => {
    const response = await fetch('/api/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: [deltaBalance, deltaGetIndicators, deltaProofGenTime, deltaProofVerifTime, deltaTradingTime, deltaTotalTime, gasUsed] }),
    });
    const body = await response.text();
    return body
  };

  const callEndPerformanceApi = async () => {
    const response = await fetch('/api/end-performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const body = await response.text();
    return body
  };


  const getCurrentPrice = async () => {
    await botContract.methods.getCurrentPrice().send({from: account})
    .on('receipt', function (receipt) {
      // console.log(receipt)
    })
  }

  const deversifiBuyOrder = async () => {
    const price = 200
  const amount = '0.05'

  // order buy params
  const buy = {
    symbol: "ETH:USDT",
    amount,
    price,
    starkPrivateKey
  }

  const dvfConfig = {
    api: 'https://api.deversifi.com',
    wallet: {
      type: 'tradingKey',
      meta: {
        starkPrivateKey
      }
    }
  }

  const dvf = await DVF(web3, dvfConfig);

  // Buy order placing
  const rBuyOrder = await dvf.submitOrder(buy)
  console.info('buy order receipt', JSON.stringify(rBuyOrder))
  }

  const registerDeversifi = async () => {

    const dvfConfig = {
      api: 'https://api.deversifi.com',
      dataApi: 'https://api.deversifi.com'
    }

    const dvf = await DVF(web3, dvfConfig)

    const keyPair = await dvf.stark.createKeyPair(starkPrivateKey)
  
    const registerResponse = await dvf.register(keyPair.starkPublicKey)
    console.log(registerResponse)
  }

  // Subscribe to the BollingerIndicators event
  // Call calculateIndicators function
  // Once you catch the BollingerIndicators event, make the if-else comparisons with your private parameters
  // Whichever signal it fits (buy or hold), use public and private parameters there to generate a proof accordingly

  const trade = async (numOfPeriods, periodLength) => {
    // Get average gas price
    // ----------------------
    // web3.eth.getGasPrice().then((result) => {
    //   console.log('price avg: ', web3.utils.fromWei(result, 'gwei'))
    //   })

    // Measure time and gas consumption
    if (performanceRunCounter < 0){
      // console.log('performanceRunCounter < 0 = ', performanceRunCounter)
      return
    } else if (performanceRunCounter >= performanceRunThreshold){
      callEndPerformanceApi()
      // Set counter to -1 to show that the performance check has ended
      // console.log('performanceRunCounter >= performanceRunThreshold = ', performanceRunCounter)
      performanceRunCounter = -1
      return
    } else {
    var t0 = performance.now()
    // console.log('t0 ', t0)
    var tBollingerIndicators = null
    var tProofGenEnded = null
    var tProofVerified = null
    var initialBalance = null
    web3.eth.getBalance(account).then(res => {initialBalance = res});
    // console.log('initialBalance ', initialBalance)
    var gasUsed = 0;

    
      botSocket.once('TestEvent', {}, (error, event) => {
        if (error) {
          // console.log('Could not get event ' + error)
        } else {
          // console.log('TestEvent Event caught: ', event)
        }
      })
      botSocket.once('ProofVerified', {}, (error, event) => {
      if (error) {
        // console.log('Could not get event ' + error)
      } else {
        tProofVerified = performance.now()
        // console.log('tProofVerified ', tProofVerified)
        // console.log('ProofVerified Event caught: ', event)
      }
    })
    
    botSocket.once('BollingerIndicators', {}, (error, event) => {
      if (error) {
        // console.log('Could not get BollingerIndicators event ' + error)
      } else {
        // console.log('Event BollingerIndicators caught: ')
        // console.log(event)
        tBollingerIndicators = performance.now()
        // console.log('tBollingerIndicators ', tBollingerIndicators)
        const currentPrice = event.returnValues.currentPrice
        const upperBollingerBand = event.returnValues.upperBollingerBand
        const lowerBollingerBand = event.returnValues.lowerBollingerBand
        // console.log('currentPrice ' + currentPrice)
        // console.log('upperBollingerBand ' + upperBollingerBand)
        // console.log('lowerBollingerBand ' + lowerBollingerBand)

        if (currentPrice > (upperBollingerBand / 100) * (100 - upperBoundPercentage)) {
          console.log("Selling token1");
          callProofApi('sell-proof', currentPrice, upperBollingerBand, upperBoundPercentage).then(res => {
            tProofGenEnded = performance.now()
            
            const body = JSON.parse(res)
            botContract.methods.trade(body.a, body.b, body.c, body.inputs, 0).send({from: account, gas: 800000, gasPrice: "10000000000"})
            .on('receipt', function(receipt) {
              // console.log('Trade receipt: ')
              // console.log(receipt)
              var tTradeEnded = performance.now()
              // console.log('tTradeEnded ', tTradeEnded)
              gasUsed += receipt.gasUsed
              web3.eth.getBalance(account).then(res => {
                var finalBalance = res
                var deltaBalance = (initialBalance - finalBalance)
                // console.log("Total WEI used for trading " + deltaBalance)
                var deltaTotalTime = (tTradeEnded - t0)
                var deltaTradingTime = (tTradeEnded - tProofGenEnded)
                var deltaProofGenTime = (tProofGenEnded - tProofGenStarted)
                var deltaGetIndicators = (tBollingerIndicators - t0)
                var deltaProofVerifTime = (tProofVerified - tProofGenEnded)
                // console.log("Trading took " + deltaTotalTime + " milliseconds.")
                // console.log("Total gas used: ", gasUsed)
                callPerformanceApi(deltaBalance, deltaGetIndicators, deltaProofGenTime, deltaProofVerifTime , deltaTradingTime, deltaTotalTime, gasUsed).then(()=> {
                  performanceRunCounter += 1
                  trade(numOfPeriods, periodLength)
                })
              });
            })
          })
          
          //await botContract.methods.trade()
       } else if (currentPrice < (lowerBollingerBand / 100) * (100 + lowerBoundPercentage)) {
          // console.log("Buying token1");
          callProofApi('buy-proof', currentPrice, upperBollingerBand, upperBoundPercentage).then(res => {
            tProofGenEnded = performance.now()
            const body = JSON.parse(res)
            botContract.methods.trade(body.a, body.b, body.c, body.inputs, 1).send({from: account, gas: 800000, gasPrice: "10000000000"})
            .on('receipt', function(receipt) {
              // console.log('Trade receipt: ')
              // console.log(receipt)
              var tTradeEnded = performance.now()
              gasUsed += receipt.gasUsed
              web3.eth.getBalance(account).then(res => {
              var finalBalance = res
              var deltaBalance = (initialBalance - finalBalance)
              // console.log("Total WEI used for trading " + deltaBalance)
              var deltaTotalTime = (tTradeEnded - t0)
              var deltaTradingTime = (tTradeEnded - tProofGenEnded)
              var deltaProofGenTime = (tProofGenEnded - tProofGenStarted)
              var deltaGetIndicators = (tBollingerIndicators - t0)
              // console.log("Trading took " + deltaTotalTime + " milliseconds.")
              // console.log("Total gas used: ", gasUsed)
              callPerformanceApi(deltaBalance, deltaGetIndicators, deltaProofGenTime, deltaTradingTime, deltaTotalTime, gasUsed).then(()=> {
                performanceRunCounter += 1
                trade(numOfPeriods, periodLength)
              })
            });
            
            })
          })
       }
      // else: Hold

      }
    })
  
    await botContract.methods.calculateIndicators(numOfPeriods, periodLength).send({from: account, gas: 800000, gasPrice: "10000000000"})
    .on('receipt', function(receipt) {
      // console.log('calculateIndicators receipt: ')
      // console.log(receipt)
      gasUsed += receipt.gasUsed
      // console.log('gasUsed after calculateIndicators ', gasUsed)
    })
    }
    
  }

  return (
    <div className="container">
      <h1>Hello, Admin!</h1>
      <p>Your account: {account}</p>
      <button onClick={()=>getCurrentPrice()}>Get the current price</button>
      <button onClick={()=>test()}>Test</button>
      <button onClick={()=>trade(20, 1800)}>Trade</button>
      <button onClick={()=>deversifiBuyOrder()}>Buy</button>
      <button onClick={()=>registerDeversifi()}>Register</button>
    </div>
  );
}

export default App;