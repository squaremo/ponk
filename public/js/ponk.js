var FRAME_RATE = 25;
var KEYBOARD_Q = 113;
var KEYBOARD_A = 97;
var KEYBOARD_O = 111;
var KEYBOARD_P = 112;
var KEYBOARD_L = 108;

function Game() {
	this.state = new State();
}

function State() {
	this.p1 = new Player();
	this.p2 = new Player();
	this.ball = new Ball();
	this.canvas = null;
}

function Player() {
	this.name = '';
	this.x = 10;
	this.y = 0;
	this.h = 80;
	this.w = 10;
}

function Ball() {
	this.x = 0;
	this.y = 0;
	this.r = 10; // radius
	this.vx = 0;
	this.vy = 0;
}

Player.prototype.move = function(delta) {
	// TODO smarter derek collision detection

	// this calc needs to be finer, and account for movement
	// increments that are smaller/larger than the size of
	// the gap to the edge, when approaching the edge

	// log("position " + this.y + " delta: " + delta);
	var y_min = 0 - 160;
	var y_max = 160;
	var y_new = this.y + delta;
	if ((y_new > y_min) && (y_new < y_max)) {
		this.y = y_new;
	}
}

Ball.prototype.bounce = function() {
	//
}


// NB you can write text into the canvas
function flash(msg, kind) {
  var elem = $('<p/>');
  if (kind) elem.addClass(kind);
  elem.text(msg);
  $('#flash').append(elem);
  elem.fadeOut(1500, function() {
    $('#flash').empty();
  });
}

function handleRegister(payload) {
	debug('register');
	// NO-OP client -> server
}

function handleStart(payload) {
	debug('start');
	// NO-OP server -> client
	game.p2.name = payload.name;
	game.p2.h = payload.height;
	startGame();
}

function handlePause(payload) {
	debug('pause');
	// NO-OP server -> client, client -> server
}

function handleRestart(payload) {
	debug('restart');
	// NO-OP server -> client, client -> server
}

function handleStop(payload) {
	debug('stop');
	// NO-OP server -> client
}

function handlePos(payload) {
	debug('pos');
	// NO-OP server -> client
	if (isNaN(payload)) {
		log("received NaN: " + payload);
	}
	else {
		game.p2.move(payload);
	}
}

function handleWin(payload) {
	debug('win');
	// NO-OP server -> client
}

function handleHighscore(payload) {
	debug('highscore');
	// NO-OP server -> client
}

// var dictionary = [];
// dictionary['register'] = handleRegister;
// dictionary['start'] = handleStart;
// dictionary['pause'] = handlePause;
// dictionary['restart'] = handleRestart;
// dictionary['stop'] = handleStop;
// dictionary['pos'] = handlePos;
// dictionary['win'] = handleWin;
// dictionary['highscore'] = handleHighscore;

function handleSledge(txt) {
  flash(txt, 'sledge');
}

// ooh, get you.
var handlers = {
  'register' : handleRegister,
  'start': handleStart,
  'pause': handlePause,
  'restart': handleRestart,
  'stop': handleStop,
  'pos': handlePos,
  'win': handleWin,
  'highscore': handleHighscore,
  'sledge': handleSledge
};

// 2 secs to cover 640x480 at 10f/s
var game = new State();
var sock = new SockJS('/socks');

var scoreboard = [];
var highscores = [];
var renderTimer = 0;

sock.onopen = function() {
	console.log('open');
	// TODO start scoreboard
};

sock.onmessage = function(e) {
	console.log('message', e.data);
	log("Received message... " + e.data);
	var json = JSON.parse(e.data);
	var func = handlers[json['event']];
	func(json.data);
};

sock.onclose = function() {
	console.log('close');
	stopGame();
};

$(document).ready( function() {
	// TODO load game status from cookie
	var username = ''; // $.cookie("ponk-username");
	if (game.status == 2) {
		restartGame();
	}
	else if (game.status == 1) {
		startGame();
	}
	else {
		if (username != null && username != '') {
			$("input#username").val(username);
		}
		$('#login-window').show();
	}
});

$(document).unload( function() {
	stopGame();
});

$('#signin-button').click( function() {
	$('#signin').submit();
});

