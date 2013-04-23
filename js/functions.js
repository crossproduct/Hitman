/**
 * Author; Chris Ross
 * crossproduct iNc.
 *
 * An investigative tool for large touchscreens and webapps for 'hit'
 * events such as touch and mouse. The purpose is to expose metrics about
 * touch performance/expectations to better serve design considerations 
 */

// some globals
var ctx;
var d;
var weather;
var MAX_SECOND_RADIUS = 100;
var MAX_MINUTE_RADIUS = 10;
var MAX_HOUR_RADIUS = 50;
var SUNRISE = "6:23";	// default NYC
var SUNSET = "8:23";	// default NYC
var isStaleWeather = true;
var LAT = "40.71417";	// default NYC
var LONG = "-74.00639";	// default NYC
var bgIsAnimating = false;
var currTime = SUNRISE;

var loopId;
var hitEvents = [];
var offScreenBuffers = [];
var currentTest;
var config;
var testData = {
		test1: {
			data:[],
		},
		test2: {
			data:[],
		},
		test3: {
			data:[],
		}
};

// minified jquery color plugin since there are bugs in animating backgroundColor css prop
(function(d){d.each(["backgroundColor","borderBottomColor","borderLeftColor","borderRightColor","borderTopColor","color","outlineColor"],function(f,e){d.fx.step[e]=function(g){if(!g.colorInit){g.start=c(g.elem,e);g.end=b(g.end);g.colorInit=true}g.elem.style[e]="rgb("+[Math.max(Math.min(parseInt((g.pos*(g.end[0]-g.start[0]))+g.start[0]),255),0),Math.max(Math.min(parseInt((g.pos*(g.end[1]-g.start[1]))+g.start[1]),255),0),Math.max(Math.min(parseInt((g.pos*(g.end[2]-g.start[2]))+g.start[2]),255),0)].join(",")+")"}});function b(f){var e;if(f&&f.constructor==Array&&f.length==3){return f}if(e=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(f)){return[parseInt(e[1]),parseInt(e[2]),parseInt(e[3])]}if(e=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(f)){return[parseFloat(e[1])*2.55,parseFloat(e[2])*2.55,parseFloat(e[3])*2.55]}if(e=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(f)){return[parseInt(e[1],16),parseInt(e[2],16),parseInt(e[3],16)]}if(e=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(f)){return[parseInt(e[1]+e[1],16),parseInt(e[2]+e[2],16),parseInt(e[3]+e[3],16)]}if(e=/rgba\(0, 0, 0, 0\)/.exec(f)){return a.transparent}return a[d.trim(f).toLowerCase()]}function c(g,e){var f;do{f=d.curCSS(g,e);if(f!=""&&f!="transparent"||d.nodeName(g,"body")){break}e="backgroundColor"}while(g=g.parentNode);return b(f)}var a={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0],transparent:[255,255,255]}})(jQuery);

window.onresize = function(event) {
	$('#hit_canvas')[0].width = window.innerWidth;
	$('#hit_canvas')[0].height = window.innerHeight;
	//document.getElementById('canvas_container').requestFullScreen();

	console.log(''+window.innerWidth+' '+window.innerHeight);
}

// application initialization
function init() {
	// reset datastructures
	resetSystem();

	// set handlers
	setHandlers();

	// resolve the time
	d = new Date();

	// attempt gps
	navigator.geolocation.getCurrentPosition(GetLocation);
	

	// calculate our sunrise and sunset objects
	getWeather();

	// get the canvas context
	ctx = $('#hit_canvas')[0].getContext("2d");
	$('#hit_canvas')[0].width = window.innerWidth;
	$('#hit_canvas')[0].height = window.innerHeight;

	// init offscreen buffers
	// idx:0 - hit trails
	var osb = document.createElement("canvas");
	osb.width = window.innerWidth;
	osb.height = window.innerHeight;
	offScreenBuffers.push(osb);

	// idx:1 - hit target
	var osb = document.createElement("canvas");
	osb.width = window.innerWidth;
	osb.height = window.innerHeight;
	offScreenBuffers.push(osb);

	return setInterval(draw, 10); // approximately 60 fps
}

// boot
$(document).ready(function() {
    loopId = init();
});

