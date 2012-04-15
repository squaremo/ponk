var FRAME_RATE = 25;
var KEYBOARD_Q = 113;
var KEYBOARD_A = 97;
var KEYBOARD_O = 111;
var KEYBOARD_P = 112;
var KEYBOARD_L = 108;

function State() {
	this.opponent = new Position();
	this.player = new Position();
	this.ball = new Ball();
	this.canvas = null;
}

function Position() {
	this.y = 0;
	this.h = 80;
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
  var ball = this.ball;
  ball.x += ball.vx;
  ball.y += ball.vy;
  if (ball.y < 0) {
    var xintercept = ball.x - (Math.floor(ball.y / ball.vy)) * ball.vx;
    // FIXME in general we want the whole distance the ball traveled to be
    // consistent
    ball.x = xintercept;
    ball.y = 0;
    ball.vy = -ball.vy;
  }
  else if (ball.y > MAXY) {
    var xintercept = ball.x - (Math.floor((MAXY - ball.y) / ball.vy)) * ball.vx;
    // FIXME in general we want the whole distance the ball traveled to be
    // consistent
    ball.x = xintercept;
    ball.y = MAXY;
    ball.vy = -ball.vy;
  }
}

Position.prototype.move = function(delta) {
	// TODO smarter derek collision detection
	// this calc needs to be finer, and account for movement
	// increments that are smaller than the size of the increment
	// when approaching the edge

	// log("position " + this.y + " delta: " + delta);
        this.dirty = true;
	var y_min = 0 - 160;
	var y_max = 160;
	var y_new = this.y + delta;
	if ((y_new > y_min) && (y_new < y_max)) {
		this.y = y_new;
	}
}

function handleRegister(payload) {
	console.log('register');
	// NO-OP client -> server
}

function handleStart(payload) {
  console.log('start');

  game.opponent.name = payload.name;
  $('#versus').empty();
  $('#versus')
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

function handlePause(payload) {
	console.log('pause');
	// NO-OP server -> client, client -> server
}

function handleRestart(payload) {
	console.log('restart');
	// NO-OP server -> client, client -> server
}

function handleStop(payload) {
	console.log('stop');
	// NO-OP server -> client
}

function handlePos(payload) {
	console.log('pos');
	// NO-OP server -> client
	if (isNaN(payload)) {
		log("received NaN: " + payload);
	}
	else {
	  game.opponent.move(payload);
	}
}

function handleWin(payload) {
	console.log('win');
	// NO-OP server -> client
}

function handleHighscore(payload) {
	console.log('highscore');
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

var scoreboard = [];
var highscores = [];

var sock = new SockJS('/socks');
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

	log("Sending username...");
        sock.send(event('register', username));

	// temp testing, for renderer
	$('#game-window').show();
	initGame(username);
	startGame();

	return false;
});

function event(type, data) {
  return JSON.stringify({'event': type, 'data': data});
}

function startGame() {
  game.status = 1;
  renderTimer = setInterval(render, FRAME_RATE);
  $(document).keypress( function(event) {
	switch (event.which) {
		// case KEYBOARD_Q:
		// 	game.opponent.move(0 - 30);
		// 	break;
		// case KEYBOARD_A:
		// 	game.opponent.move(30);
		// 	break;
		case KEYBOARD_P:
			game.player.move(0 - 30);
			break;
		case KEYBOARD_L:
			game.player.move(30);
			break;
	}
  });
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
	// TODO find localPlayer
	// 3var canvas = document.getElementById('game-field'); // jquery didn't find this
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

function log(msg) {
    var div = $('#log-window');
    div.append($('<p/>').text(msg));
    div.scrollTop(div.scrollTop() + 10000);
}

// Sledging

$('#sledge').submit(function() {
  var txt = $('#insult').val();
  sock.send(event('sledge', txt));
  return false;
});
