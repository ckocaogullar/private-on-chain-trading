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
  const [verifierContract, setVerifierContract] = useState(null);


  // load blockchain data in initial render
  useEffect(async () => {
    const web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"));
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);
    const botContract = new web3.eth.Contract(BOT_ABI, BOT_CONTRACT_ADDRESS);
    console.log(botContract);
    setBotContract(botContract);
    const verifierContract = new web3.eth.Contract(VERIFIER_ABI, VERIFIER_CONTRACT_ADDRESS);
    console.log(verifierContract);
    setVerifierContract(verifierContract);
  }, []);

  useEffect(() => {
    if (botContract === null || account === null) return;
    const subscribeUser = async (user) => {
      const subUser = await botContract.methods.subscribeUser(user).send({ from: account })
        .on('receipt', function (receipt) {
          console.log(receipt)
        })
      setSubscribedUser(subUser);
    }

    botContract.events.UserSubscribed({}, (error, event) => {
      console.log(event)
      if (error) {
        console.log('Could not get event ' + error)
      } else {
        subscribeUser(event.returnValues.subscriberAddress)
        console.log('Event caught: ' + event.event)
      }
    })
  }, [botContract, account])

  const testVerification = async (path) => {
    //const proof = JSON.parse(fs.readFileSync("proof.json"))
    await verifierContract.methods.verifyTx(proof.proof.a, proof.proof.b, proof.proof.c, proof.inputs).send({ from: account })
    .on('receipt', function (receipt) {
      console.log(receipt)
    })

  }

  return (
    <div className="container">
      <h1>Hello, Admin!</h1>
      <p>Your account: {account}</p>
      <button onClick={()=>testVerification()}>Test the verification</button>
    </div>
  );
}

export default App;