function clearSystem() {
	// clear the 
	for(var i=0; i<offScreenBuffers.length; i++){
		var os_ctx = offScreenBuffers[i].getContext("2d");
		os_ctx.clearRect(0,0,$('#hit_canvas')[0].width,$('#hit_canvas')[0].height);
	}

	switch(currentTest) {
		case 1:
			config.test1.crossHair = null;
			config.test1.isTargetSet = false;
			break;
		case 2:
			break;
		case 3: 
			break;
		default:
			break;
	}
}

function resetSystem() {
	// clear the system screen/view
	clearSystem();

	// reset some vars
	hitEvents = [];
	currentTest = null;
	config = {
		test1: {
			NUM_HIT_POINTS: 1,
			testIdx: 0,
			currentIdx: 0,
		},
		test2: {
			NUM_HIT_POINTS: 10,
			testIdx: 0,
			currentIdx: 0,
			crossHair: null,
		},
		test3: {
			NUM_HIT_POINTS: 12,
			testIdx: 0,
		}
	};

	// show info
	$('#infomatics').css('display', 'block');
}

function draw() {
	ctx.clearRect(0,0,$('#hit_canvas')[0].width,$('#hit_canvas')[0].height);
	
	//drawSeconds();
	//drawMinutes();
	//drawHours();
	//drawSecondsAnnotation();
	drawHitPoints();
	updateBackground('#232323');

	return d;
}

function setHandlers() {
	$('#hit_canvas').click(function(e){
		// process touch in context
		switch(currentTest) {
			case 1:
				test1ProcessHit(e);
				break;
			case 2:
				test2ProcessHit(e);
				break;
			case 3:
				break;
			default:
				processHit(e);
				revealInfomatics();
				break;
		}
	});

	/*
	// map mouse/touch event listeners
	$('body').on('mousedown', function(e){
		console.log('mousedown');
	});
	$('body').on('mousemove', function(e){
		console.log('mousemove');
	});
	$('body').on('mouseup', function(e){
		console.log('mouseup');
	});
	$('body').on('click', function(e){
		console.log('click');
	});
	$('body').on('doubleclick', function(e){
		console.log('doubleclick');
	});
	*/
}

function processHit(touch) {
	// store event object
	hitEvents.push(touch);

	// draw touch point based on test
	switch(currentTest) {
		case 1:
			// get the distance between touch and target
			var r = Math.sqrt(Math.pow((config.test1.crossHair.x-touch.clientX), 2) + Math.pow((config.test1.crossHair.y-touch.clientY), 2));
			var os_ctx = offScreenBuffers[0].getContext("2d");
			drawCircle(os_ctx, config.test1.crossHair.x, config.test1.crossHair.y, r, "rgba(23,193,190,1)", false, true);
			break;
		default:
			drawHitPoint(touch);
			break;
	}

	//draw crosshair


	console.log("("+event.clientX+","+event.clientY+")%O", event);


}

function revealInfomatics() {
	$('#infomatics').stop();
	$('#infomatics').animate({opacity:1.0},500);
	$('#infomatics').animate({opacity:1.0},2500);
	$('#infomatics').animate({opacity:0},2000);
}


// THA UNICORN MEAT //
function GetLocation(location) {
    LAT = location.coords.latitude;
    LONG = location.coords.longitude;
    console.log('('+LAT+','+LONG+')');
}

///////////// PRIMITIVE SHAPE DRAWING //////////////

// draw a circle given the params
function drawCircle(context, x,y,r,color,fill,stroke) {
	context.fillStyle = color;
	context.beginPath();
	context.arc(x,y,r,0,Math.PI*2,true);
	context.closePath();
	if(fill == true) {
		context.fill();
	}
	if(stroke == true) {
		context.lineWidth = 1;
		context.strokeStyle=color;
		context.stroke();
	}
}

// draws a blurred style circle given the params
function drawBlurCircle(context, x,y,r,color0,color1,fill,stroke) {
	var radgrad = ctx.createRadialGradient(x,y,r-r/4,x,y,r);
  	radgrad.addColorStop(0, color0);
  	radgrad.addColorStop(1, color1);

  	context.fillStyle = radgrad;
  	context.fillRect(0,0,window.innerWidth,window.innerHeight);
}

