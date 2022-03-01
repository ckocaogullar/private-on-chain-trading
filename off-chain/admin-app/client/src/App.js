import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import './App.css'
import { BOT_ABI, BOT_CONTRACT_ADDRESS } from './bot_config'
import DVF from 'dvf-client-js'
const starkPrivateKey = '743a0ff439f6ed52ed1fef395d6cea58af02088c91528b07048cc5f922d3f65'
//var starkPrivateKey


const upperBoundPercentage = 100
const lowerBoundPercentage = 100

var performanceRunCounter = 0
const performanceRunThreshold = 10000

var tProofGenStarted = 0
var gasUsed = 0;
var gasUsedOnBot = 0;
var gasUsedOnVerification = 0;

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

  const callProofApi = async (currentPrice, upperBollingerBand, lowerBollingerBand, buy_sell_flag, boundPercentage) => {
    tProofGenStarted = performance.now()
    const response = await fetch('/api/proof', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: [currentPrice, upperBollingerBand, lowerBollingerBand, buy_sell_flag, boundPercentage] }),
    });
    const body = await response.text();
    return body
  };

  const callPerformanceApi = async (deltaBalance, deltaGetIndicators, deltaProofGenTime, deltaProofVerifTime ,deltaTradingTime, deltaTotalTime,  gasUsedOnBot, gasUsedOnVerification, gasUsed) => {
    const response = await fetch('/api/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: [deltaBalance, deltaGetIndicators, deltaProofGenTime, deltaProofVerifTime, deltaTradingTime, deltaTotalTime,  gasUsedOnBot, gasUsedOnVerification, gasUsed] }),
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

  const depositToDeversifi = async () => {
    const dvfConfig = {
      api: 'https://api.stg.deversifi.com',
      dataApi: 'https://api.stg.deversifi.com'
    }

    const dvf = await DVF(web3, dvfConfig)

    //const depositResponse = await dvf.deposit('ETH', 1, starkPrivateKey)
    const depositResponse = await dvf.depositV2({ token: 'ETH', amount: 5 })

    
    await waitForDepositCreditedOnChain(dvf, depositResponse)
    
  
    console.log(depositResponse)
  
  }


  const waitForDepositCreditedOnChain = async (dvf, deposit) => {
      console.log('waiting for deposit to be credited on chain...')
    
      while (true) {
        // TODO: add getDeposit to pub-api and client and use it here.
        const deposits = await dvf.getDeposits(deposit.token)
        console.log('deposits', deposits)
        console.log('deposit._id', deposit._id)
        if (deposits.find(d => d._id === deposit._id && d.status === 'ready')) {
          break
        }
      }
    
  }

  const getDeversifiBalance = async () => {
    const dvfConfig = {
      api: 'https://api.stg.deversifi.com',
      dataApi: 'https://api.stg.deversifi.com'
    }

    const dvf = await DVF(web3, dvfConfig)

    const getBalanceResponse = await dvf.getBalance()

    console.log(getBalanceResponse)
  
  }

  const withdrawFromDeversifi = async () => {

    const token = 'ETH'
    const amount = 0.1

    const dvfConfig = {
      api: 'https://api.stg.deversifi.com',
      dataApi: 'https://api.stg.deversifi.com'
    }

    const dvf = await DVF(web3, dvfConfig)

    const withdrawalResponse = await dvf.withdraw(
      token,
      amount,
      starkPrivateKey
    )

    console.log(withdrawalResponse)
  
  }

  // Buy/Sell token1 with token0 (negative amount for buy, positive amount for sell)
  const deversifiBuySellOrder = async (price, amount) => {
    if (price==0 || !price){
      console.log('price is ', price)
      price = 100000
    }

  // order buy params
  const params = {
    symbol: "ETH:USDC",
    amount: amount,
    price,
    starkPrivateKey
  }

  const dvfConfig = {
    api: 'https://api.stg.deversifi.com',
    wallet: {
      type: 'tradingKey',
      meta: {
        starkPrivateKey
      }
    }
  }

  const dvf = await DVF(web3, dvfConfig);

  // Buy order placing
  const rOrder = await dvf.submitOrder(params)
  console.info('order receipt', JSON.stringify(rOrder))
  }

  const registerDeversifi = async () => {

    const dvfConfig = {
      api: 'https://api.stg.deversifi.com',
      dataApi: 'https://api.stg.deversifi.com'
    }

    const dvf = await DVF(web3, dvfConfig)
    //starkPrivateKey = dvf.stark.createPrivateKey()
    
    const keyPair = await dvf.stark.createKeyPair(starkPrivateKey)
  
    const registerResponse = await dvf.register(keyPair.starkPublicKey)
    console.log(registerResponse)
    console.log('starkPrivateKey ')
    console.log(starkPrivateKey)
  }

  const callTradeFunc = async (proof) => {
    botContract.methods.trade(proof.proof.a, proof.proof.b, proof.proof.c, proof.inputs).send({from: account, gas: 800000, gasPrice: "10000000000"})
            .on('receipt', function(receipt) {
              console.log('trade receipt: ')
              console.log(receipt)
              gasUsed += receipt.gasUsed
              gasUsedOnVerification = receipt.gasUsed
            })
  }


  // Subscribe to the BollingerIndicators event
  // Call calculateIndicators function
  // Once you catch the BollingerIndicators event, make the if-else comparisons with your private parameters
  // Whichever signal it fits (buy or hold), use public and private parameters there to generate a proof accordingly

  const trade = async (numOfPeriods, periodLength) => {
    var currentPrice;
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
      console.log('All done.')
      performanceRunCounter = -1
      return
    } else {
    
    // console.log('t0 ', t0)
    var tBollingerIndicators = 0
    var tProofGenEnded = 0
    var tProofVerified = 0
    var tTradeEnded = 0
    var tTradeDecisionMade = 0
    var t0 = performance.now()
    //web3.eth.getBalance(account).then(res => {initialBalance = res});
    // console.log('initialBalance ', initialBalance)

      botSocket.once('ProofVerified', {}, (error, event) => {
      if (error) {
        // console.log('Could not get event ' + error)
      } else {
        tProofVerified = performance.now()
        // console.log('tProofVerified ', tProofVerified)
        console.log('ProofVerified Event caught: ')
        console.log(event)
        
        deversifiBuySellOrder(currentPrice, -0.05).then(res => {
          tTradeEnded = performance.now()
          // console.log("Total WEI used for trading " + deltaBalance)
          var deltaGetIndicators = (tBollingerIndicators - t0)
          var deltaMakeTradeDecision = (tTradeDecisionMade - tBollingerIndicators)
          var deltaProofGenTime = (tProofGenEnded - tProofGenStarted)
          var deltaProofVerifTime = (tProofVerified - tProofGenEnded)
          var deltaTradingTime = (tTradeEnded - tProofVerified)
          var deltaTotalTime = (tTradeEnded - t0)
          // while(gasUsedOnBot === 0 || gasUsedOnVerification === 0){
          //   setTimeout(function(){
          //     //do what you need here
          // }, 20);
          // }
          callPerformanceApi(deltaGetIndicators, deltaMakeTradeDecision, deltaProofGenTime, deltaProofVerifTime , deltaTradingTime, deltaTotalTime, gasUsedOnBot, gasUsedOnVerification, gasUsed)
      }
    ).then(()=> {
      console.log('tradeeeeeeeeeeee')
      performanceRunCounter += 1
      trade(numOfPeriods, periodLength)
  })
  
  }})
    
    botSocket.once('BollingerIndicators', {}, (error, event) => {
      if (error) {
        // console.log('Could not get BollingerIndicators event ' + error)
      } else {
        console.log('Event BollingerIndicators caught: ')
        console.log(event)
        tBollingerIndicators = performance.now()
        // console.log('tBollingerIndicators ', tBollingerIndicators)
        currentPrice = event.returnValues.currentPrice
        const upperBollingerBand = event.returnValues.upperBollingerBand
        const lowerBollingerBand = event.returnValues.lowerBollingerBand
        console.log('currentPrice ' + currentPrice)
        console.log('upperBollingerBand ' + upperBollingerBand)
        console.log('lowerBollingerBand ' + lowerBollingerBand)
        var buy_sell_flag = -1
        var boundPercentage = null
        // Give Buy or Sell decision
        if (currentPrice > (upperBollingerBand / 100) * (100 - upperBoundPercentage)) {
          // console.log("Selling token1");
          // console.log("currentPrice: ", currentPrice);
          // console.log("upperBollingerBand: ", upperBollingerBand);
          // console.log("upperBoundPercentage: ", upperBoundPercentage);
          boundPercentage = upperBoundPercentage
          buy_sell_flag = 0
        } else if (currentPrice <= (lowerBollingerBand / 100) * (100 + lowerBoundPercentage)) {
          // console.log("Buying token1");
          // console.log("currentPrice: ", currentPrice);
          // console.log("lowerBollingerBand: ", lowerBollingerBand);
          // console.log("lowerBoundPercentage: ", lowerBoundPercentage);
          boundPercentage = lowerBoundPercentage
          buy_sell_flag = 1
        }
        tTradeDecisionMade = performance.now()
        // If a Buy or Sell decision is made, create proof and send on-chain
        if (buy_sell_flag >= 0){
          callProofApi(currentPrice, upperBollingerBand, lowerBollingerBand, buy_sell_flag, boundPercentage).then(res => {
            tProofGenEnded = performance.now()
            //console.log(res)
            const proof = JSON.parse(res).proof
            botContract.methods.trade(proof.proof.a, proof.proof.b, proof.proof.c, proof.inputs).send({from: account, gas: 800000, gasPrice: "10000000000"})
            .on('receipt', function(receipt) {
              console.log('trade receipt: ')
              console.log(receipt)
              gasUsed += receipt.gasUsed
              gasUsedOnVerification = receipt.gasUsed
              console.log('Lets see')
            })
          })
        }
      }
    })
  
    await botContract.methods.calculateIndicators(numOfPeriods, periodLength).send({from: account, gas: 800000, gasPrice: "10000000000"}).on('receipt', function(receipt) {
      console.log('calculateIndicators receipt: ')
      console.log(receipt)
      gasUsed += receipt.gasUsed
      gasUsedOnBot = receipt.gasUsed
      // console.log('gasUsed after calculateIndicators ', gasUsed)
    })
    
  }}

  return (
    <div className="container">
      <h1>Hello, Admin!</h1>
      <p>Your account: {account}</p>
      <button onClick={()=>getCurrentPrice()}>Get current ETH:USDC price on Uniswap</button>
      <button onClick={()=>trade(20, 1800)}>Trigger On-Chain Trading</button>
      <button onClick={()=>registerDeversifi()}>Register to Deversifi</button>
      <button onClick={()=>depositToDeversifi()}>Deposit to Deversifi</button>
      <button onClick={()=>withdrawFromDeversifi()}>Withdraw from Deversifi</button>
      <button onClick={()=>getDeversifiBalance()}>Get Deversifi Balance</button>
      <button onClick={()=>deversifiBuySellOrder(20000000, -1)}>Buy USDC on Deversifi</button>
    </div>
  );
}

export default App;