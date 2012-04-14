/*
 Each player sends when it has calculated either a bounce or a miss
 ('event') on its side. The ball moves deterministically in between
 these events, and is corrected at an event if necessary. The entire
 game state is sent at each event; i.e., the sides synchronise.

 In addition, the paddle position is sent every (few?) frame(s).

 A win must be agreed by both sides: when the winning score is reached
 by *either* side, *each* side sends a win message (with 'me' meaning
 the sending side) naming the score, and waits for the corresponding
 win message from the other side. If they match the side sends a vote
 for the result to the server; once a vote from each side is recved the
 win is recorded and the result is sent to each.

 # Protocol
 # ! = send
 # ? = recv

 Start := !Register ?Start Game
   Game := (!Move | ?Move | !Pos | ?Pos)* End
 Move := {'event': 'move', 'data': State}
 State := {'p1y': int, 'p2y': int, 'ballx': int, 'bally': int}
   End := !Win ?Win !Vote ?Result

 Register := {'event': 'register', 'data': Name}
   Name := string
 Start := {'event': 'start', 'data': Player}
   Player := {'name': string, 'wins': int}
 Pos := {'event': 'pos', 'y': int}
 Win := {'event': 'win', 'score': {'me': int, 'you': int}}
 Highscore := {'event': 'highscore', 'data': Player, 'score': int}
*/

function handleRegister(payload) {
	console.log('register');
	// NO-OP client -> server
}

function handleStart(payload) {
	console.log('start');
	// NO-OP server -> client
}

function handlePause(payload) {
	console.log('pause');
	// NO-OP server -> client
}

function handleRestart(payload) {
	console.log('restart');
	// NO-OP server -> client
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

var dictionary = []
dictionary['register'] = handleRegister;
dictionary['start'] = handleStart;
dictionary['pause'] = handlePause;
dictionary['restart'] = handleRestart;
dictionary['stop'] = handleStop;
dictionary['pos'] = handlePos;
dictionary['win'] = handleWin;
dictionary['highscore'] = handleHighscore;

// 2secs to cover 640x480 at 10f/s
var game = {
	'status': 0,
	'localY': 50,
	'remoteY': 50,
	'ballPos': {
		'x': 0,
		'y': 0
	},
	'vector': {
		'a': 0,
		'v': 0
	}
};

var scoreboard = [];
var highscores = [];

var sock = new SockJS('/socks');
var renderTimer;

sock.onopen = function() {
	console.log('open');
	// TODO start scoreboard
};

sock.onmessage = function(e) {
	console.log('message', e.data);
	log("Received message... " + e.data);
	var json = JSON.parse(e.data);
	var func = dictionary[json['event']];
	func(json.payload);
};

sock.onclose = function() {
	console.log('close');
};

$(document).ready( function() {
	if (game.status == 0) {
		$('#login-window').show();
	}
	else {
		restartGame();
	}
});

$('#signin-button').click( function() {
	$('#signin').submit();
});

$('#signin').submit( function() {
	var username = $("input#username").val();
	if (username == null || username == '') {
		return false;
	}

	$('#login-window').hide();
	$('#log-window').show();

	log("Sending username...");
	sock.send("{'register': '" + username + "'}");
	return false;
});

function startGame() {
	game.status = 1
}

function restartGame() {
	// TODO kill & restart render timer
	game.status = 1
}

function pauseGame() {
	// TODO send pause request
	game.status = 2
}

function stopGame() {
	// TODO kill render timer
	game.status = 0
}

function render() {
	//
}

function log(msg) {
	$('#log-window').append('<p>' + msg + '</p>');
}