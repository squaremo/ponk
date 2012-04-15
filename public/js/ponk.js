var FRAME_RATE = 25;

function State() {
	this.p1y = 0;
	this.p1paddleHeight = 80;
	this.p2y = 0;
	this.p2paddleHeight = 80;
	this.ball = new Ball();
}

function Ball() {
	this.x = 0;
	this.y = 0;
	this.vx = 0;
	this.vy = 0;
}

function handleRegister(payload) {
	console.log('register');
	// NO-OP client -> server
}

function handleStart(payload) {
	console.log('start');
	// NO-OP server -> client
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
}

function handleWin(payload) {
	console.log('win');
	// NO-OP server -> client
}

function handleHighscore(payload) {
	console.log('highscore');
	// NO-OP server -> client
}

var dictionary = [];
dictionary['register'] = handleRegister;
dictionary['start'] = handleStart;
dictionary['pause'] = handlePause;
dictionary['restart'] = handleRestart;
dictionary['stop'] = handleStop;
dictionary['pos'] = handlePos;
dictionary['win'] = handleWin;
dictionary['highscore'] = handleHighscore;

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
	var func = dictionary[json['event']];
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
    sock.send(event('register', username));

	// temp testing, for renderer
	$('#game-window').show();
	initGame();
	startGame();

	return false;
});

function event(type, data) {
  return JSON.stringify({'event': type, 'data': data});
}

function startGame() {
  game.status = 1;
  renderTimer = setInterval('render()', FRAME_RATE);
  $(document).keypress( function(event) {
    var distance = (400 - game.p1paddleHeight) / 2;
	// this calc needs to be finer, and account for movement
	// increments that are smaller than the size of the increment
	// when approaching the edge
	if ((event.which == 111) && (game.p1y > (0 - distance))) {
      game.p1y = game.p1y - 30; // up
    }
	else if (event.which == 108 && (game.p1y < distance)) {
      game.p1y = game.p1y + 30; // down
	}
	// sock.send(event('pos', game.p1y));
  });
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

function initGame() {
	log("Initialising game...");
}

// field is 400 high & 600 wide
function render() {
	// TODO find localPlayer
	var canvas = document.getElementById('game-field'); // jquery didn't find this
	var context = canvas.getContext('2d');

	// blank it out
	context.fillStyle = '#ffffff';
	context.fillRect(0, 0, 600, 400);

	// this could move to State
	var offset = 10;
	var paddleWidth = 10;
	var localH = 80;
	var remoteH = 80;

	var localX = offset;
	var remoteX = canvas.width - (offset + paddleWidth);

	// use offsets with range 200 : -200
	// TODO derek collision detection
	var localY = canvas.height/2 - (localH/2) + game.p1y;
	var remoteY = canvas.height/2 - (remoteH/2) + game.p2y;

	context.fillStyle = '#cc9999';
	context.fillRect(localX, localY, paddleWidth, localH);
	context.fillStyle = '#9999cc';
	context.fillRect(remoteX, remoteY, paddleWidth, remoteH);

	context.fillStyle = '#333333';

	// ontext.arc(x, y, r, n, Math.PI*2, true);
	var ballX = canvas.width/2 - 5;
	var ballY = canvas.height/2 - 5;
	drawBall(context, ballX, ballY);
}

function drawBall(context, x, y) {
	// log("drawing ball at " + new Date().getTime())
	var radius = 10;
	var startAngle = 0;
	var endAngle = Math.PI*2;
	var antiClockwise = true;
	context.beginPath();
	context.arc(x, y, radius, startAngle, endAngle, antiClockwise);
	context.closePath();
	context.fill();
}

function log(msg) {
	$('#log-window').append('<p>' + msg + '</p>');
}

// Sledging

$('#sledge').submit(function() {
  var txt = $('#insult').val();
  sock.send(event('sledge', txt));
  return false;
});
