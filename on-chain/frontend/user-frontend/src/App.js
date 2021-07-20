import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import './App.css'
import { ABI, CONTRACT_ADDRESS } from './config'

function App(props){
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [subscribedUser, setSubscribedUser] = useState();

  // load blockchain data in initial render
  useEffect(async () => {
    const web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"));
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[1]);
    const ethContract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
    console.log(ethContract);
    setContract(ethContract);
  }, []);

  useEffect(() => {
    if (contract === null || account === null) return;

    contract.events.SubscriptionConfirmed({}, (error, event) => {
      console.log(event)
      if (error) {
        console.log('Could not get event ' + error)
      } else {
        console.log('Event caught: ' + event.event)
      }
    })
  }, [contract, account])

      const requestSubscription = async (user) => {
      const subUser = await contract.methods.requestSubscription().send({ from: account })
        .on('receipt', function (receipt) {
          // receipt example
          console.log(receipt)
        })
      setSubscribedUser(subUser);
    }

    return (
      <div className="container">
        <h1>Hello, User!</h1>
        <p>Your account: {account}</p>
        <button onClick={() => requestSubscription(account)}>Request Subscription</button>
      </div>
    );

}
export default App;