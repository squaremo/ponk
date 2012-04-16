var FRAME_RATE = 100;
var KEYBOARD_CR = 13;
var KEYBOARD_Q = 113;
var KEYBOARD_A = 97;
var KEYBOARD_O = 111;
var KEYBOARD_P = 112;
var KEYBOARD_L = 108;

function Game() {
	this.state = new State();
}

function State() {
	this.status = 0;
	this.opponent = new Player();
	this.player = new Player();
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
	this.x = 300;
	this.y = 200;
	this.r = 10; // radius
	this.vx = 0;
	this.vy = 0;
}

State.prototype.tick = function() {
  // TODO smarter derek collision detection

  var ball = this.ball;
  var canvas = this.canvas;
  ball.x += ball.vx;
  ball.y += ball.vy;

  var ball_top_edge = ball.y - ball.r;
  var ball_bottom_edge = ball.y + ball.r;
  if ((ball_top_edge <= 0) || (ball_bottom_edge >= canvas.height)) {
    ball.vy = -ball.vy;
  }

  var bre = ball.x + ball.r;
  var ble = ball.x - ball.r;
  var lht = game.opponent.y;
  var lhb = game.opponent.y + game.opponent.h;
  var rht = game.player.y;
  var rhb = game.player.y + game.player.h;

  // left edge, NB make sure it's travelling that way
  if ((ble < 30) &&
      (ball.y > lht) && (ball.y < lhb) &&
      ball.vx < 0) {
    ball.vx = -ball.vx;
  }

  // right edge
  if ((bre >= (canvas.width - 25)) &&
      (ball.y > rht) && (ball.y < rhb) &&
      ball.vx > 0) {
    ball.vx = -ball.vx;
  }

  if (ble < 0) {
    gameWinner();
  }
  if (bre >= canvas.width) {
    gameLoser();
  }

  $('#debug-ball-pos').empty();
  $('#debug-ball-pos')
	.append('ball x:').append(game.ball.x)
	.append(', y:').append(game.ball.y)
	.append(', r:').append(game.ball.r);
}

Player.prototype.move = function(delta) {
    this.dirty = true;

	var y_min = 0;
	var y_max = game.canvas.height - this.h;
	var y_new = this.y + delta;
	if (y_new < y_min) {
		this.y = y_min;
	}
	else if (y_new > y_max) {
		this.y = y_max;
	}
	else {
		this.y = y_new;
	}

	$('#debug-player-pos').empty();
	$('#debug-player-pos')
		.append('player x:').append(game.player.x)
		.append(', y:').append(game.player.y)
		.append(', h:').append(game.player.h);
	$('#debug-opponent-pos').empty();
	$('#debug-opponent-pos')
        .append('opponent x:').append(game.opponent.x)
		.append(', y:').append(game.opponent.y)
		.append(', h:').append(game.opponent.h);
}

Player.prototype.moveUp = function() {
	this.move(-this.h);
}

Player.prototype.moveDown = function() {
	this.move(this.h);
}

Ball.prototype.fire = function() {
	// TODO generate random angle and start side
	var vx = 12;
	var vy = 3;
	game.ball.x = 30;
	game.ball.y = game.canvas.height / 2;
	game.ball.vx = vx;
	game.ball.vy = vy;
}

Ball.prototype.stop = function() {
	game.ball.vx = 0;
	game.ball.vy = 0;
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
	game.opponent.name = payload.name;
	game.opponent.h = payload.height;
	startGame();
	flash("Game on!");
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
		game.opponent.move(payload);
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

function die(event) {
  console.log({aaaaieeee: event});
  // Oh and maybe tell the user etc.
}

// 2 secs to cover 640x480 at 10f/s. So, to an approximation,
// |velocity| should translate to 640 / 20 = 32.

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
	var func = handlers[json.event];
	func(json.data);
};

