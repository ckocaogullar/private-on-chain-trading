import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import './App.css'
import { BOT_ABI, BOT_CONTRACT_ADDRESS } from './bot_config'
import { VERIFIER_ABI, VERIFIER_CONTRACT_ADDRESS } from './verifier_config'
import proof from './proof.json';


function App(props) {
  const [account, setAccount] = useState(null);
  const [subscribedUser, setSubscribedUser] = useState();
  const [botContract, setBotContract] = useState(null);
  const [botSocket, setBotSocket] = useState(null);
  const [verifierContract, setVerifierContract] = useState(null);
  const [web3Socket, setWeb3Socket] = useState();
  const [web3, setWeb3] = useState();
  // load blockchain data in initial render
  useEffect(async () => {
    // Modern dapp browsers...
    callApi()
      .then(res => console.log(res))
      .catch(err => console.log(err));
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        // Create two connections: one using HTTPS (for calling methods), the other using WebSocket (for subscribing to events)
        const web3 = new Web3(window.web3.currentProvider);
        setWeb3(web3)
        const web3Socket = new Web3("wss://eth-ropsten.alchemyapi.io/v2/fBCbSZh46WyftFgzBU-a8_tIgCCxEL22");
        setWeb3Socket(web3Socket)
        

        // Load the contract using both HTTPS and WebSocket connections
        const botContract = new web3.eth.Contract(BOT_ABI, BOT_CONTRACT_ADDRESS);
        console.log(botContract);
        setBotContract(botContract);
        const botSocket = new web3.eth.Contract(BOT_ABI, BOT_CONTRACT_ADDRESS);
        console.log(botSocket);
        setBotSocket(botSocket)
        const verifierContract = new web3.eth.Contract(VERIFIER_ABI, VERIFIER_CONTRACT_ADDRESS);
        console.log(verifierContract);
        setVerifierContract(verifierContract);

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

  const callApi = async () => {
    const response = await fetch('/api/hello');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    
    return body;
  };

  const testVerification = async () => {
    await verifierContract.methods.verifyTx(proof.proof.a, proof.proof.b, proof.proof.c, proof.inputs).send({ from: account })
    .on('receipt', function (receipt) {
      console.log(receipt)
    })
  }

  const getCurrentPrice = async () => {
    await botContract.methods.getCurrentPrice().send({from: account})
    .on('receipt', function (receipt) {
      console.log(receipt)
    })
  }

  const getBollinger = async (numOfPeriods, periodLength) => {
    await botContract.methods.bollinger(numOfPeriods, periodLength).send({from: account})
    .on('receipt', function (receipt) {
      console.log(receipt)
    })
  }

  const test = async () => {
    botSocket.events.TestEvent({}, (error, event) => {
      if (error) {
        console.log('Could not get event ' + error)
      } else {
        console.log('Event caught: ' + event.event)
        testVerificationContract()
      }
    })

    await botContract.methods.test().send({from: account})
    .on('receipt', function (receipt) {
      console.log('Test receipt:')
      console.log(receipt)
    })
  }

  const testVerificationContract = async () => {
    botSocket.events.ProofVerified({}, (error,event) => {
      if (error) {
        console.log('Could not get event ' + error)
      } else {
        console.log('Event caught: ' + event.event)
      }
    })
    await botContract.methods.trade(proof.proof.a, proof.proof.b, proof.proof.c, proof.inputs).send({from:account})
    .on('receipt', function(receipt) {
      console.log('Trade receipt:')
      console.log(receipt)
    })
  }

  // Subscribe to the BollingerIndicators event
  // Call calculateIndicators function
  // Once you catch the BollingerIndicators event, make the if-else comparisons with your private parameters
  // Whichever signal it fits (buy or hold), use public and private parameters there to generate a proof accordingly

  return (
    <div className="container">
      <h1>Hello, Admin!</h1>
      <p>Your account: {account}</p>
      <button onClick={()=>testVerification()}>Test the verification</button>
      <button onClick={()=>getCurrentPrice()}>Get the current price</button>
      <button onClick={()=>getBollinger(10, 300)}>Get the Bollinger</button>
      <button onClick={()=>test()}>Test</button>
    </div>
  );
}

export default App;