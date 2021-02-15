let MAINURL = 'https://bsc-dataseed.binance.org'; // MAINNET
let TESTURL = 'https://data-seed-prebsc-1-s1.binance.org:8545'; // TESTNET
//let TESTURL = 'https://testnet-dex.binance.org/'; // TESTNET?
let TESTEXP = 'https://testnet.bscscan.com';
let MAINEXP = 'https://bscscan.com';

let Binance = {
	neturl    : TESTURL,
	explorer  : TESTEXP,
	network   : 'bsc-testnet',
	chainId   : 97,
	accounts  : null,
	myaccount : null
}

var bsc;
var web3;

function hex(num) { return '0x'+(num).toString(16); }

async function initWallet() {
    console.log('Wallet starting...')
    if (window.BinanceChain) {
    	console.log('window.binance')
	 	bsc = window.BinanceChain;
		//$('flipper').checked = (bsc.chainId == 56);
	 	setListeners();
	 	//setNetwork();
	 	loadWallet();
    } else {
    	console.log('BinanceChain not available')
    }
}

function setListeners() {
	bsc.on('connect', onConnect);
	bsc.on('disconnect', onDisconnect);
	bsc.on('accountsChanged', onAccounts);
	bsc.on('chainChanged', onChain);
	bsc.on('message', onMessage);
	console.log('Listeners set');
}

async function setNetwork(chainId) {
	if(!chainId){ chainId = bsc.chainId; }
	Binance.mainnet  = (chainId == 56);
	Binance.network  = Binance.mainnet ? 'bsc-mainnet' : 'bsc-testnet';
	Binance.neturl   = Binance.mainnet ? MAINURL : TESTURL;
	Binance.explorer = Binance.mainnet ? MAINEXP : TESTEXP;
	Binance.chainId  = chainId;
	console.log('Network', Binance.network, Binance.chainId);
}

async function loadWallet() {
	console.log('Loading wallet...', Binance.network);
	web3 = new Web3(Binance.neturl);
	//web3.eth.getChainId().then(id => { console.log('ChainId', id) })
	//console.log('WEB3', web3);
	console.log('VER', web3.version)

    if (window.BinanceChain) {
    	//console.log('window.binance')
	 	//bsc = window.BinanceChain;
	 	if(bsc.isConnected()) { 
	 		console.log('Already connected to', bsc.chainId==0x38?'MAINNET':'TESTNET', bsc.chainId); 
			getAccounts();
			getAddress(getBalance);
	 	} else {
	 		console.log('Conecting...')
			bsc.enable().then((err, accts) => { 
				console.log('Enabled', err, accts)
				getAccounts();
				getAddress().then(adr=>{
					console.log('Passed1')
					getBalance(adr);
				});
			});
		}
    } else {
    	console.log('BinanceChain not available')
    }
}

// BinanceChain Events
async function onConnect(info) {
	console.log('onConnect', info);
	// info.chainId
	setNetwork(info.chainId);
	loadWallet();
}

async function onDisconnect(info) {
	console.log('onDisconnect', info)
	//
	console.log('Disconnected')
}

async function onAccounts(info) {
	console.log('onAccounts', info)
	Binance.accounts = info;
	Binance.myaccount = info[0];
	console.log('My account', Binance.myaccount);
	getBalance(Binance.myaccount);
}

async function onChain(chainId) {
	console.log('onChain', chainId)
	if(chainId==Binance.chainId) { console.log('Already on chain', chainId); return; }
	setNetwork(chainId);
	loadWallet();
	//requestAccount();
	//getAccounts();
}

async function onMessage(info) {
	console.log('onMessage', info)
}

/*
function requestAccount() {
    bsc.request({ method: 'eth_requestAccounts' }).then(onAccounts)
    .catch(err => {
      if (err.code === 4001) {
        console.log('User rejected');
        console.log('Please connect to Binance Wallet');
      } else {
        console.error('Connection error', err);
      }
    });
}
*/

