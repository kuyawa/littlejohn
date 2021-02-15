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
    	console.log('Binance wallet!')
	 	Binance.wallet = window.BinanceChain;
		//$('flipper').checked = (Binance.wallet.chainId == 56);
	 	setListeners();
	 	//setNetwork();
	 	loadWallet();
	} else if(window.ethereum && window.ethereum.isMetaMask){
    	console.log('Metamask!');
    	Binance.wallet = window.ethereum;
    	//window.ethereum.enable();
	 	setListeners();
	 	//setNetwork();
	 	loadWallet();
	} else {
    	console.log('Binance Wallet not available')
    }
}

function setListeners() {
	Binance.wallet.on('connect', onConnect);
	Binance.wallet.on('disconnect', onDisconnect);
	Binance.wallet.on('accountsChanged', onAccounts);
	Binance.wallet.on('chainChanged', onChain);
	Binance.wallet.on('message', onMessage);
	console.log('Listeners set');
}

async function setNetwork(chainId) {
	if(!chainId){ chainId = Binance.wallet.chainId; }
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

    if (Binance.wallet) {
	 	if(Binance.wallet.isConnected()) { 
	 		console.log('Already connected to', Binance.wallet.chainId==0x38?'MAINNET':'TESTNET', Binance.wallet.chainId); 
			getAccounts();
			getAddress(getBalance);
	 	} else {
	 		console.log('Conecting...')
			Binance.wallet.enable().then((err, accts) => { 
				console.log('Enabled', err, accts)
				getAccounts();
				getAddress().then(adr=>{
					console.log('Passed1')
					getBalance(adr);
				});
			});
		}
    } else {
    	console.log('Binance Wallet not available')
    }
}

// BinanceChain Events
async function onConnect(info) {
	console.log('onConnect', info);
	// info.chainId
	setNetwork(info.chainId);
	//loadWallet();
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

// Methods
async function getAccounts() {
	Binance.wallet.request({method: 'eth_requestAccounts'}).then(accts=>{
		Binance.accounts = accts;
		console.log('Accounts', accts)
	}).catch(err => { 
		console.log('Error: User rejected'); 
		console.error(err) 
		//$('wallet').innerHTML = 'User rejected connection'; 
	});
}

async function getAddress(callback) {
	if(Binance.isMetamask){
		Binance.myaccount = Binance.wallet.selectedAddress;
		console.log('Account', Binance.myaccount);
		$('user-address').innerHTML = 'Address: '+Binance.myaccount.substr(0,10); 
		callback(Binance.myaccount);
	} else {
		console.log('Get accounts...');
		Binance.wallet.request({method: 'eth_requestAccounts'}).then(res=>{
			console.log('Account', res);
			Binance.myaccount = res[0];
			$('user-address').innerHTML = 'Address: '+Binance.myaccount.substr(0,10); 
			callback(Binance.myaccount)
		}).catch(err => { 
			console.log('Error: Wallet not connected'); 
			console.error(err) 
			$('user-address').innerHTML = 'Wallet not connected'; 
			$('user-balance').innerHTML = 'Balance: 0.0000 BNB'; 
			callback(null);
		});
	}
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
    //let web = new Web3(Binance.neturl);
	let ctr = new web3.eth.Contract(abi, token);
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

		Binance.wallet.request({ method: 'eth_sendTransaction', params }).then((result) => {
	    	console.log('Result', result);
    		//inf = { tx: result };
	    	accept(result);
	    	waitForReceipt(result, confirm);
	    	return;
		}).catch((error) => {
	    	console.log('Error', error);
    		//inf = { error: error.error };
    		let msg = '';
    		if(error.message){ 
    			if(error.message.indexOf(':')>0) { msg=error.message.split(':')[1]; } 
    			else { nsg = error.msg; }
    		} else if(error.error){ msg = error.error; }
    		else { msg = 'Unknown error'; }
    		reject(msg);
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
    //let web = new Web3(Binance.neturl);
	let ctr = new web3.eth.Contract(abi, token);
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

		Binance.wallet.request({ method: 'eth_sendTransaction', params }).then((result) => {
	    	console.log('Result', result);
    		//inf = { tx: result };
	    	accept(result);
	    	waitForReceipt(result, confirm);
	    	return;
		}).catch((error) => {
	    	console.log('Error', error);
    		//inf = { error: error.error };
    		let msg = '';
    		if(error.message){ 
    			if(error.message.indexOf(':')>0) { msg=error.message.split(':')[1]; } 
    			else { nsg = error.msg; }
    		} else if(error.error){ msg = error.error; }
    		else { msg = 'Unknown error'; }
    		reject(msg);
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