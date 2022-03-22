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

    const dvf = await DVF(web3, dvfConfig);

    // Buy order placing
    const rOrder = await dvf.submitOrder(params)
    console.info('order receipt', JSON.stringify(rOrder))
}