function drawCrossHair(context, x, y, w, h, color, stroke) {
	context.strokeStyle = color;
	context.lineWidth = 2;

	// draw horizontal line
	context.beginPath();
	context.moveTo(x-(w/2),y);
	context.lineTo(x+(w/2),y);
	context.stroke();

	// draw verical line
	context.beginPath();
	context.moveTo(x,y-(h/2));
	context.lineTo(x,y+(h/2));
	context.stroke();
}

///////////// HIGHER ORDER DRAWING /////////////////

// draw a 'touch' point
function drawHitPoint(hit) {
	// get buffer ctx
	var os_ctx = offScreenBuffers[0].getContext("2d");
	drawBlurCircle(os_ctx, hit.clientX, hit.clientY, MAX_MINUTE_RADIUS, "rgba(23,193,190,1)","rgba(23,193,190,0)", true, false);
}

// draw ALL 'touch' points from buffered canvas
function drawHitPoints() {
	ctx.drawImage(offScreenBuffers[0],0,0);
}

// draw the layout for seconds
function drawSeconds() {
	drawCircle(ctx, window.innerWidth/2, window.innerHeight/2,(20*(1000-d.getMilliseconds())/1000)+((MAX_SECOND_RADIUS*d.getSeconds())/60),"rgba(227,0,83,1)", true, false); //#E30053
	//drawBlurCircle(window.innerWidth/2, window.innerHeight/2,(20*(1000-d.getMilliseconds())/1000)+((MAX_SECOND_RADIUS*d.getSeconds())/60),"rgba(227,0,83,1)", "rgba(227,0,83,0)", true, false); //#E30053

	// draw a reference guide to the seconds unit
	drawCircle(ctx, window.innerWidth/2, window.innerHeight/2,(20*(1000-d.getMilliseconds())/1000)+MAX_SECOND_RADIUS,"rgba(227,0,83,1)", false, true); //#E30053
}

// draw the layout for minutes
function drawMinutes() {
	var min = d.getMinutes();
	for(var i=1; i<=min; i++) {
		drawCircle(ctx, window.innerWidth/2+Math.sin(i*Math.PI/30)*(2*MAX_SECOND_RADIUS+3*MAX_MINUTE_RADIUS), window.innerHeight/2-Math.cos(i*Math.PI/30)*(2*MAX_SECOND_RADIUS+3*MAX_MINUTE_RADIUS),(4*(1000-d.getMilliseconds())/1000)+MAX_MINUTE_RADIUS,"rgba(23,193,190,0.8)", true, false); //#17C1BE
		//drawBlurCircle(window.innerWidth/2+Math.sin(i*Math.PI/30)*(2*MAX_SECOND_RADIUS+3*MAX_MINUTE_RADIUS), window.innerHeight/2-Math.cos(i*Math.PI/30)*(2*MAX_SECOND_RADIUS+3*MAX_MINUTE_RADIUS),(4*(1000-d.getMilliseconds())/1000)+MAX_MINUTE_RADIUS,"rgba(23,193,190,1)","rgba(23,193,190,0)", true, false); //#17C1BE
	}
}

// draw the layout for hours
function drawHours() {
	var hours = d.getHours()%12;	// 12-hr clock
	for(var i=1; i<=hours; i++) {
		var alpha = 1.2 - (hours - i)/12;
		drawCircle(ctx, window.innerWidth/2+Math.sin(i*Math.PI/6)*(2*MAX_SECOND_RADIUS+3*MAX_MINUTE_RADIUS+2*MAX_HOUR_RADIUS), window.innerHeight/2-Math.cos(i*Math.PI/6)*(2*MAX_SECOND_RADIUS+3*MAX_MINUTE_RADIUS+2*MAX_HOUR_RADIUS),(10*(1000-d.getMilliseconds())/1000)+MAX_HOUR_RADIUS,"rgba(230,219,116,"+alpha+")", true, false); // #E6DB74
		//drawBlurCircle(window.innerWidth/2+Math.sin(i*Math.PI/6)*(2*MAX_SECOND_RADIUS+3*MAX_MINUTE_RADIUS+2*MAX_HOUR_RADIUS), window.innerHeight/2-Math.cos(i*Math.PI/6)*(2*MAX_SECOND_RADIUS+3*MAX_MINUTE_RADIUS+2*MAX_HOUR_RADIUS),(10*(1000-d.getMilliseconds())/1000)+MAX_HOUR_RADIUS,"rgba(230,219,116,1)","rgba(230,219,116,0)", true, false); // #E6DB74
	}

}

