// CHART

var klines  = [];

function drawChart(klines){ 
    function parseData(klines, width, height) {
        var count  = klines.length;
        var ticks  = klines.map(item=>{ return parseFloat(item[1]); });
        var step   = width/(count-1);
        var min    = Math.min(...ticks);
        var max    = Math.max(...ticks);
        var diff   = max-min;
        var ratio  = height*0.7;
        if(diff>0) { ratio = height/diff*0.7; }
        //var height = 100;
        var base   = height;
        console.log(count, step, min, max, diff, ratio);
        var x = 0;
        var data = ticks.map(item=>{ var pt = {x: x, y: base-parseInt((item-min)*ratio)-50}; x+=step; return pt; });
        data.unshift({x: -4, y: 318});
        data.push({x: width+4, y: 318});
        //console.log(data);
        return data;
    }
    
    function drawCanvas() {
        var container = document.getElementById('chart');
        var width  = container.clientWidth;
        var height = container.clientHeight;
        if(container.childNodes.length>0) { container.removeChild(container.childNodes[0]); }
        var canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        canvas.setAttribute("id", "linechart");
        canvas.setAttribute('width', width); 
        canvas.setAttribute('height', height);
        container.appendChild(canvas);
    }

    var container = document.getElementById('chart');
    var width  = container.clientWidth;
    var height = container.clientHeight;
console.log('Chart', width, height)
    var data = parseData(klines, width, height);
    var list = [];
    for(var i in data) {
        list.push(parseInt(data[i].x));
        list.push(parseInt(data[i].y));
    }
//console.log('Lines', list.toString())

    drawCanvas();
    var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    poly.setAttribute("points", list.toString());
    poly.setAttribute("fill", "#58B");
    poly.setAttribute("stroke", "#369");
    poly.setAttribute("stroke-width", "4px");
    document.getElementById('linechart').appendChild(poly);
}

function onChartPeriod(n) {
    session.lines = n;
    setChartButtons(n);
    updateChart();
}

function setChartButtons(n) {
    $('chart-action0').classList.remove('selected');
    $('chart-action1').classList.remove('selected');
    $('chart-action2').classList.remove('selected');
    var tag;
    switch(n){
        case 0:  tag = $('chart-action0'); break;
        case 1:  tag = $('chart-action1'); break;
        case 2:  tag = $('chart-action2'); break;
        default: tag = $('chart-action0'); break;
    }
    tag.classList.add('selected');
}

function clearChart(market) {
    $('chart').innerHTML = '';
    $('chart-label').innerHTML = market.slice(0,-1)+' N/A';
}

async function updateChart() {
    $('chart-label').innerHTML = session.pair;
    let pair = (session.code == 'USD' ? 'BNB-USD' : 'USD-'+session.code).toLowerCase();
    let url  = '/api/charts/'+pair+'/'+session.lines;
    console.log(url);
    let res, inf;
    try {
        res = await fetch(url, {method: 'get'});
        //console.log(res);
        klines = await res.json();
        console.log('Chart', klines);
        showIndices(klines);
        drawChart(klines);
    } catch(ex) {
        console.log('Error fetching chart data', ex);
        inf = {error:ex.message};
    }
}

// END