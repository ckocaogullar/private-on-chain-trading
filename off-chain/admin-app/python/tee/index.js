// ledger = require('@ledgerhq/hw-transport-node-hid')
DVF = require('dvf-client-js')

const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')


const privateKey = 'bc6d600f6bf2a5ad83377dd8743e5fe30b14064ea8e082f3a83ee704cca0cfc0'
const rpcUrl = "https://eth-ropsten.alchemyapi.io/v2/fBCbSZh46WyftFgzBU-a8_tIgCCxEL22"

const provider = new HDWalletProvider(privateKey, rpcUrl)
const web3 = new Web3(provider)

const starkPrivateKey = '743a0ff439f6ed52ed1fef395d6cea58af02088c91528b07048cc5f922d3f65'

const dvfConfig = {
    api: 'https://api.stg.deversifi.com',
    wallet: {
        type: 'tradingKey',
        meta: {
        starkPrivateKey
        }
    }
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

async function deversifiBuySellOrder(price, amount) {
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
    console.log('lets get dvf')
    const dvf = await DVF(web3, dvfConfig);

    // const metaData = await require('dvf-client-js/src/lib/dvf/createOrderMetadata')(dvf, params)
    // console.log('Order metadata', metaData)

    // Buy order placing
    const rOrder = await dvf.submitOrder(params)
    console.info('Order receipt', JSON.stringify(rOrder))
}

console.log('Hello world')

// const myArgs = process.argv.slice(2);
// if (myArgs[0] == 'register'){
//     registerDeversifi()
// } else {
//     deversifiBuySellOrder(parseInt(myArgs[0]), parseFloat(myArgs[1]))
// }


// "dependencies": {
//     "@ledgerhq/hw-transport-node-hid": "^6.24.1",
//     "@truffle/hdwallet-provider": "^2.0.4",
//     "dvf-client-js": "^3.1.4",
//     "ledgerhq": "0.0.1-security",
//     "net": "^1.0.2",
//     "tls": "0.0.1",
//     "truffle": "^5.5.5",
//     "zlib": "^1.0.5"
//   }
