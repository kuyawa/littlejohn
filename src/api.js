const db = require('./database');


async function getRates(){
    let oneDay = 24*60*60*1000;
    let now  = new Date();
    let time = now.getTime();
    let tini = time-oneDay;
    let date = (new Date(tini)).toJSON().replace('T',' ').substr(0,19);
    let info = await db.getRates();
    let perc = await db.getChange(date);
    for (var code in info.data) {
        if(perc.data && perc.data[code]){ 
            info.data[code].prev = perc.data[code].price;
            info.data[code].diff = ((1 - (perc.data[code].price / info.data[code].price)) * 100).toFixed(4);
        } else {
            info.data[code].prev = info.data[code].price;
            info.data[code].diff = 0.0;
        }
    }
    return info;
}

async function getCharts(code, line){
    let oneDay   =     24*60*60*1000;
    let oneWeek  =   7*24*60*60*1000;
    let oneMonth =  30*24*60*60*1000;
    let oneYear  = 365*24*60*60*1000;
    let now  = new Date();
    let time = now.getTime();
    let tini = 0;
    switch(line){
        case '0':  tini = time-oneDay; break;
        case '1':  tini = time-oneWeek; break;
        case '2':  tini = time-oneMonth; break;
        case '3':  tini = time-oneYear; break;
        case '4':  tini = 0; break;
        default: tini = time-oneDay; break;
    }
    date = (new Date(tini)).toJSON().replace('T',' ').substr(0,19);
    //console.log(code, date);
    let data = await db.getCharts(code, date);
    return data;
}

exports.getRates  = getRates;
exports.getCharts = getCharts;

// END