// DATABASE MODULE

const postgres = require('pg');
const dbconn   = process.env.DATABASE;
if(!dbconn){ console.log('DATASERVER NOT AVAILABLE'); }


async function getTime() { 
	let sql = 'SELECT NOW()';
	var dbp, dbc, res, data = null;
    try {
		dbp = new postgres.Pool({ connectionString: dbconn });
		dbc = await dbp.connect();
		res = await dbc.query(sql);
		if(res.rowCount>0) { 
			data = res.rows[0].now; 
		}
	} catch(ex) {
		console.log('DB time error:', ex.message);
  	} finally {
    	if (dbc) { dbc.release(); }
  	}
    console.log(new Date(), 'Server time:', data);	

	return data;
}

async function saveRates(rates) { 
	let sql    = 'INSERT INTO rates(time, code, rate) values($1, $2, $3) RETURNING recid';
	let params = [];
	var dbp, dbc, res, data = null;
	let time = new Date().toJSON().replace('T', ' ').substr(0,17)+'00';
    try {
		dbp = new postgres.Pool({ connectionString: dbconn });
		dbc = await dbp.connect();
		for (var i = 0; i < rates.length; i++) {
			params = [time, rates[i][0], rates[i][1]];
			res = await dbc.query(sql, params);
		}
	} catch(ex) {
		console.log('DB error saving rates:', ex.message); // ex.stack
  	} finally {
    	if (dbc) { dbc.release(); }
  	}
}


async function getRates() {
	let sql = 'SELECT time, code, rate FROM rates WHERE time = (SELECT time FROM rates ORDER BY time DESC LIMIT 1)';
	var dbp, dbc, res;
	let info = {time:0, data:{}};

    try {
		dbp = new postgres.Pool({ connectionString: dbconn });
		dbc = await dbp.connect();
		res = await dbc.query(sql);
		if(res.rows.length>0) {
			info.time = res.rows[0].time;
			for (var i = 0; i < res.rows.length; i++) {
				//console.log('-', rs2.rows[i]);
				info.data[res.rows[i].code] = {price: res.rows[i].rate};
			}
		}
	} catch(ex) {
		console.log('DB error getting rates:', ex.message); // ex.stack
		info.error = ex.message;
  	} finally {
    	if (dbc) { dbc.release(); }
  	}
	
	return info;
}

async function getCharts(code, date) {
	let sql    = 'SELECT time, rate FROM rates WHERE code = $1 AND time > $2 ORDER BY time';
	let params = [code, date];
	var dbp, dbc, res;
	var data = [];

    try {
		dbp = new postgres.Pool({ connectionString: dbconn });
		dbc = await dbp.connect();
		res = await dbc.query(sql, params);
		if(res.rows.length>0) { 
			for (var i = 0; i < res.rows.length; i++) {
				let row = res.rows[i];
				data.push([ row.time, row.rate ]);
			}
		}
	} catch(ex) {
		console.log('DB error getting charts:', ex.message); // ex.stack
  	} finally {
    	if (dbc) { dbc.release(); }
  	}
	
	return data;
}

async function getChange(date) {
	let sql    = 'SELECT time, code, rate FROM rates WHERE time = (SELECT DISTINCT time as time FROM rates WHERE time > $1 ORDER BY time LIMIT 1)';
	let params = [date];
	var dbp, dbc, res;
	let info = {time:0, data:{}};

    try {
		dbp = new postgres.Pool({ connectionString: dbconn });
		dbc = await dbp.connect();
		res = await dbc.query(sql, params);
		if(res.rows.length>0) {
			info.time = res.rows[0].time;
			for (var i = 0; i < res.rows.length; i++) {
				info.data[res.rows[i].code] = {price: res.rows[i].rate};
			}
		}
	} catch(ex) {
		console.log('DB error getting rates:', ex.message); // ex.stack
		info.error = ex.message;
  	} finally {
    	if (dbc) { dbc.release(); }
  	}
	
	return info;
}

exports.getTime   = getTime;
exports.getRates  = getRates;
exports.getCharts = getCharts;
exports.getChange = getChange;
exports.saveRates = saveRates;

//getTime()

// END