// draw the annotions on the second layout
function drawSecondsAnnotation() {

}

// updates background-color based on day as well as the sunrise and sunset animation
function updateBackground(color) {
	// across 5 seconds
	//var currTime = (d.getHours() < 12 ? d.getHours() : d.getHours()-12 )+':'+(d.getMinutes() < 10 ? ('0'+d.getMinutes()) : d.getMinutes());
		

	//console.log(currTime);
	if(currTime == SUNRISE) {
		
		if(bgIsAnimating == false) {
			bgIsAnimating = true;
			$('body').animate({'backgroundColor':'#010D65'}, (1000*6)); // dark blue #010D65
			$('body').animate({'backgroundColor':'#931A6D'}, (1000*6)); // purple #931A6D
			$('body').animate({'backgroundColor':'#FD5A5C'}, (1000*6)); // red #FD5A5C
			$('body').animate({'backgroundColor':'#F49F10'}, (1000*6)); // orange #F49F10
			$('body').animate({'backgroundColor':'#FEFED4'}, (1000*6), function() {
				bgIsAnimating = false;
				currTime = SUNSET;
			});
		}
	} else if(currTime == SUNSET) {
		if(bgIsAnimating == false) {
			bgIsAnimating = true;
			$('body').animate({'backgroundColor':'#F49F10'}, (1000*6)); // orange #F49F10
			$('body').animate({'backgroundColor':'#FD5A5C'}, (1000*6)); // red #FD5A5C
			$('body').animate({'backgroundColor':'#931A6D'}, (1000*6)); // purple #931A6D
			$('body').animate({'backgroundColor':'#010D65'}, (1000*6)); // dark blue #010D65
			$('body').animate({'backgroundColor':'#121212'}, (1000*6), function() {
				bgIsAnimating = false;
				currTime = SUNRISE;
			}); // black
			// #F49F10 orange
		}
	}else {
		
		if(bgIsAnimating == true) return;

		// need currTime represented as 24 hour so we calculate again.
		currTime = d.getHours()+':'+(d.getMinutes() < 10 ? ('0'+d.getMinutes()) : d.getMinutes());
		var sunriseInt = parseInt(SUNRISE.replace(':',''));
		var sunsetInt = parseInt(SUNSET.replace(':',''));
		var currTimeInt = parseInt(currTime.replace(':',''));
		//console.log(sunriseInt+' '+(1200+sunsetInt)+' '+currTimeInt);
		if(currTimeInt > sunriseInt && currTimeInt < (1200+sunsetInt)){
			$('body').css('background-color', '#FEFED4');
		} else {
			$('body').css('background-color', '#121212');
		}
	}
}

function mapHitEventChain() {

}

///////// TEST 1 /////////////

/**
 * This test consists of dispaying a choosen hit hit point and then capturing a broad set of attemps
 * to touch that point and record metrics.
 */
function test1() {
	console.log("XXXXXXXX "+config.test1.testIdx);
	// reset system
	resetSystem();

	// reset tests data
	testData.test1.data = [];

	// set some semaphore data for test
	currentTest = 1;

	$('#infomatics').css('display', 'none');

	// start
}

function test1ProcessHit(touch){
	if(config.test1.isTargetSet) {
		//console.log(testData.test1.data[config.test1.currentIdx]);
		// get the distance between touch and target
		var r = Math.sqrt(Math.pow((config.test1.crossHair.x-touch.clientX), 2) + Math.pow((config.test1.crossHair.y-touch.clientY), 2));

		// add r to touch
		touch.r = r;
		
		// record touch
		testData.test1.data[config.test1.currentIdx].touches.push(touch);

		// visualize
		var os_ctx = offScreenBuffers[0].getContext("2d");
		drawCircle(os_ctx, config.test1.crossHair.x, config.test1.crossHair.y, r, "rgba(23,193,190,1)", false, true);
		//processHit(touch);
	} else {
		// set the target graphic and mayke isTargetSet = true
		var os_ctx = offScreenBuffers[0].getContext("2d");
		drawCrossHair(os_ctx, touch.clientX, touch.clientY, 10, 10, "rgba(125,125,125,1)", false);
		config.test1.isTargetSet = true;
		config.test1.crossHair = {};
		config.test1.crossHair.x = touch.clientX;
		config.test1.crossHair.y = touch.clientY;
		testData.test1.data.push({});
		testData.test1.data[config.test1.currentIdx].crossHair = config.test1.crossHair;
		testData.test1.data[config.test1.currentIdx].touches = [];
	}
}