$('#signin').submit( function() {
	var username = $("input#username").val();
	if (username == null || username == '') {
		return false;
	}

	// $.cookie("ponk-username", username, { expires: 7 });
	$('#login-window').hide();
	$('#log-window').show();

	log("Sending username...");
	initGame(username);
	return false;
});

function event(type, data) {
  return JSON.stringify({'event': type, 'data': data});
}

function initGame(username) {
	log("Initialising game...");
	game.canvas = document.getElementById('game-field'); // jquery didn't find this
	game.p1.name = username;
	game.p2.name = 'unknown';
    sock.send(event('register', username));

	// temp testing, for renderer
	// TODO remove when this fires from callback event
	startGame();
}

function startGame() {
  game.status = 1;
  renderTimer = setInterval('render()', FRAME_RATE);
  $(document).keypress( function(event) {
	debug("key: " + event.which);
	switch (event.which) {
		case KEYBOARD_Q:
			game.p1.move(0 - 30);
			break;
		case KEYBOARD_A:
			game.p1.move(30);
			break;
		case KEYBOARD_P:
			game.p2.move(0 - 30);
			break;
		case KEYBOARD_L:
			game.p2.move(30);
			break;
	}
  });
  // <span id="localUserName">$localUser</span> vs <span id="remoteUserName">$remoteUser</span>

  $('#game-title').append('<span id="localUserName">' + game.p1.name + '</span> vs <span id="remoteUserName">' + game.p2.name + '</span>');
  $('#game-window').show();
  var context = game.canvas.getContext('2d');
  renderCountdown(context);
  // start ball
  fireBall();
}

function restartGame() {
  // TODO kill & restart render timer
  game.status = 1;
  renderTimer = setInterval('render()', FRAME_RATE);
}

function pauseGame() {
	// TODO send pause request
  game.status = 2;
  clearInterval(renderTimer);
}

function stopGame() {
  // TODO kill render timer
  game.status = 0;
  clearInterval(renderTimer);
  // TODO stop key listener
}

// field is 400 high & 600 wide
function render() {
	var context = game.canvas.getContext('2d');

	// blank it out
	renderClear(context);

	// calculate offsets
	var offset1 = 10;
	var offset2 = game.canvas.width - (offset1 * 2);

	var y1 = ((game.canvas.height - game.p1.h) / 2) + game.p1.y;
	var y2 = ((game.canvas.height - game.p2.h) / 2) + game.p2.y;

	renderPaddle(context, '#cc9999', offset1, y1, game.p1.h);
	renderPaddle(context, '#9999cc', offset2, y2, game.p2.h);
	renderBall(context);
}

function renderCountdown(context) {
	renderClear(context);
	var i = 3;
	setTimeout("displayCountdown(" + i + ")", 1000);
}

function displayCountdown(count) {
	var x = 200;
	var y = 200;
	var w = 200;
	var text = "Game starts in " + count;
	var context = game.canvas.getContext('2d');
	context.fillText(text, x, y, w);
	if (count > 0) {
		setTimeout("displayCountdown(" + (count - 1) + ")", 1000);
	}
}

function renderClear(context) {
	context.fillStyle = '#ffffff';
	context.fillRect(0, 0, 640, 400);
}

function renderPaddle(context, color, offset, y, h) {
	context.fillStyle = color;
	context.fillRect(offset, y, 10, h)
}

function renderBall(context) {
	var x = ((game.canvas.width - game.ball.r) / 2) + game.ball.x;
	var y = ((game.canvas.height - game.ball.r) / 2) + game.ball.y;
	context.fillStyle = '#333333';
	context.beginPath();
	context.arc(x, y, game.ball.r, 0, (Math.PI * 2), true);
	context.closePath();
	context.fill();
}

function fireBall() {
	//
}

function log(msg) {
	$('#log-window').append('<p>' + msg + '</p>');
}

function debug(msg) {
	var textarea = document.getElementById('debug-window-data');
	textarea.value += msg + '\n';
	// $('#debug-window-data').value +=  msg + '\n';
}

// Sledging

$('#sledge').submit(function() {
  var txt = $('#insult').val();
  sock.send(event('sledge', txt));
  return false;
});