// Methods
async function getAccounts() {
	bsc.requestAccounts().then(accts => {
		Binance.accounts = accts;
		console.log('Accounts', accts)
	}).catch(err => { 
		console.log('Error: User rejected'); 
		console.error(err) 
		//$('wallet').innerHTML = 'User rejected connection'; 
	});
}

async function getAddress(oncall) {
	console.log('Get accounts...');
	bsc.request({method: 'eth_requestAccounts'}).then(res=>{
		console.log('Account', res);
		Binance.myaccount = res[0];
		$('user-address').innerHTML = 'Address: '+Binance.myaccount.substr(0,10); 
		oncall(Binance.myaccount)
	}).catch(err => { 
		console.log('Error: Wallet not connected'); 
		console.error(err) 
		$('user-address').innerHTML = 'Wallet not connected'; 
		$('user-balance').innerHTML = 'Balance: 0.0000 BNB'; 
		oncall(null);
	});
}

async function getBalance(adr) {
	console.log('Get balance...');
	web3.eth.getBalance(adr, (err,res) => {
		console.log('Balance', adr.substr(0,8), res);
		let bal = (parseInt(res)/10**18).toLocaleString('en-US', { useGrouping: true, minimumFractionDigits: 4, maximumFractionDigits: 4});
		$('user-address').innerHTML = 'Address: '+adr.substr(0,10); 
    	$('user-balance').innerHTML = 'Balance: '+bal+' BNB';
	});
}

async function attachWallet(wallet, address, reject){
    console.log('Attach', wallet, address);
    if (!address) { address = Binance.myaccount; }
    console.log('-Address:', address);
    wallet.defaultSigner = address;
    wallet.signTransaction = async function(tx, ad, rj, x) {
    	//return new Promise(async (resolve, reject) => {
    	//	try { }

    	console.log('--Address:', address);
        //console.log('TX', tx);
        console.log('Artifacts', tx, ad, rj, x);
        try {
            tx.from = address;
            let res = await bsc.bnbSign(tx, reject);
            //let res = await bsc.bnbSign(tx, ad, rj, x);
            console.log('Tx signed:', res);
            return res;
        } catch (ex) {
            console.log('Error signing tx:', ex);
            if(reject) { reject(tx, ex); }
        }
        return tx;
    }
}

async function getGasPrice() {
    let gas = await web3.eth.getGasPrice();
    console.log('Average gas price:', gas);
    return gas;
}

async function callContract(address) {
	console.log('Call', address)
	let abi = ForexABI.abi;
    let web = new Web3(window.web3.currentProvider);
	let ctr = new web.eth.Contract(abi, address);
    let gas = { gasPrice: 1000000000, gasLimit: 275000 };
	let res = await ctr.methods.getCollector().call(gas);
	console.log(res);
}

async function getPrice(address) {
	let abi = ForexABI.abi;
    let web = new Web3(window.web3.currentProvider);
	let ctr = new web.eth.Contract(abi, address);
    let gas = { gasPrice: 1000000000, gasLimit: 35000 };
	let res = await ctr.methods.getPrice().call(gas);
	let prc = res / 10**18;
	console.log('Price', prc, address)
	return prc;
}

async function tradeBuy(token, amount, accept, reject, confirm) {
	console.log('-- Buy token', token, amount)
	let abi = ForexABI.abi;
    //let web = new Web3(window.web3.currentProvider);
    let web = new Web3(Binance.neturl);
	let ctr = new web.eth.Contract(abi, token);
	let wei = amount * 10**18;
	let wex = '0x'+(BigInt(wei).toString(16));
	console.log('Wei', wei);
    try {
	    let data = ctr.methods.buy().encodeABI();
		let params = [
	  		{
			    from: Binance.myaccount,
			    to: token,
			    gas: hex(200000),
			    gasPrice: hex(20000000000),
			    value: wex,
			    data: data
			}
		];
		console.log('Params', params);

	  	//BinanceChain.on('error', function(error){ console.log('error', error); })
		//BinanceChain.on('transactionHash', function(transactionHash){ console.log('hash', transactionHash); })
		//BinanceChain.on('receipt', function(receipt){ console.log(receipt); })
		//BinanceChain.on('confirmation', function(confirmationNumber, receipt){ console.log('conf', confirmationNumber, receipt) })
		BinanceChain.request({ method: 'eth_sendTransaction', params }).then((result) => {
	    	console.log('Result', result);
    		//inf = { tx: result };
	    	accept(result);
	    	waitForReceipt(result, confirm);
	    	return;
		}).catch((error) => {
	    	console.log('Error', error);
    		//inf = { error: error.error };
    		reject(error.error);
    		return;
	  	});
    } catch(ex) {
    	console.log('Contract Error', ex)
		reject(ex.message);
    }
}

