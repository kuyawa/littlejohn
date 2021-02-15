//REF: https://github.com/bandprotocol/bandchain.js/blob/master/src/BandChain.js#L223
let { Client } = require("@bandprotocol/bandchain.js");
let WEB3  = require('web3');
let web3  = new WEB3(process.env.NETURL);  // https://data-seed-prebsc-1-s1.binance.org:8545
//let web3  = new WEB3('https://bsc-dataseed.binance.org/'); // Mainnet
let fetch = require('node-fetch');
let db    = require('./database');
let Forex = require("./public/contracts/forex.json");
let pky   = process.env.MANAGER;
let act   = web3.eth.accounts.privateKeyToAccount(pky);
let mgr   = act.address;
web3.eth.accounts.wallet.add(act);
web3.eth.defaultAccount = mgr;

let tokens = {
    AUD: '0x65275d7d6Ba47E44f7163690cd7C91aE608177Dc',
    BRL: '0xA9AB46C8eE740b4A833e0FDC2d3875c5065F25fd',
    CAD: '0xD19527b8820e46D0B63F19A0D92A25C7FF1f7976',
    CHF: '0xb0D82b45efE94d122dc4DEE1E36ecC4EfF4072Ff',
    CNY: '0xE9867f79A87e33777B8C82A9fFaA8F1047B83247',
    EUR: '0x2ddd8bF596cfefE84584926a40D49eEfb8cb6a74',
    GBP: '0x7cDB80DDa34Aa315e45E38e07df719099ae4379F',
    HKD: '0x4d9c163BffFd0F0091922603433010a0F363746C',
    INR: '0x342CE2fB52Fb3962630E6226b9a94D1cEedF24E3',
    JPY: '0xbFcbf3260e9198e0CFD153F1E353D4b9B1477c78',
    KRW: '0xE4AE08CbCed660C1a2a6522187aaEd22131CFcf8',
    RUB: '0x0B416A47bC4d5718CF9925Fc3712e9e98940246a',
    USD: '0x20f0ed2cCFa648C0c784f0A00E2408A7c3393fc2'
};


function calcGas(numx) {
    let gas = { gasPrice: 20000000000, gasLimit: 25000 };
    let est = parseInt(numx, 16);
    let lmt = parseInt(est * 1.15);
    gas.gasLimit = lmt;
    //console.log(gas);
    return gas;
}

function getDate(t){ 
    //return (new Date(t*1000)).toJSON();
    let d = new Date(t*1000);
    let j = d.toJSON() //d.toLocaleString();
    let x = j.substr(11,8);
    let h = x.substr(0,2)*1-4;
    if(h<0) { h = 24-h; }
    let z = x.substr(2);
    let y = h>12 ? h-12 : h;
    return y+z;
}

async function setPrice(tkn, adr, price) {
    //console.log('-- Price', tkn, adr, price);
    if(!price){ console.log(tkn, 'No price'); return; }
    //let inf = {};
    try {
        let wei = BigInt(price * 10 ** 18).toString();
        //console.log('Wei', wei);
        let ctr = new web3.eth.Contract(Forex.abi, adr);
        //let rex = await ctr.methods.setPrice(wei).estimateGas();
        //let gas = calcGas(rex);
        //gas.from = mgr;
        let gas = { gasPrice: 20000000000, gasLimit: 230000, from: mgr };
        let res = await ctr.methods.setPrice(wei).send(gas);
        if(!res.status){ console.log('Tx failed'); return; }
        console.log(tkn, price, res.status, res.transactionHash);
        //inf = {symbol:tkn, price:price, status:res.status, hash:res.transactionHash};
    } catch(ex) {
        console.log(tkn, 'Error:', ex);
        //inf = {error:ex.message}
    }
    //return inf;
}

async function setPrices(prices){
    await setPrice('AUD', tokens.AUD, prices['USD/AUD']);
    await setPrice('BRL', tokens.BRL, prices['USD/BRL']);
    await setPrice('CAD', tokens.CAD, prices['USD/CAD']);
    await setPrice('CHF', tokens.CHF, prices['USD/CHF']);
    await setPrice('CNY', tokens.CNY, prices['USD/CNY']);
    await setPrice('EUR', tokens.EUR, prices['USD/EUR']);
    await setPrice('GBP', tokens.GBP, prices['USD/GBP']);
    await setPrice('HKD', tokens.HKD, prices['USD/HKD']);
    await setPrice('INR', tokens.INR, prices['USD/INR']);
    await setPrice('JPY', tokens.JPY, prices['USD/JPY']);
    await setPrice('KRW', tokens.KRW, prices['USD/KRW']);
    await setPrice('RUB', tokens.RUB, prices['USD/RUB']);
    await setPrice('USD', tokens.USD, prices['BNB/USD']);
}

async function fetchRates(){
    console.log(new Date(), 'Fetch rates')

    // BNB price
    let url = 'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT';
    let opt = {method: 'get'};
    let res = await fetch(url, opt);
    let bnb = await res.json();
    let prices = {};
    let data = [];
    data.push(['BNB/USD', bnb.price]);
    prices['BNB/USD'] = (1*bnb.price).toFixed(8);

    //const endpoint  = "https://poa-api.bandchain.org"; // MAINNET
    const endpoint  = "https://api-gm-lb.bandchain.org"; // MAINNET
    const bandchain = new Client(endpoint);
    const rates     = await bandchain.getReferenceData([
        "BTC/USD",
        "USD/AUD",
        "USD/BRL",
        "USD/CAD",
        "USD/CHF",
        "USD/CNY",
        "USD/EUR",
        "USD/GBP",
        "USD/HKD",
        "USD/INR",
        "USD/JPY",
        "USD/KRW",
        "USD/RUB",
        "XAG/USD",
        "XAU/USD"
    ]);

    //console.log(rates);
    for (var i = 0; i < rates.length; i++) {
        let x = rates[i];
        data.push([x.pair, x.rate.toFixed(8)]);
        if(x.pair.startsWith('USD')){
            prices[x.pair] = (x.rate * bnb.price).toFixed(8);
            //prices[x.pair] = (x.rate * bnb.price).toFixed(8);
        } else {
            prices[x.pair] = x.rate.toFixed(8);
        }
        //console.log(x.pair, x.rate.toFixed(8).padStart(18), getDate(x.updated.base), getDate(x.updated.quote));
    }

    let info = {data: data, prices: prices};
    console.log(info);
    return info;
}

async function getRates(){
    let info = await fetchRates();
    await db.saveRates(info.data);
    //await setPrices(info.prices);  // Update tokens
    // Call heroku apifetcher to set prices, cheap hosting don't like sockets
    let res = await fetch('https://apifetcher.herokuapp.com/binance/rates', {method: 'get'});
}

exports.fetchRates = fetchRates;
exports.getRates   = getRates;

//getRates();
//setPrice('USD', tokens.USD, '130.01950000')

// END