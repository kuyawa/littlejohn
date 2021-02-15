//---- LITTLEJOHN

const os           = require('os');
const path         = require('path');
const ejs          = require('ejs');
const express      = require('express');
const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const api          = require('./api');
const cron         = require('./cron');
const NETWORK      = process.env.NETWORK || 'bsc-testnet';
const HOSTNAME     = os.hostname();


function hit(action) { console.log(new Date(), action); }

//---- START

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);


//---- ROUTER

app.get('/', (req, res) => { 
	hit('/index');
	let theme = req.cookies.theme || 'dark-mode';
	res.render('main.html', {theme: theme}); 
});

app.get('/api/rates', async (req, res) => { 
	hit(req.path);
    res.writeHead(200, {'Content-Type': 'application/json'}); 
	let data = await api.getRates();
	res.end(JSON.stringify(data));
});

// api/charts/usd-gbp/0
app.get('/api/charts/:code/:line', async (req, res) => { 
	hit(req.path);
	let code = req.params.code.replace('-','/').toUpperCase();
	let line = req.params.line;
	let data = await api.getCharts(code, line); // 0.day, 1.week 2.month 3.year 4.alltime
    res.writeHead(200, {'Content-Type': 'application/json'}); 
	res.end(JSON.stringify(data));
});

app.get('/cron/rates', (req, res) => { 
	hit(req.path);
	cron.getRates();
	res.send('ok');
});

app.get('/*', (req, res) => { 
	hit('404 '+req.path);
	res.send('ErrorNotFound'); // Catch all
});


//---- LISTEN

let now = new Date();
if(HOSTNAME=='MacAir.local'){ 
	console.log(now, 'LITTLEJOHN is running on', NETWORK, 'locally');
	app.listen(5000); 
} else { 
	console.log(now, 'LITTLEJOHN is running on', NETWORK, 'remotely');
	app.listen(); 
}


// END