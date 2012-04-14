var express = require('express'),
sockjs = require('sockjs');

function debug(msg) {
  console.log(msg);
}

var server = express.createServer();

server.configure(
  function() {
    server.use(express.static(__dirname + '/public'))
  });

var socks = sockjs.createServer();
socks.installHandlers(server, {prefix:'/socks'});

socks.on('connection', function(conn) {
  initPlayer(conn);
});

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
State := {'p1y': int, 'p2y': int, 'ball': Ball}
Ball := {'x': int, 'y': int, 'vx': int, 'vy': int}
End := !Win ?Win !Vote ?Result

Register := {'event': 'register', 'data': Name}
Name := string
Start := {'event': 'start', 'data': Player}
Player := {'name': string, 'wins': int}
Pos := {'event': 'pos', 'y': int}
Win := {'event': 'win', 'score': {'me': int, 'you': int}}

*/


function initPlayer(connection) {
  var player = new Player(connection);
  connection.on('data', function(msg) {
    var event = JSON.parse(msg);
    player.handler(event);
  });
  connection.on('end', function() {
    // Um.
  });
}

function Player(conn) {
  this.info = {wins: 0};
  this.connection = conn;
  this.handler = registering;
}

Player.prototype.breakHorribly = function(state, event) {
  debug({bork: {state: state, event: event}});
}

function registering(event) {
  switch (event.event) {
  case 'register':
    this.info.name = event.data;
    debug({welcome: this.info});
    this.match();
    break;
  default:
    this.breakHorribly('registering', event);
  }
}

Player.prototype.match = function() {
  this.handler = matching;
  makeMatches(this);
};

Player.prototype.play = function(opponent) {
  this.connection.write(JSON.stringify({event: 'start', data: opponent.info}));
  this.handler = playing;
}

function matching(event) {
  this.breakHorribly('matching', event);
}

function playing(event) {
  debug({player: this.info, event: event});
}

var queue = [];
function makeMatches(player) {
  queue.push(player);
  attemptMatches();
}

function attemptMatches() {
  if (queue.length > 1) {
    var player1 = queue.shift();
    var player2 = queue.shift();
    gameOn(player1, player2);
    attemptMatches();
  }
}

function gameOn(player1, player2) {
  debug("Matching " + player1.info.name + " with " + player2.info.name);
  player1.play(player2);
  player2.play(player1);
  playUntilFinish(player1, player2);
}

function playUntilFinish(player1, player2) {
  function hookup(player1, player2) {
    player1.connection.on('data', function(msg) {
      var event = JSON.parse(msg);
      switch (event.event) {
      case 'pos':
      case 'win':
      case 'move':
        player2.connection.write(msg);
      }
    });
  }
  hookup(player1, player2);
  hookup(player2, player1);
}

// Fight!
server.listen(process.env['VCAP_APP_PORT'] || 3000);
