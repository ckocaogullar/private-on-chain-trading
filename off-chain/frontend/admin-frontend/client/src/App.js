import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import './App.css'
import { BOT_ABI, BOT_CONTRACT_ADDRESS } from './bot_config'
import { BUY_VERIFIER_ABI, BUY_VERIFIER_CONTRACT_ADDRESS, SELL_VERIFIER_ABI, SELL_VERIFIER_CONTRACT_ADDRESS } from './verifier_config'
import proof from './proof.json'

const upperBoundPercentage = 100
const lowerBoundPercentage = 100


function App(props) {
  const [account, setAccount] = useState(null);
  const [subscribedUser, setSubscribedUser] = useState();
  const [botContract, setBotContract] = useState(null);
  const [botSocket, setBotSocket] = useState(null);
  const [buyVerifierContract, setBuyVerifierContract] = useState(null);
  const [sellVerifierContract, setSellVerifierContract] = useState(null);
  const [web3Socket, setWeb3Socket] = useState();
  const [web3, setWeb3] = useState();
  // load blockchain data in initial render
  useEffect(async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        // Create two connections: one using HTTPS (for calling methods), the other using WebSocket (for subscribing to events)
        const web3 = new Web3('http://127.0.0.1:8545/');
        setWeb3(web3)
        const web3Socket = new Web3(new Web3.providers.WebsocketProvider("ws://127.0.0.1:8545/"));
        setWeb3Socket(web3Socket)

        // const web3 = new Web3(window.web3.currentProvider);
        // setWeb3(web3)
        // const web3Socket = new Web3("wss://eth-ropsten.alchemyapi.io/v2/fBCbSZh46WyftFgzBU-a8_tIgCCxEL22");
        // setWeb3Socket(web3Socket)
        

        // Load the contract using both HTTPS and WebSocket connections
        const botContract = new web3.eth.Contract(BOT_ABI, BOT_CONTRACT_ADDRESS);
        console.log(botContract);
        setBotContract(botContract);
        const botSocket = new web3Socket.eth.Contract(BOT_ABI, BOT_CONTRACT_ADDRESS);
        console.log(botSocket);
        setBotSocket(botSocket)
        const buyVerifierContract = new web3.eth.Contract(BUY_VERIFIER_ABI, BUY_VERIFIER_CONTRACT_ADDRESS);
        console.log(buyVerifierContract);
        setBuyVerifierContract(buyVerifierContract);
        const sellVerifierContract = new web3.eth.Contract(BUY_VERIFIER_ABI, BUY_VERIFIER_CONTRACT_ADDRESS);
        console.log(sellVerifierContract);
        setSellVerifierContract(sellVerifierContract);

        // Request account access if needed and get the accounts
        await window.ethereum.enable();
        const accounts = await web3.eth.getAccounts()
        setAccount(accounts[0])
        console.log('Im here')
        
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      window.web3 = new Web3(web3.currentProvider);
      console.log("You are using a legacy dapp browser. Please switch to a modern dapp browser, e.g. Brave")
    }
    // Non-dapp browsers...
    else {
      console.log("Non-Ethereum browser detected. You should consider trying MetaMask!");
    }

  }, []);

  useEffect(() => {
    if (account === null) {
      console.log('jumped here')
      return;
    }
    console.log('got the account: ', account)
    const subscribeUser = async (user) => {
      const subUser = await botContract.methods.subscribeUser(user).send({ from: account })
        .on('receipt', function (receipt) {
          console.log(receipt)
        })
      setSubscribedUser(subUser);
    }

    botSocket.events.UserSubscribed({}, (error, event) => {
      console.log(event)
      if (error) {
        console.log('Could not get event ' + error)
      } else {
        subscribeUser(event.returnValues.subscriberAddress)
        console.log('Event caught: ' + event.event)
      }
    })
  }, [account])

  const callApi = async (proofType, currentPrice, bollingerBand, percentageBound) => {
    console.log('Starting callApi')
    const response = await fetch('/api/proof', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: [proofType, currentPrice, bollingerBand, percentageBound] }),
    });
    const body = await response.text();
    console.log('callApi body: ', body)
    return body
  };


  const getCurrentPrice = async () => {
    await botContract.methods.getCurrentPrice().send({from: account})
    .on('receipt', function (receipt) {
      console.log(receipt)
    })
  }

  const getBollinger = async (numOfPeriods, periodLength) => {
    botSocket.events.BollingerIndicators({}, (error, event) => {
      if(error){
        console.log('Error catching event ' + error)
      } else {
        console.log('Here is the Bollinger event: ')
        console.log(event)
      }
    })

    await botContract.methods.bollinger(numOfPeriods, periodLength).send({from: account, gas: 1500000})
    .on('receipt', function (receipt) {
      console.log(receipt)
    })

    botContract.getPastEvents("allEvents", {fromBlock: 0, toBlock: "latest"})
    .then(console.log)  
  }

  const test = async () => {
    botSocket.events.TestEvent({}, (error, event) => {
      console.log(event)
      if (error) {
        console.log('Could not get event ' + error)
      } else {
        console.log('TestEvent caught: ')
        console.log(event)
      }
    })
    await botContract.methods.test().send({from: account, gas: 1500000})
    .on('receipt', function(receipt) {
      console.log('Public params receipt: ')
      console.log(receipt)
    })
  }

  const testTrade = async () => {
    const currentPrice = 10
    const upperBollingerBand = 10
    const upperBoundPercentage = 100
    const lowerBollingerBand = 10
    const lowerBoundPercentage = 100
    if (currentPrice > (upperBollingerBand / 100) * (100 - upperBoundPercentage)) {
      console.log("Selling token1");
      callApi('sell-proof', currentPrice, upperBollingerBand, upperBoundPercentage).then(res => {
        const body = JSON.parse(res)
        console.log('body')
        console.log(body)
        botContract.methods.trade(body.a, body.b, body.c, body.inputs, 0).send({from: account, gas: 1500000})
        .on('receipt', function(receipt) {
          console.log('trade receipt: ')
          console.log(receipt)
        })
      })
      
      //await botContract.methods.trade()
   } else if (currentPrice < (lowerBollingerBand / 100) * (100 + lowerBoundPercentage)) {
      console.log("Buying token1");
      //callApi('buy-proof', currentPrice, lowerBollingerBand, lowerBoundPercentage).then(res => {body = res})
   }
  }

  // Subscribe to the BollingerIndicators event
  // Call calculateIndicators function
  // Once you catch the BollingerIndicators event, make the if-else comparisons with your private parameters
  // Whichever signal it fits (buy or hold), use public and private parameters there to generate a proof accordingly

  const trade = async (numOfPeriods, periodLength) => {
    botSocket.events.TradeComplete({}, (error, event) => {
      console.log(event)
      if (error) {
        console.log('Could not get event ' + error)
      } else {
        console.log('TradeComplete Event caught: ', event)
      }
    })
    botSocket.events.ProofVerified({}, (error, event) => {
      console.log(event)
      if (error) {
        console.log('Could not get event ' + error)
      } else {
        console.log('ProofVerified Event caught: ', event)
      }
    })
    botSocket.events.BollingerIndicators({}, (error, event) => {
      if (error) {
        console.log('Could not get BollingerIndicators event ' + error)
      } else {
        console.log('Event BollingerIndicators caught: ')
        console.log(event)
        const currentPrice = event.returnValues.currentPrice
        const upperBollingerBand = event.returnValues.upperBollingerBand
        const lowerBollingerBand = event.returnValues.lowerBollingerBand
        console.log('currentPrice ' + currentPrice)
        console.log('upperBollingerBand ' + upperBollingerBand)
        console.log('lowerBollingerBand ' + lowerBollingerBand)
        var buySellFlag = 2 // Default value set to HOLD signal
        if (currentPrice > (upperBollingerBand / 100) * (100 - upperBoundPercentage)) {
          console.log("Selling token1");
          callApi('sell-proof', currentPrice, upperBollingerBand, upperBoundPercentage).then(res => {
            const body = JSON.parse(res)
            console.log('body')
            console.log(body)
            botContract.methods.trade(body.a, body.b, body.c, body.inputs, 0).send({from: account, gas: 1500000})
            .on('receipt', function(receipt) {
              console.log('trade receipt: ')
              console.log(receipt)
            })
          })
          
          //await botContract.methods.trade()
       } else if (currentPrice < (lowerBollingerBand / 100) * (100 + lowerBoundPercentage)) {
          console.log("Buying token1");
          //callApi('buy-proof', currentPrice, lowerBollingerBand, lowerBoundPercentage).then(res => {body = res})
          buySellFlag = 1
       }
      // else: Hold

      }
    })
    botSocket.events.TestEvent({}, (error, event) => {
      console.log(event)
      if (error) {
        console.log('Could not get event ' + error)
      } else {
        console.log('TestEvent caught: ')
        console.log(event)
      }
    })
    await botContract.methods.calculateIndicators(numOfPeriods, periodLength).send({from: account, gas: 1500000})
    .on('receipt', function(receipt) {
      console.log('calculateIndicators receipt: ')
      console.log(receipt)
    })
  }

  return (
    <div className="container">
      <h1>Hello, Admin!</h1>
      <p>Your account: {account}</p>
      <button onClick={()=>getCurrentPrice()}>Get the current price</button>
      <button onClick={()=>getBollinger(10, 300)}>Get the Bollinger</button>
      <button onClick={()=>test()}>Test</button>
      <button onClick={()=>testTrade()}>Test Trade</button>
      <button onClick={()=>trade(10, 300)}>Trade</button>
      <button onClick={()=>callApi('buy-proof')
      .then(res => console.log(res))
      .catch(err => console.log(err))}>Test Buy Proof</button>
      <button onClick={()=>callApi('sell-proof')
      .then(res => console.log(res))
      .catch(err => console.log(err))}>Test Sell Proof</button>
    </div>
  );
}

export default App;