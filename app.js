
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
by *either* side, *each* side sends a win message naming the score,
and waits for the corresponding iwn message from the other side. If
they match the side sends a vote for the result to the server; once a
vote from each side is recved the win is recorded.

# Protocol
# ! = send
# ? = recv

Start := !Name ?Start Game
Game := (!Event | ?Event | Win)*
Event := {'p1y': int, 'p2y': int, 'ballx': int, 'bally': int}
Win := !Win ?Win

Name := string
Start := {'start': Player}
Player := {'name': string, 'wins': int}

*/


function initPlayer(connection) {
  connection.on('data', function(msg) {
    connection.removeAllListeners('data');
    var player = new Player(connection, msg);
    debug("Welcome player " + player.info.name);
    makeMatches(player);
  });
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
  player1.connection.write(JSON.stringify({start: player2.info}));
  player2.connection.write(JSON.stringify({start: player1.info}));
}

// Fight!
server.listen(process.env['VCAP_APP_PORT'] || 3000);
