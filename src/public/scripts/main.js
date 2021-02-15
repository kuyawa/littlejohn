// LittleJohn

var session = {
	bnbusd   : 0.0,
	pair     : 'BNB/USD',
	base     : 'BNB',
	quote    : 'USD',
	buy      : true,
	price    : 0.0,
	prices   : {},
	rates    : {},
	lines    : 0,
	wallet   : null,
	connected: false,
	isMobile : false
}

const tokens = {
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

function $(id){ return document.getElementById(id); }

function walletWarning() { $('user-address').innerHTML = 'Wallet not available'; }

function checkMobile(){ 
	session.isMobile = (document.body.clientWidth<=720); 
	return session.isMobile;
}

function validNumber(text='') {
    let number, value;
    //let sep = Intl.NumberFormat(navigator.language).format(1000).substr(1,1) || ',';
    let sep = ',';
    if(sep==','){ value = text.replace(/\,/g,''); }
    else if(sep=='.'){ value = text.replace(/\./g,'').replace(',','.'); }
    try { number = parseFloat(value) || 0.0; } catch(ex){ console.log(ex); number = 0.0; }
    return number;
}

async function getRates() {
	let res, inf;
	let url = '/api/rates';
	let opt = {method: 'get'};
	try	{
		res = await fetch(url, opt);
		inf = await res.json();
		console.log('Rates',inf);
		session.rates  = inf.data;
		session.bnbusd = session.rates['BNB/USD'].price || 0.0;
		$('bnbprice').innerHTML = 'BNB/USD: ' + parseFloat(session.bnbusd).toFixed(4);
		let code = 'USD';
		session.prices[code] = parseFloat(session.bnbusd).toFixed(4); // USD
		for(var sym in session.rates){
			if(sym.startsWith('USD/')){ code = sym.substr(4).toUpperCase(); } else { continue; }
			session.prices[code] = (session.rates[sym].price * session.bnbusd).toFixed(4);
		}
		console.log('Prices',session.prices);
	} catch(ex) {
		console.log('Error:', ex.message)
	}
}

async function showRates() {
	//$('bnbusd').innerHTML  = session.bnbusd;
	$('usd-bnb').innerHTML = parseFloat(session.rates['BNB/USD'].price).toFixed(4);
	$('usd-usd').innerHTML = '1.0000';
	for(var sym in session.rates){
		if(sym.startsWith('USD/')){ code = sym.substr(4).toLowerCase(); } else { continue; }
		$(code+'-bnb').innerHTML = (session.rates[sym].price * session.bnbusd).toFixed(4);
		$(code+'-usd').innerHTML = parseFloat(session.rates[sym].price).toFixed(4);
		$(code+'-pct').innerHTML = parseFloat(session.rates[sym].diff).toFixed(2)+'%';
		$(code+'-bnb').className = (parseFloat(session.rates[sym].diff)<0 ? 'price-dn' : 'price-up');
	}
}

function showIndices(info){
	if(!info){ return; }
	let open, close, high, low, spread, change;
	open  = 1*info[0][1];
	close = 1*info[info.length-1][1];
	high  = 0;
	low   = 999;
	for (var i = 0; i < info.length; i++) {
		high = Math.max(high, 1*info[i][1]);
		low  = Math.min(low,  1*info[i][1]);
	}
	spread = ((high / low) - 1) * 100;
	change = ((close / open) - 1) * 100;
	$('info-close').innerHTML  = close.toFixed(4);
	$('info-open').innerHTML   = open.toFixed(4);
	$('info-high').innerHTML   = high.toFixed(4);
	$('info-low').innerHTML    = low.toFixed(4);
	$('info-spread').innerHTML = spread.toFixed(4)+' %';
	$('info-change').innerHTML = change.toFixed(4)+' %';

	$('price-close').innerHTML  = close.toFixed(4);
	$('price-open').innerHTML   = open.toFixed(4);
	$('price-high').innerHTML   = high.toFixed(4);
	$('price-low').innerHTML    = low.toFixed(4);
}

async function updateForm() {
	$('calc-price').value      = parseFloat(session.price).toFixed(4);
	$('calc-title').innerHTML  = session.buy ? (session.base + ' for ' + session.quote) : (session.quote + ' for ' + session.base);
	$('label-base').innerHTML  = session.base;
	$('label-price').innerHTML = session.pair;
	$('label-quote').innerHTML = session.quote;
	$('info-market').innerHTML = session.pair;
	if(session.buy){ calcQuote() } else { calcBase() }
}

function calcBase() {
	let amount = validNumber($('calc-quote').value);
	let price  = $('calc-price').value;
	let total  = amount / price;
	$('calc-base').value = total.toFixed(4);
}

function calcQuote() {
	let amount = validNumber($('calc-base').value);
	let price  = $('calc-price').value;
	let total  = amount * price;
	$('calc-quote').value = total.toFixed(4);
}

function onTableClick(event) {
	var row  = event.target.parentNode;
	var code = row.id;
	if(!code) { return; }
	selectCurrency(code);
}

async function onTrade(){
	console.log('Trade', session.base, session.quote, session.buy?'BUY':'SELL', session.price);
	if(!session.connected){ showMessage('Connect your wallet first'); return; }
	if(session.buy){
		code = session.quote;
		buyTokens(code);
	} else {
		code = session.quote;
		sellTokens(code);
	}
}

async function buyTokens(code) {
	console.log('Buying', code);
	showMessage('Wait, trading...');
	let tkn = tokens[code];
	let amt = validNumber($('calc-base').value);
	let rej = function(msg) { console.log('Rejected', msg); showMessage(msg); };
	let acp = function(msg) { 
		console.log('Accepted', msg); 
		showMessage('Success <a href="https://testnet.bscscan.com/tx/'+msg+'" target="_blank">[Tx '+msg.substr(0,10)+']</a>'); 
	};
	let cnf = function(msg) { 
		console.log('Confirmed', msg); 
		showMessage('Confirmed <a href="https://testnet.bscscan.com/tx/'+msg+'" target="_blank">[Tx '+msg.substr(0,10)+']</a>'); 
		getBalance(Binance.myaccount);
	}
	let txid = await tradeBuy(tkn, amt, acp, rej, cnf);
	//console.log('txid', txid);
	//if(txid){
	//	console.log('Buy', code, txid);
	//	showMessage('Transaction confirmed!');
    //    getBalance(Binance.myaccount);
	//}
}

async function sellTokens(code) {
	console.log('Selling', code);
	showMessage('Wait, trading...');
	let tkn = tokens[code];
	let amt = validNumber($('calc-quote').value);
	let rej = function(msg) { console.log('Rejected', msg); showMessage(msg); };
	let acp = function(msg) { console.log('Accepted', msg); showMessage('Success <a href="https://testnet.bscscan.com/tx/'+msg+'" target="_blank">[Tx '+msg.substr(0,10)+']</a>'); };
	let cnf = function(msg) { 
		console.log('Confirmed', msg); 
		showMessage('Confirmed <a href="https://testnet.bscscan.com/tx/'+msg+'" target="_blank">[Tx '+msg.substr(0,10)+']</a>'); 
		getBalance(Binance.myaccount);
	}
	let txid = await tradeSell(tkn, amt, acp, rej, cnf);
	console.log('txid', txid);
	if(txid){
		console.log('Sell', code, txid);
		showMessage('Transaction confirmed!');
        getBalance(Binance.myaccount);
	}
}

function showMessage(txt){
	$('warn').innerHTML = txt;
}

function onSwitch(){
	//let temp      = session.base;
	//session.base  = session.quote;
	//session.quote = temp;
	session.buy   = !session.buy;
	$('label-act1').innerHTML  = session.buy?'Sell':'Buy';
	$('label-act2').innerHTML  = session.buy?'Buy':'Sell';
	//let tmp = $('calc-base').value;
	//$('calc-base').value  = $('calc-quote').value;
	//$('calc-quote').value = tmp;
	updateForm();
}

function selectCurrency(code){
	console.log('Selected', code);
	session.buy   = true;
	session.code  = code;
	session.base  = 'BNB';
	session.quote = code;
	session.pair  = 'BNB/'+code;
	session.price = session.prices[code];

	var table = $('coins');
	var rows  = table.tBodies[0].rows
	for (var i = 0; i < rows.length; i++) {
		rows[i].className = '';
		if(rows[i].id==code) { rows[i].className = 'select'; }
	}

	updateForm();
	updateChart();
}

function copyToClipboard(evt) {
    var elm = evt.target;
    if(document.body.createTextRange) { /* for Internet Explorer */
	    var range = document.body.createTextRange();
	    range.moveToElementText(elm);
	    range.select();
    	document.execCommand("copy");
    } else if(window.getSelection) { /* other browsers */
	    var selection = window.getSelection();
	    var range = document.createRange();
	    range.selectNodeContents(elm);
	    selection.removeAllRanges();
	    selection.addRange(range);
    	document.execCommand("copy");
    }
}

function enableEvents() {
	$('coins').addEventListener('click', function(event){onTableClick(event)},false);
	$('calc-base').addEventListener('keyup',  calcQuote, true);
	$('calc-quote').addEventListener('keyup', calcBase,  true);
}

//---- WALLET

async function connectState(n) {
    switch(n){
        case 0:
            $('connect').enabled = true;
            $('connect').innerHTML = 'CONNECT WALLET';
            break;
        case 1:
            $('connect').enabled = false;
            $('connect').innerHTML = 'CONNECTING...';
            break;
        case 2:
            $('connect').enabled = true;
            $('connect').innerHTML = 'CONNECTED';
            break;
        case 3:
            $('connect').enabled = false;
            $('connect').innerHTML = 'DISCONNECTING';
            break;
    }
}

async function connectWallet(silent=false) {
    connectState(1); // connecting
	initWallet(); 
	session.connected = true;
    connectState(2); // connected
}

async function disconnectWallet() {
    connectState(3);
    // await disconnect(); ???
    connectState(0);
    $('user-address').innerHTML = 'Not connected';
    $('user-balance').innerHTML = 'Balance: 0.00';
}

function onWallet(){
    console.log('On wallet');
    showMessage('');
    if(!session.connected){
        connectWallet();
    } else {
        disconnectWallet();
    }
}

function onTheme(){
    console.log('On theme');
    let mode = (document.body.className=='dark-mode' ? 'light-mode' : 'dark-mode');
    setColorTheme(mode);
}

function setColorTheme(mode){
    console.log('Theme', mode);
    document.cookie  = "theme="+mode;
    document.body.className   = mode;
}

async function showBalance(address) {
    if(!address){ return; }
    let res = await getBalance(address);
}

async function main() {
	console.log('LittleJohn is running...');
	if(checkMobile()){ showMessage('Not available in mobile devices'); }
	getRates().then(()=>{
		showRates().then(()=>{
			selectCurrency('USD');
		});
	});
	enableEvents();
}

window.onload = main;


// END