///////// TEST 2 /////////////

function test2() {
	// reset system
	resetSystem();

	// reset tests data
	testData.test2.data = [];

	// set some semaphore data for test
	currentTest = 2;

	$('#infomatics').css('display', 'none');

	// setup
	// create timer
	config.test2.timer = setTimeout(test2HandleTimeout, 2000);

	// start
}

function test2ProcessHit(touch){
	// set the radius
	touch.r = Math.sqrt(Math.pow((config.test2.crossHair.x-touch.clientX), 2) + Math.pow((config.test2.crossHair.y-touch.clientY), 2));
	console.log("r is: "+touch.r);
	// associate the touch with the data idx
	testData.test2.data[config.test2.currentIdx-1].touch = touch;
	window.clearTimeout(config.test2.timer);
	test2HandleTimeout();
}

function test2HandleTimeout() {
	if(config.test2.currentIdx < config.test2.NUM_HIT_POINTS ) {

		// set the target graphic and mayke isTargetSet = true
		var os_ctx = offScreenBuffers[0].getContext("2d");
		// clear the screen
		os_ctx.clearRect(0,0,$('#hit_canvas')[0].width,$('#hit_canvas')[0].height);

		// get a random (x,y) for drawing crosshair
		var ch = {x:(window.innerWidth*Math.random()), y:(window.innerHeight*Math.random())};
		drawCrossHair(os_ctx, ch.x, ch.y, 10, 10, "rgba(125,125,125,1)", false);
		config.test2.isTargetSet = true;
		config.test2.crossHair = ch;

		// build data object for this test iteration
		testData.test2.data[config.test2.currentIdx] = {};
		testData.test2.data[config.test2.currentIdx].crossHair = config.test2.crossHair;

		// increment counter
		config.test2.currentIdx++;

		// increment timer
		config.test2.timer = setTimeout(test2HandleTimeout, 2000);
	} else {
		alert("TEST COMPLETE");
	}
}

///////// TEST 3 /////////////

function test3() {
	// reset system
	resetSystem();

	// reset tests data
	testData.test3.data = [];

	// set some semaphore data for test
	currentTest = 3;

	// setup
	for(var i=0; i<config.test3.NUM_HIT_POINTS; i++){

	}

	// start
}

////////////////////////////

function analyzeData(){
	if($('#all_summary').css('display') != 'none') {
		$('#all_summary').css('display','none');
		return;
	}
	$('#all_summary').css('display','block');
	test1Analyze();
	test2Analyze();
	//test3Analyze();
}

