import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import './App.css'
import { ABI, CONTRACT_ADDRESS } from './config'


function App(props) {
  const [account, setAccount] = useState(null);
  const [subscribedUser, setSubscribedUser] = useState();
  const [contract, setContract] = useState(null);


  // load blockchain data in initial render
  useEffect(async () => {
    const web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"));
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);
    const ethContract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
    console.log(ethContract);
    setContract(ethContract);
  }, []);

  useEffect(() => {
    if (contract === null || account === null) return;

    const subscribeUser = async (user) => {
      const subUser = await contract.methods.subscribeUser(user).send({ from: account })
        .on('receipt', function (receipt) {
          // receipt example
          console.log(receipt)
        })
      setSubscribedUser(subUser);
    }

    contract.events.UserSubscribed({}, (error, event) => {
      console.log(event)
      if (error) {
        console.log('Could not get event ' + error)
      } else {
        subscribeUser(event.returnValues.subscriberAddress)
        console.log('Event caught: ' + event.event)
      }
    })
  }, [contract, account])

  return (
    <div className="container">
      <h1>Hello, Admin!</h1>
      <p>Your account: {account}</p>
      
    </div>
  );
}

export default App;