async function tradeSell(token, amount, accept, reject, confirm) {
	console.log('-- Sell token', token, amount)
	let abi = ForexABI.abi;
    //let web = new Web3(window.web3.currentProvider);
    let web = new Web3(Binance.neturl);
	let ctr = new web.eth.Contract(abi, token);
	let wei = BigInt(amount * 10**18).toString();
	console.log('Wei', wei);
    try {
	    let data = ctr.methods.sell(wei).encodeABI();
		let params = [
	  		{
			    from: Binance.myaccount,
			    to: token,
			    gas: hex(200000),
			    gasPrice: hex(20000000000),
			    value: hex(0),
			    data: data
			}
		];
		console.log('Params', params);

		// Calc gas
	    //let gax = await ctr.methods.sell(wei).estimateGas(params);
		//let gas = await calcGas(gax, web);
		//console.log('cash GAS', gas);
		//params.gasPrice = hex(gas.gasPrice);
		//params.gas      = hex(gas.gasLimit);

		BinanceChain.request({ method: 'eth_sendTransaction', params }).then((result) => {
	    	console.log('Result', result);
    		//inf = { tx: result };
	    	accept(result);
	    	waitForReceipt(result, confirm);
	    	return;
		}).catch((error) => {
	    	console.log('Error', error);
    		//inf = { error: error.error };
    		reject(error.error);
    		return;
	  	});
    } catch(ex) {
    	console.log('Contract Error', ex)
		reject(ex.message);
    }
}

function waitForReceipt(hash, callback, n=0) {
	web3.eth.getTransactionReceipt(hash, function (err, receipt) {
		console.log('Receipt', receipt, err);
	    if (err) { console.log('Confirmation error', err); return; }
	    if (receipt !== null) {
	        if (callback) { callback(receipt.transactionHash); }
	    } else {
	    	if(n>5){ console.log('Confirmation timeout'); }
	        else { setTimeout(function(){ waitForReceipt(hash, callback, n++); }, 2000); }
	    }
	});
}

async function switchNetwork(chainName) {
	//chainId = $('flipper').checked ? 56 : 97;
	//chainName = $('flipper').checked ? 'bsc-mainnet' : 'bsc-testnet';
	window.BinanceChain.switchNetwork(chainName).then(info=>{
		console.log('Switch', info);
		//chainId = info.networkId == 'bsc-mainnet' ? 56 : 97;
		//setNetwork(chainId);
		//loadWallet();
	}).catch(err=>{ 
		//console.log(err);
		console.log(err.error); 
	});
}

/*
function onWallet() {
	console.log('On wallet');
	if(bsc.isConnected()) {
		console.log('Logout');
		bsc.enable(); // ???
	} else {
		console.log('Enable');
		bsc.enable();
	}
}
*/

async function calcGas(numx, web) {
	let gas = { gasPrice: 20000000000, gasLimit: 25000 };
	let prc = 20000000000;
	if(web){ prc = await web.eth.getGasPrice(); console.log('Gas Price', prc); }
	let est = parseInt(numx, 16);
	let lmt = parseInt(est * 1.15);
	gas.gasPrice = parseInt(prc);
	gas.gasLimit = lmt;
	console.log(gas);
	return gas;
}


// END