var FRAME_RATE = 50;
var KEYBOARD_Q = 113;
var KEYBOARD_A = 97;
var KEYBOARD_O = 111;
var KEYBOARD_P = 112;
var KEYBOARD_L = 108;

function Game() {
	this.state = new State();
}

function State() {
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
	this.x = 0;
	this.y = 0;
	this.r = 10; // radius
	this.vx = 0;
	this.vy = 0;
}

MAXY = 400;
MAXX = 620;

State.prototype.tick = function() {
  // TODO smarter derek collision detection

  var ball = this.ball;
  var canvas = this.canvas;
  ball.x += ball.vx;
  ball.y += ball.vy;

  var edge_w = (canvas.width / 2) - ball.r;
  var edge_h = (canvas.height / 2) - ball.r;

  if ((ball.x > edge_w) || (ball.x < -edge_w)) {
    ball.vx = -ball.vx;
  }
  if ((ball.y < -edge_h) || (ball.y > edge_h)) {
    ball.vy = -ball.vy;
  }

  return;

  var ball_edge_r = [ball.x + ball.r, ball.y]; // coord of RHS point
  var ball_edge_l = [ball.x - ball.r, ball.y]; // coord of LHS point

  var edge_r = this.player.w + this.player.x;
  var edge_l = this.opponent.w + this.opponent.x;

  var h_width = canvas.width / 2;

  if (ball_edge_l[0] <= (edge_l - h_width)) {
    //
  }
  else if (ball_edge_r[0] >= (h_width - edge_r)) {
    //
    if (true) {
	  //
    }
    debug("Stopping");
	ball.stop();
	// test for paddle
	// test for win
	return;
  }

  // FIXME in general we want the whole distance the ball traveled to be
  // consistent
  var h_half = canvas.height / 2;
  if (ball.y < -h_half) { // top of page
    var xintercept = ball.x - (Math.floor(ball.y / ball.vy)) * ball.vx;
	ball.x = xintercept;
    ball.vy = -ball.vy;
  }
  else if (ball.y > h_half) {
    var xintercept = ball.x - (Math.floor((h_half - ball.y) / ball.vy)) * ball.vx;
    ball.x = xintercept;
    ball.vy = -ball.vy;
  }

  // if (ball.y < 20) {
  //   var xintercept = ball.x - (Math.floor(ball.y / ball.vy)) * ball.vx;
  //   // FIXME in general we want the whole distance the ball traveled to be
  //   // consistent
  //   ball.x = xintercept;
  //   ball.y = 0;
  //   ball.vy = -ball.vy;
  // }
  // else if (ball.y > ((MAXY / 2) - 20)) {
  //   var xintercept = ball.x - (Math.floor((MAXY - ball.y) / ball.vy)) * ball.vx;
  //   // FIXME in general we want the whole distance the ball traveled to be
  //   // consistent
  //   ball.x = xintercept;
  //   ball.y = MAXY;
  //   ball.vy = -ball.vy;
  // }
  debug("ball.xy(" + ball.x + "," + ball.y + ")");
}

Player.prototype.move = function(delta) {
    this.dirty = true;

	var y_min = 0 - 160;
	var y_max = 160;
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
}

Player.prototype.moveUp = function() {
	this.move(0 - this.h);
}

Player.prototype.moveDown = function() {
	this.move(this.h);
}

Ball.prototype.bounce = function() {
	//
}

Ball.prototype.fire = function() {
	var vx = 12;
	var vy = 3;
	game.ball.vx = vx;
	game.ball.vy = vy;
}

Ball.prototype.stop = function() {
	game.ball.vx = 0;
	game.ball.vy = 0;
}

function handleStart(payload) {
  console.log('start');

  game.opponent.name = payload.name;
  $('#game-title').empty();
  $('#game-title')
    .append(
      $('<span/>').addClass('remotePlayer').text(game.opponent.name))
    .append(' vs ')
    .append(
      $('<span/>').addClass('localPlayer').text(game.player.name));

  // temp testing, for renderer
  $('#game-window').show();
  // TODO show opponent
  initGame();
  startGame();

  flash("Game on!");
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

$('#signin').submit( function() {
	var username = $("input#username").val();
	if (username == null || username == '') {
		return false;
	}

	// $.cookie("ponk-username", username, { expires: 7 });
	$('#login-window').hide();
	$('#log-window').show();

	initGame(username);
	startGame();

	return false;
});

function event(type, data) {
  return JSON.stringify({'event': type, 'data': data});
}

function initGame(username) {
	log("Initialising game...");
	game.canvas = document.getElementById('game-field'); // jquery didn't find this
	game.player.name = username;
	game.opponent.name = 'unknown';
    sock.send(event('register', username));

	// temp testing, for renderer
	// TODO remove when this fires from callback event
	startGame();
}

function startGame() {
  game.status = 1;
  $(document).keypress( function(event) {
	debug("key: " + event.which);
	switch (event.which) {
		// case KEYBOARD_Q:
		//  game.opponent.move(0 - 30);
		//  break;
		// case KEYBOARD_A:
		//  game.opponent.move(30);
		//  break;
		case KEYBOARD_P:
			// game.player.move(0 - game.player.h);
			game.player.moveUp();
			break;
		case KEYBOARD_L:
			// game.player.move(game.player.h);
			game.player.moveDown();
			break;
	}
  });
  // <span id="localUserName">$localUser</span> vs <span id="remoteUserName">$remoteUser</span>
  $('#game-title').append('<span id="localUserName">' + game.player.name + '</span> vs <span id="remoteUserName">' + game.opponent.name + '</span>');
  $('#game-window').show();
  var context = game.canvas.getContext('2d');
  renderCountdown(context);
  renderTimer = setInterval(render, FRAME_RATE);
}

function restartGame() {
  // TODO kill & restart render timer
  game.status = 1;
  renderTimer = setInterval(render, FRAME_RATE);
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


function initGame(playerName) {
  game = new State();
  game.player.name = playerName;
  log("Initialising game...");
  game.canvas = document.getElementById('game-field'); // jquery didn't find this
}

// field is 400 high & 600 wide
function render() {
    game.tick();
    if (game.player.dirty) sock.send(event('pos', game.player.y));
    game.player.dirty = false;

	var context = game.canvas.getContext('2d');

	// blank it out
	renderClear(context);

	// calculate offsets
	var offset1 = 10;
	var offset2 = game.canvas.width - (offset1 * 2);
	var y1 = ((game.canvas.height - game.opponent.h) / 2) + game.opponent.y;
	var y2 = ((game.canvas.height - game.player.h) / 2) + game.player.y;

	renderPaddle(context, '#cc9999', offset1, y1, game.opponent.h);
	renderPaddle(context, '#9999cc', offset2, y2, game.player.h);
	renderBall(context);
	// debug("game: " + JSON.stringify(game));
}

function renderCountdown(context) {
	renderClear(context);
	var i = 3;
	setTimeout("displayCountdown(" + i + ")", 1000);
}

function displayCountdown(count) {
	var x = 200;
	var y = 200;
	var w = 400;
	var text = "<h1>Game starts in " + count + "</h1>";
	var context = game.canvas.getContext('2d');
	context.fillText(text, x, y, w);
	if (count > 0) {
		setTimeout("displayCountdown(" + (count - 1) + ")", 1000);
	}
	else {
		setTimeout("game.ball.fire()", 1000);
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