function test1Analyze() {
	// get min, max, mean and median
	var min=(window.innerWidth+window.innerHeight), max=0, mean=0, median=0;
	try{
		for(var i=0; i<testData.test1.data[0].touches.length; i++){
			if(testData.test1.data[0].touches[i].r > max) max = testData.test1.data[0].touches[i].r;
			if(testData.test1.data[0].touches[i].r < min) min = testData.test1.data[0].touches[i].r;
			mean += testData.test1.data[0].touches[i].r;
		}
		mean = mean / testData.test1.data[0].touches.length;
		median = (testData.test1.data[0].touches[5].r + testData.test1.data[0].touches[6].r)/2;

		var selector;
		var dim = 150;
		selector = '#test1_results > div > #min';
		var context = $(selector)[0].getContext("2d");
		$(selector)[0].width = dim;
		$(selector)[0].height = dim;
		drawCrossHair(context, dim/2, dim/2, 10, 10, "rgba(125,125,125,1)", false);
		drawCircle(context, dim/2, dim/2, min, "rgba(23,193,190,1)", false, true);
		$('#min_value').html("Min: "+Math.round(min)+"px");

		selector = '#test1_results > div > #max';
		var context = $(selector)[0].getContext("2d");
		$(selector)[0].width = dim;
		$(selector)[0].height = dim;
		drawCrossHair(context, dim/2, dim/2, 10, 10, "rgba(125,125,125,1)", false);
		drawCircle(context, dim/2, dim/2, max, "rgba(23,193,190,1)", false, true);
		$('#max_value').html("Max: "+Math.round(max)+"px");

		selector = '#test1_results > div > #mean';
		var context = $(selector)[0].getContext("2d");
		$(selector)[0].width = dim;
		$(selector)[0].height = dim;
		drawCrossHair(context, dim/2, dim/2, 10, 10, "rgba(125,125,125,1)", false);
		drawCircle(context, dim/2, dim/2, mean, "rgba(23,193,190,1)", false, true);
		$('#mean_value').html("Mean: "+Math.round(mean)+"px");

		selector = '#test1_results > div > #median';
		var context = $(selector)[0].getContext("2d");
		$(selector)[0].width = dim;
		$(selector)[0].height = dim;
		drawCrossHair(context, dim/2, dim/2, 10, 10, "rgba(125,125,125,1)", false);
		drawCircle(context, dim/2, dim/2, median, "rgba(23,193,190,1)", false, true);
		$('#median_value').html("Mean: "+Math.round(median)+"px");
	}catch(e) {
		console.log(e);
	}

}

function test2Analyze() {
	var dim = 150;
	var resultsDiv = document.getElementById('test2_results');
	for(var i=0; i<testData.test2.data.length; i++){
		var d = document.createElement('div');
		resultsDiv.appendChild(d);
		var c = document.createElement('canvas');
		c.style.width = dim;
		c.style.height = dim;
		var context = c.getContext("2d");
		c.width = dim;
		c.height = dim;
		drawCrossHair(context, dim/2, dim/2, 10, 10, "rgba(125,125,125,1)", false);
		var s = document.createElement('span');
		try{
			s.innerHTML = "Delta: "+Math.round(testData.test2.data[i].touch.r)+"px";
			drawCircle(context, dim/2, dim/2, testData.test2.data[i].touch.r, "rgba(23,193,190,1)", false, true);
		}catch(e){
			console.log("%O",e);
		}
		d.appendChild(c);
		var br = document.createElement('br');
		d.appendChild(br);
		d.appendChild(s);
	}
}

function handleTestMenu(selector){
	var value = selector.options[selector.selectedIndex].value;  

	switch(value) {
		case '1':
			test1();
			break;
		case '2':
			test2();
			break;
		case '3':
			test3();
			break;
		default:
			console.log("unknown selection: "+value);
			break;
	}

	// reset selector
	selector.selectedIndex = 0;
}

function handleActionMenu(selector){
	var value = selector.options[selector.selectedIndex].value; 

	switch(value) {
		case '1':
			clearSystem();
			break;
		case '2':
			resetSystem();
			break;
		default:
			console.log("unknown selection: "+value);
			break;
	}

	// reset selector
	selector.selectedIndex = 0;
}

// retrieve the weater object for the given location
function getWeather() {
	$.getJSON('http://www.crossproduct.org/serviceProxies/weather.php?callback=?',{LAT:LAT,LONG:LONG},function(data){
    	
    	weather = data;
    	var sunriseDate = new Date(weather.data.sunriseDateTime);
    	var sunsetDate = new Date(weather.data.sunsetDateTime);

    	SUNRISE = sunriseDate.getUTCHours()+':'+sunriseDate.getUTCMinutes();
    	SUNSET = (sunsetDate.getUTCHours()-12)+':'+sunsetDate.getUTCMinutes();

    	$('#sunrise_text').html(SUNRISE);
    	$('#sunset_text').html(SUNSET);
    	$('#temperatureHigh_text').html(weather.data.temperatureHigh+'&deg;');
    	$('#temperatureCurrent_text').html(weather.data.temperature+'&deg;');
    	$('#temperatureLow_text').html(weather.data.temperatureLow+'&deg;');
    	$('#temperature_label').html('<b>'+weather.data.desc+'</b>');

		revealInfomatics();
	});
}