sock.onclose = function() {
	// console.log('close');
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

$('#signin').submit( function() {
	var username = $("input#username").val();
	if (username == null || username == '') {
		return false;
	}

	// $.cookie("ponk-username", username, { expires: 7 });
	$('#login-window').hide();
	$('#log-window').show();

	initGame(username);
	return false;
});

function event(type, data) {
  return JSON.stringify({'event': type, 'data': data});
}

function initGame(username) {
	log("Initialising game...");
	game.canvas = document.getElementById('game-field'); // jquery didn't find this
	game.player.name = username;
	game.player.x = game.canvas.width - (10 + game.player.w);
	game.player.y = (game.canvas.height / 2) - (game.player.h / 2);
	game.opponent.name = 'unknown';
	game.opponent.x = 10;
	game.opponent.y = (game.canvas.height / 2) - (game.opponent.h / 2);

	// temp testing, for renderer
	// TODO remove when this fires from callback event
	startGame();

    // sock.send(event('register', username));
}

function startGame() {
  // game.status = 1;
  $(document).keypress( function(event) {
	// debug("key: " + event.which);
	switch (event.which) {
		case KEYBOARD_Q:
            game.opponent.moveUp(); break;
		case KEYBOARD_A:
            game.opponent.moveDown(); break;
		case KEYBOARD_P:
			game.player.moveUp(); break;
		case KEYBOARD_L:
			game.player.moveDown(); break;
		case KEYBOARD_CR:
			pauseGame(); break;
	}
  });

  $('#game-title').empty();
  $('#game-title')
    .append('<span id="localUserName">')
	.append(game.player.name)
	.append('</span> vs <span id="remoteUserName">')
	.append(game.opponent.name)
	.append('</span>');

  $('#game-window').show();
  var context = game.canvas.getContext('2d');
  renderCountdown(context);
  renderTimer = setInterval(render, FRAME_RATE);
}

function launchGame() {
  game.status = 1;
  game.ball.fire();
}

function restartGame() {
  // TODO kill & restart render timer
  game.status = 1;
  renderTimer = setInterval(render, FRAME_RATE);
}

function pauseGame() {
  // TODO send pause request
  // game.status = 2;
  console.log("pausing game, clearing " + renderTimer);
  clearInterval(renderTimer);
}

function stopGame() {
  // TODO kill render timer
  game.status = 0;
  console.log("stopping game, clearing " + renderTimer);
  clearInterval(renderTimer);
  // TODO stop key listener
}

// field is 400 high & 600 wide
function render() {
    game.tick();

    if (game.player.dirty) sock.send(event('pos', game.player.y));
    game.player.dirty = false;

	var context = game.canvas.getContext('2d');
	if (game.status != 0) {
		// blank it out
		renderClear(context);
        renderBall(context);
		renderPaddle(context, '#cc9999', game.opponent.x, game.opponent.y, game.opponent.h);
		renderPaddle(context, '#9999cc', game.player.x, game.player.y, game.player.h);
    }
}

function gameWinner() {
	var text = "Winner!"
    var context = game.canvas.getContext('2d');
    renderClear(context);
	context.font = "30pt Arial";
	context.textAlign = 'center';
	context.fillStyle = '#009900';
	context.fillText(text, 200, 0, 600);
	setTimeout("displayCountdown(3)", 1000);
}
function gameLoser() {
	var text = "Loser!"
    var context = game.canvas.getContext('2d');
    renderClear(context);
	context.font = "30pt Arial";
	context.textAlign = 'center';
	context.fillStyle = '#990000';
	context.fillText(text, 200, 0, 600);
	setTimeout("displayCountdown(3)", 1000);
    displayCountdown(3);
}


function renderCountdown(context) {
	renderClear(context);
	var i = 3;
	setTimeout("displayCountdown(" + i + ")", 1000);
}

function displayCountdown(count) {
	if (count > 0) {
		var text = "Game starts in " + count;
		var context = game.canvas.getContext('2d');
		renderClear(context);
		context.font = "20pt Arial";
		context.textAlign = 'center';
		context.fillStyle = '#999999';
		context.fillText(text, 200, 0, 600);
		count--;
		setTimeout("displayCountdown(" + count + ")", 1000);
	}
	else {
		setTimeout("launchGame()", 100);
	}
}

function renderClear(context) {
	context.clearRect(0, 0, 640, 400);
}

function renderPaddle(context, color, offset, y, h) {
	context.fillStyle = color;
	context.fillRect(offset, y, 10, h)
}

function renderBall(context) {
	// var x = ((game.canvas.width - game.ball.r) / 2) + game.ball.x;
	// var y = ((game.canvas.height - game.ball.r) / 2) + game.ball.y;
	context.fillStyle = '#333333';
	context.beginPath();
	context.arc(game.ball.x, game.ball.y, game.ball.r, 0, (Math.PI * 2), true);
	context.closePath();
	context.fill();
}

function log(msg) {
    var div = $('#log-window');
    div.append($('<p/>').text(msg));
    div.scrollTop(div.scrollTop() + 10000);
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
