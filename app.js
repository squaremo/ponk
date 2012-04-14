
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

function initPlayer(connection) {
  connection.on('data', function(msg) {
    connection.removeAllListeners('data');
    var player = new Player(connection, msg);
    debug("Welcome player " + player.info.name);
    makeMatches(player);
  });
}

function Player(conn, name) {
  this.info = {name: name, wins: 0};
  this.connection = conn;
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
